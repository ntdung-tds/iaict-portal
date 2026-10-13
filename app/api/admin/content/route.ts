import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession, type AdminRole } from "@/lib/admin-auth";
import {
  bodyFromPublication,
  estimateReadingTime,
  getCmsSnapshot,
  isPublicationPublic,
  persistCmsState,
  type CmsInteraction,
  type CmsPublication,
  type CmsPublicationVersion,
  type CmsState,
  type CmsUserRole,
  type CmsWorkflowAction,
} from "@/lib/cms-store";
import { publicationHtmlToPlainText, sanitizePublicationHtml } from "@/lib/content-html";
import { getMediaSnapshot } from "@/lib/media-store";
import type { PublicationType } from "@/lib/publications";

type MutationAction = CmsWorkflowAction;

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
  coverMediaId?: string | null;
  ogMediaId?: string | null;
  publishAt?: string;
};

type MutationRequest = {
  action?: MutationAction;
  expectedRevision?: number;
  item?: ContentInput;
  id?: string;
  feedback?: string;
};

const ROLE_ACTIONS: Record<AdminRole, Set<MutationAction>> = {
  editor: new Set(["save-draft", "submit-review", "delete", "comment"]),
  reviewer: new Set(["return-draft", "schedule", "publish", "comment"]),
  superadmin: new Set([
    "save-draft",
    "submit-review",
    "return-draft",
    "schedule",
    "publish",
    "unpublish",
    "delete",
    "comment",
  ]),
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

function statePayload(state: CmsState, storageReady: boolean, materialized = true, session?: { username: string; role: AdminRole }) {
  return {
    revision: state.revision,
    updatedAt: state.updatedAt,
    storageReady,
    materialized,
    items: state.items.map(publicDto),
    audit: state.audit.slice(0, 50),
    currentUser: session ? { username: session.username, role: session.role } : undefined,
  };
}

function dateInBangkok(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function resolveMediaId(
  input: ContentInput,
  key: "coverMediaId" | "ogMediaId",
  existing?: CmsPublication,
  origin?: CmsPublication,
) {
  if (Object.prototype.hasOwnProperty.call(input, key)) {
    const value = input[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }
  return existing?.[key] ?? origin?.[key];
}

function hasPermission(role: AdminRole, action: MutationAction) {
  return ROLE_ACTIONS[role].has(action);
}

function sameMinute(left: string, right: string) {
  const a = Date.parse(left);
  const b = Date.parse(right);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.floor(a / 60000) === Math.floor(b / 60000);
}

function scheduleConflict(items: CmsPublication[], publishAt: string, ignoredIds: Set<string>) {
  return items.find((item) => {
    if (ignoredIds.has(item.id) || !item.publishAt) return false;
    if (item.status !== "scheduled" && item.status !== "published") return false;
    if (Date.parse(item.publishAt) <= Date.now()) return false;
    return sameMinute(item.publishAt, publishAt);
  });
}

function suggestedScheduleTimes(items: CmsPublication[], publishAt: string, ignoredIds: Set<string>) {
  const base = Date.parse(publishAt);
  if (!Number.isFinite(base)) return [];
  return [30, 60, 90, 120, 150, 180]
    .map((minutes) => new Date(base + minutes * 60000).toISOString())
    .filter((candidate) => !scheduleConflict(items, candidate, ignoredIds))
    .slice(0, 3);
}

function actionMessage(action: MutationAction, feedback: string, publishAt?: string) {
  if (action === "save-draft") return feedback || "Đã lưu một phiên bản nháp mới.";
  if (action === "submit-review") return feedback || "Đã gửi nội dung để duyệt.";
  if (action === "return-draft") return feedback;
  if (action === "schedule") return `${feedback ? `${feedback} · ` : ""}Đã duyệt và lên lịch xuất bản lúc ${publishAt ? new Date(publishAt).toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" }) : "thời điểm đã chọn"}.`;
  if (action === "publish") return feedback || "Đã duyệt và xuất bản nội dung.";
  if (action === "unpublish") return feedback || "Đã gỡ nội dung khỏi trạng thái công khai.";
  if (action === "delete") return feedback || "Đã xóa nội dung chưa công khai.";
  return feedback;
}

function appendInteraction(
  interactions: CmsInteraction[],
  input: {
    publicationId: string;
    actor: string;
    role: CmsUserRole;
    action: MutationAction;
    message: string;
    versionId?: string;
    at: string;
  },
) {
  return [
    {
      id: crypto.randomUUID(),
      at: input.at,
      actor: input.actor,
      role: input.role,
      publicationId: input.publicationId,
      kind: input.action === "comment" ? "comment" as const : "action" as const,
      action: input.action,
      message: input.message,
      versionId: input.versionId,
    },
    ...interactions,
  ].slice(0, 1000);
}

function appendVersion(
  versions: CmsPublicationVersion[],
  publication: CmsPublication,
  actor: string,
  role: CmsUserRole,
  action: Exclude<MutationAction, "comment">,
  at: string,
) {
  const previous = versions.filter((version) => version.publicationId === publication.id);
  const nextNumber = previous.reduce((max, version) => Math.max(max, version.number), 0) + 1;
  const version: CmsPublicationVersion = {
    id: crypto.randomUUID(),
    publicationId: publication.id,
    number: nextNumber,
    at,
    actor,
    role,
    action,
    snapshot: publication,
  };
  const next = [version, ...versions];
  const counts = new Map<string, number>();
  return {
    version,
    versions: next.filter((entry) => {
      const count = counts.get(entry.publicationId) ?? 0;
      if (count >= 30) return false;
      counts.set(entry.publicationId, count + 1);
      return true;
    }),
  };
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  const snapshot = await getCmsSnapshot();
  const url = new URL(request.url);
  const publicationId = url.searchParams.get("publicationId");

  if (publicationId) {
    const interactions = snapshot.state.interactions
      .filter((entry) => entry.publicationId === publicationId)
      .sort((a, b) => b.at.localeCompare(a.at));
    const versions = snapshot.state.versions
      .filter((entry) => entry.publicationId === publicationId)
      .sort((a, b) => b.number - a.number)
      .map((entry) => ({
        ...entry,
        snapshot: publicDto(entry.snapshot),
      }));
    return json({ publicationId, interactions, versions, currentUser: { username: session.username, role: session.role } });
  }

  return json(statePayload(snapshot.state, snapshot.storageReady, snapshot.materialized, session));
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

  const action = payload.action;
  if (!action) return json({ error: "MISSING_ACTION" }, 400);
  if (!hasPermission(session.role, action)) {
    return json({ error: "FORBIDDEN_ACTION", message: "Tài khoản hiện tại không có quyền thực hiện thao tác này." }, 403);
  }

  const [snapshot, mediaSnapshot] = await Promise.all([getCmsSnapshot(), getMediaSnapshot()]);
  if (!snapshot.storageReady) return json({ error: "STORAGE_NOT_CONFIGURED" }, 503);

  const current = snapshot.state;
  if (typeof payload.expectedRevision === "number" && payload.expectedRevision !== current.revision) {
    return json(
      {
        error: "REVISION_CONFLICT",
        message: "Dữ liệu đã thay đổi ở phiên làm việc khác. Hãy tải lại trước khi tiếp tục.",
        ...statePayload(current, true, snapshot.materialized, session),
      },
      409,
    );
  }

  const feedback = payload.feedback?.trim() ?? "";
  if (action === "return-draft" && !feedback) {
    return json({ error: "RETURN_REASON_REQUIRED", message: "Khi trả lại nội dung, bắt buộc nhập lý do hoặc yêu cầu chỉnh sửa." }, 400);
  }
  if (action === "comment" && !feedback) {
    return json({ error: "COMMENT_REQUIRED", message: "Nội dung phản hồi không được để trống." }, 400);
  }

  const now = new Date().toISOString();
  let items = [...current.items];
  let versions = [...current.versions];
  let interactions = [...current.interactions];
  let auditTitle = "";
  let auditPublicationId = "";
  let auditVersionId: string | undefined;

  if (action === "comment") {
    const target = items.find((item) => item.id === payload.id);
    if (!target) return json({ error: "NOT_FOUND" }, 404);
    auditTitle = target.title;
    auditPublicationId = target.id;
    interactions = appendInteraction(interactions, {
      publicationId: target.id,
      actor: session.username,
      role: session.role,
      action,
      message: feedback,
      at: now,
    });
  } else if (action === "delete") {
    const target = items.find((item) => item.id === payload.id);
    if (!target) return json({ error: "NOT_FOUND" }, 404);
    if (isPublicationPublic(target)) {
      return json({ error: "PUBLIC_DELETE_BLOCKED", message: "Hãy gỡ xuất bản hoặc hủy lịch trước khi xóa." }, 409);
    }
    if (session.role === "editor" && target.status !== "draft") {
      return json({ error: "EDITOR_DELETE_BLOCKED", message: "Biên tập viên chỉ được xóa nội dung đang ở trạng thái nháp." }, 403);
    }
    auditTitle = target.title;
    auditPublicationId = target.id;
    const versionResult = appendVersion(versions, target, session.username, session.role, action, now);
    versions = versionResult.versions;
    auditVersionId = versionResult.version.id;
    interactions = appendInteraction(interactions, {
      publicationId: target.id,
      actor: session.username,
      role: session.role,
      action,
      message: actionMessage(action, feedback),
      versionId: auditVersionId,
      at: now,
    });
    items = items.filter((item) => item.id !== target.id);
  } else if (action === "unpublish" || action === "return-draft") {
    const target = items.find((item) => item.id === payload.id);
    if (!target) return json({ error: "NOT_FOUND" }, 404);
    if (action === "return-draft" && session.role === "reviewer" && target.status !== "review" && target.status !== "scheduled") {
      return json({ error: "INVALID_REVIEW_STATE", message: "Người duyệt chỉ có thể trả lại nội dung đang chờ duyệt hoặc đã lên lịch." }, 409);
    }
    const updated: CmsPublication = { ...target, status: "draft", publishAt: undefined, updatedAt: now };
    items = items.map((item) => item.id === target.id ? updated : item);
    auditTitle = target.title;
    auditPublicationId = target.id;
    const versionResult = appendVersion(versions, updated, session.username, session.role, action, now);
    versions = versionResult.versions;
    auditVersionId = versionResult.version.id;
    interactions = appendInteraction(interactions, {
      publicationId: target.id,
      actor: session.username,
      role: session.role,
      action,
      message: actionMessage(action, feedback),
      versionId: auditVersionId,
      at: now,
    });
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

    if (session.role === "editor" && existing && existing.status !== "draft" && (action === "save-draft" || action === "submit-review")) {
      return json({ error: "EDITOR_STATE_LOCKED", message: "Nội dung đã rời trạng thái nháp. Biên tập viên cần chờ phản hồi hoặc quyết định của người duyệt." }, 409);
    }
    if (session.role === "reviewer" && (action === "schedule" || action === "publish") && existing?.status !== "review") {
      return json({ error: "REVIEW_REQUIRED", message: "Người duyệt chỉ được duyệt nội dung đang ở trạng thái Chờ duyệt." }, 409);
    }

    const slugConflict = items.find(
      (item) =>
        (item.status === "published" || item.status === "scheduled") &&
        item.slug === slug &&
        item.id !== existing?.id &&
        item.id !== origin?.id,
    );
    if ((action === "publish" || action === "schedule") && slugConflict) {
      return json({ error: "SLUG_CONFLICT", message: "Slug này đang được một bài đã xuất bản hoặc đã lên lịch sử dụng." }, 409);
    }

    let requestedPublishAt: string | undefined;
    if (input.publishAt) {
      const parsed = Date.parse(input.publishAt);
      if (!Number.isFinite(parsed)) {
        return json({ error: "INVALID_PUBLISH_TIME", message: "Ngày và giờ xuất bản không hợp lệ." }, 400);
      }
      requestedPublishAt = new Date(parsed).toISOString();
    }

    let scheduledPublishAt: string | undefined;
    if (action === "schedule") {
      const scheduleSource = requestedPublishAt ?? existing?.publishAt;
      const parsedSchedule = scheduleSource ? Date.parse(scheduleSource) : Number.NaN;
      if (!Number.isFinite(parsedSchedule)) {
        return json({ error: "SCHEDULE_REQUIRED", message: "Cần chọn ngày và giờ xuất bản hợp lệ." }, 400);
      }
      if (parsedSchedule <= Date.now()) {
        return json({ error: "SCHEDULE_MUST_BE_FUTURE", message: "Thời điểm lên lịch phải ở tương lai." }, 400);
      }
      scheduledPublishAt = new Date(parsedSchedule).toISOString();
      const ignoredIds = new Set([existing?.id, origin?.id].filter(Boolean) as string[]);
      const conflict = scheduleConflict(items, scheduledPublishAt, ignoredIds);
      if (conflict) {
        return json({
          error: "SCHEDULE_CONFLICT",
          message: `Khung giờ này đã được duyệt cho “${conflict.title}”. Hãy chọn thời điểm khác.`,
          conflict: { id: conflict.id, title: conflict.title, publishAt: conflict.publishAt },
          suggestedTimes: suggestedScheduleTimes(items, scheduledPublishAt, ignoredIds),
        }, 409);
      }
    }

    if (action === "submit-review" && requestedPublishAt && Date.parse(requestedPublishAt) <= Date.now()) {
      return json({ error: "PROPOSED_TIME_MUST_BE_FUTURE", message: "Thời gian đề xuất xuất bản phải ở tương lai." }, 400);
    }

    const coverMediaId = resolveMediaId(input, "coverMediaId", existing, origin);
    const ogMediaId = resolveMediaId(input, "ogMediaId", existing, origin);
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
    const nextStatus =
      action === "publish"
        ? "published"
        : action === "schedule"
          ? "scheduled"
          : action === "submit-review"
            ? "review"
            : "draft";
    const publishAt =
      action === "publish"
        ? now
        : action === "schedule"
          ? scheduledPublishAt
          : action === "submit-review"
            ? requestedPublishAt ?? existing?.publishAt
            : requestedPublishAt ?? existing?.publishAt;
    const publishedAt = publishAt
      ? dateInBangkok(publishAt)
      : existing?.publishedAt ?? origin?.publishedAt ?? dateInBangkok(now);

    const nextItem: CmsPublication = {
      id,
      originSlug: input.originSlug ?? existing?.originSlug,
      status: nextStatus,
      title,
      slug,
      category: input.category?.trim() || "Tin hoạt động Viện",
      type,
      publishedAt,
      publishAt,
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
        (item) => item.id === nextItem.id || !(item.status === "published" && item.slug === nextItem.originSlug),
      );
    }

    const existingIndex = items.findIndex((item) => item.id === nextItem.id);
    if (existingIndex >= 0) items[existingIndex] = nextItem;
    else items.unshift(nextItem);

    auditTitle = nextItem.title;
    auditPublicationId = nextItem.id;
    const versionResult = appendVersion(versions, nextItem, session.username, session.role, action, now);
    versions = versionResult.versions;
    auditVersionId = versionResult.version.id;
    interactions = appendInteraction(interactions, {
      publicationId: nextItem.id,
      actor: session.username,
      role: session.role,
      action,
      message: actionMessage(action, feedback, nextItem.publishAt),
      versionId: auditVersionId,
      at: now,
    });
  }

  const nextState: CmsState = {
    schemaVersion: 1,
    revision: current.revision + 1,
    updatedAt: now,
    items,
    versions,
    interactions,
    audit: [
      {
        id: crypto.randomUUID(),
        at: now,
        actor: session.username,
        role: session.role,
        action,
        publicationId: auditPublicationId,
        title: auditTitle,
        message: feedback || undefined,
        versionId: auditVersionId,
      },
      ...current.audit,
    ].slice(0, 300),
  };

  try {
    await persistCmsState(nextState);
  } catch {
    return json({ error: "STORAGE_WRITE_FAILED" }, 503);
  }

  return json(statePayload(nextState, true, true, session));
}
