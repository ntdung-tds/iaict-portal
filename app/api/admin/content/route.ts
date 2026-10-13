import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import {
  bodyFromPublication,
  estimateReadingTime,
  getCmsSnapshot,
  persistCmsState,
  type CmsPublication,
  type CmsState,
} from "@/lib/cms-store";
import { publicationHtmlToPlainText, sanitizePublicationHtml } from "@/lib/content-html";
import { getMediaSnapshot } from "@/lib/media-store";
import type { PublicationType } from "@/lib/publications";

type MutationAction = "save-draft" | "publish" | "unpublish" | "delete";

type ContentInput = {
  id?: string;
  originSlug?: string;
  title?: string;
  slug?: string;
  category?: string;
  type?: PublicationType;
  excerpt?: string;
  body?: string;
  keywords?: string[];
  featured?: boolean;
  coverMediaId?: string;
  ogMediaId?: string;
};

type MutationRequest = {
  action?: MutationAction;
  expectedRevision?: number;
  item?: ContentInput;
  id?: string;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function requireAdmin() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function publicDto(item: CmsPublication) {
  return {
    ...item,
    body: bodyFromPublication(item),
  };
}

function statePayload(state: CmsState, storageReady: boolean, materialized = true) {
  return {
    revision: state.revision,
    updatedAt: state.updatedAt,
    storageReady,
    materialized,
    items: state.items.map(publicDto),
    audit: state.audit.slice(0, 50),
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  const snapshot = await getCmsSnapshot();
  return json(statePayload(snapshot.state, snapshot.storageReady, snapshot.materialized));
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  let payload: MutationRequest;
  try {
    payload = (await request.json()) as MutationRequest;
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const [snapshot, mediaSnapshot] = await Promise.all([getCmsSnapshot(), getMediaSnapshot()]);
  if (!snapshot.storageReady) return json({ error: "STORAGE_NOT_CONFIGURED" }, 503);

  const current = snapshot.state;
  if (typeof payload.expectedRevision === "number" && payload.expectedRevision !== current.revision) {
    return json(
      {
        error: "REVISION_CONFLICT",
        message: "Dữ liệu đã thay đổi ở phiên làm việc khác. Hãy tải lại trước khi tiếp tục.",
        ...statePayload(current, true, snapshot.materialized),
      },
      409,
    );
  }

  const action = payload.action;
  if (!action) return json({ error: "MISSING_ACTION" }, 400);

  const now = new Date().toISOString();
  let items = [...current.items];
  let auditTitle = "";
  let auditPublicationId = "";

  if (action === "delete") {
    const target = items.find((item) => item.id === payload.id);
    if (!target) return json({ error: "NOT_FOUND" }, 404);
    if (target.status === "published") {
      return json({ error: "PUBLISHED_DELETE_BLOCKED", message: "Hãy gỡ xuất bản trước khi xóa." }, 409);
    }
    items = items.filter((item) => item.id !== target.id);
    auditTitle = target.title;
    auditPublicationId = target.id;
  } else if (action === "unpublish") {
    const target = items.find((item) => item.id === payload.id);
    if (!target) return json({ error: "NOT_FOUND" }, 404);
    items = items.map((item) =>
      item.id === target.id ? { ...item, status: "draft" as const, updatedAt: now } : item,
    );
    auditTitle = target.title;
    auditPublicationId = target.id;
  } else {
    const input = payload.item ?? {};
    const title = input.title?.trim() ?? "";
    if (!title) return json({ error: "TITLE_REQUIRED" }, 400);

    const type: PublicationType = ["news", "insight", "notice", "event"].includes(input.type ?? "")
      ? (input.type as PublicationType)
      : "news";
    const slug = slugify(input.slug?.trim() || title);
    if (!slug) return json({ error: "SLUG_REQUIRED" }, 400);

    const existing = input.id ? items.find((item) => item.id === input.id) : undefined;
    const origin = input.originSlug
      ? items.find((item) => item.status === "published" && item.slug === input.originSlug)
      : undefined;

    const conflict = items.find(
      (item) =>
        item.status === "published" &&
        item.slug === slug &&
        item.id !== existing?.id &&
        item.id !== origin?.id,
    );
    if (action === "publish" && conflict) {
      return json({ error: "SLUG_CONFLICT", message: "Slug này đang được một bài đã xuất bản sử dụng." }, 409);
    }

    const coverMediaId = input.coverMediaId ?? existing?.coverMediaId ?? origin?.coverMediaId;
    const ogMediaId = input.ogMediaId ?? existing?.ogMediaId ?? origin?.ogMediaId;
    const mediaIds = new Set(mediaSnapshot.state.items.map((item) => item.id));
    if (coverMediaId && !mediaIds.has(coverMediaId)) {
      return json({ error: "COVER_MEDIA_NOT_FOUND", message: "Ảnh đại diện không còn tồn tại trong Thư viện Media." }, 409);
    }
    if (ogMediaId && !mediaIds.has(ogMediaId)) {
      return json({ error: "OG_MEDIA_NOT_FOUND", message: "Ảnh OpenGraph không còn tồn tại trong Thư viện Media." }, 409);
    }

    const rawBody =
      typeof input.body === "string"
        ? input.body
        : existing
          ? bodyFromPublication(existing)
          : origin
            ? bodyFromPublication(origin)
            : "";
    const contentHtml = sanitizePublicationHtml(rawBody.trim());
    const excerpt = input.excerpt?.trim() || existing?.excerpt || origin?.excerpt || "";
    const id = existing?.id ?? `cms:${crypto.randomUUID()}`;
    const publishedAt =
      action === "publish"
        ? existing?.status === "published"
          ? existing.publishedAt
          : new Date().toISOString().slice(0, 10)
        : existing?.publishedAt ?? origin?.publishedAt ?? new Date().toISOString().slice(0, 10);

    const nextItem: CmsPublication = {
      id,
      originSlug: input.originSlug ?? existing?.originSlug,
      status: action === "publish" ? "published" : "draft",
      title,
      slug,
      category: input.category?.trim() || "Tin hoạt động Viện",
      type,
      publishedAt,
      readingTime: estimateReadingTime(`${excerpt} ${publicationHtmlToPlainText(contentHtml)}`),
      excerpt,
      lede: excerpt,
      featured: Boolean(input.featured),
      keywords: Array.isArray(input.keywords) ? input.keywords.map((value) => value.trim()).filter(Boolean) : [],
      sections: [],
      contentHtml,
      coverMediaId,
      ogMediaId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (action === "publish" && nextItem.originSlug) {
      items = items.filter(
        (item) =>
          item.id === nextItem.id ||
          !(item.status === "published" && item.slug === nextItem.originSlug),
      );
    }

    const existingIndex = items.findIndex((item) => item.id === nextItem.id);
    if (existingIndex >= 0) {
      items[existingIndex] = nextItem;
    } else {
      items.unshift(nextItem);
    }

    auditTitle = nextItem.title;
    auditPublicationId = nextItem.id;
  }

  const nextState: CmsState = {
    schemaVersion: 1,
    revision: current.revision + 1,
    updatedAt: now,
    items,
    audit: [
      {
        id: crypto.randomUUID(),
        at: now,
        actor: session.username,
        action,
        publicationId: auditPublicationId,
        title: auditTitle,
      },
      ...current.audit,
    ].slice(0, 100),
  };

  try {
    await persistCmsState(nextState);
  } catch {
    return json({ error: "STORAGE_WRITE_FAILED" }, 503);
  }

  return json(statePayload(nextState, true));
}
