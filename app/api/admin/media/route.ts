import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { getCmsSnapshot } from "@/lib/cms-store";
import {
  deleteMediaBlob,
  getMediaSnapshot,
  mediaExtensionForType,
  persistMediaState,
  uploadMediaBlob,
  type MediaState,
} from "@/lib/media-store";
import type { MediaAsset } from "@/lib/media-types";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

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

function payload(state: MediaState, storageReady: boolean, materialized = true) {
  return {
    revision: state.revision,
    updatedAt: state.updatedAt,
    storageReady,
    materialized,
    items: [...state.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  const snapshot = await getMediaSnapshot();
  return json(payload(snapshot.state, snapshot.storageReady, snapshot.materialized));
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const snapshot = await getMediaSnapshot();
    if (!snapshot.storageReady) return json({ error: "STORAGE_NOT_CONFIGURED" }, 503);

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return json({ error: "INVALID_FORM" }, 400);
    }

    const file = form.get("file");
    const expectedRevision = Number(form.get("expectedRevision"));
    if (Number.isFinite(expectedRevision) && expectedRevision !== snapshot.state.revision) {
      return json(
        {
          error: "REVISION_CONFLICT",
          message: "Thư viện đã thay đổi ở phiên làm việc khác. Hãy tải lại trước khi tiếp tục.",
          ...payload(snapshot.state, true, snapshot.materialized),
        },
        409,
      );
    }

    if (!(file instanceof File)) return json({ error: "FILE_REQUIRED" }, 400);
    if (!mediaExtensionForType(file.type)) {
      return json({ error: "UNSUPPORTED_MEDIA_TYPE", message: "Chỉ hỗ trợ JPEG, PNG, WebP, GIF và AVIF." }, 415);
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return json({ error: "FILE_TOO_LARGE", message: "Ảnh phải có dung lượng từ 1 byte đến 8 MB." }, 413);
    }

    const alt = cleanText(form.get("alt"), 240);
    const caption = cleanText(form.get("caption"), 600);
    if (!alt) return json({ error: "ALT_REQUIRED", message: "Cần nhập mô tả ảnh (alt text) trước khi tải lên." }, 400);

    const id = crypto.randomUUID();
    let uploaded: { filename: string; pathname: string; publicUrl: string } | null = null;

    try {
      uploaded = await uploadMediaBlob(file, id);
      const now = new Date().toISOString();
      const asset: MediaAsset = {
        id,
        filename: uploaded.filename,
        originalName: file.name.slice(0, 220),
        pathname: uploaded.pathname,
        publicUrl: uploaded.publicUrl,
        contentType: file.type,
        size: file.size,
        alt,
        caption,
        createdAt: now,
        updatedAt: now,
      };

      const nextState: MediaState = {
        schemaVersion: 1,
        revision: snapshot.state.revision + 1,
        updatedAt: now,
        items: [asset, ...snapshot.state.items],
      };
      await persistMediaState(nextState);
      return json(payload(nextState, true));
    } catch {
      if (uploaded?.pathname) {
        try {
          await deleteMediaBlob(uploaded.pathname);
        } catch {
          // Best-effort rollback. An orphaned private blob is safer than a broken manifest.
        }
      }
      return json({ error: "MEDIA_UPLOAD_FAILED", message: "Không thể lưu ảnh vào kho Media." }, 503);
    }
  }

  let body: {
    action?: "update" | "delete";
    expectedRevision?: number;
    id?: string;
    alt?: string;
    caption?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const snapshot = await getMediaSnapshot();
  if (!snapshot.storageReady) return json({ error: "STORAGE_NOT_CONFIGURED" }, 503);
  if (typeof body.expectedRevision === "number" && body.expectedRevision !== snapshot.state.revision) {
    return json(
      {
        error: "REVISION_CONFLICT",
        message: "Thư viện đã thay đổi ở phiên làm việc khác. Hãy tải lại trước khi tiếp tục.",
        ...payload(snapshot.state, true, snapshot.materialized),
      },
      409,
    );
  }

  const asset = snapshot.state.items.find((item) => item.id === body.id);
  if (!asset) return json({ error: "NOT_FOUND" }, 404);

  if (body.action === "update") {
    const alt = (body.alt ?? "").trim().slice(0, 240);
    const caption = (body.caption ?? "").trim().slice(0, 600);
    if (!alt) return json({ error: "ALT_REQUIRED", message: "Alt text không được để trống." }, 400);

    const now = new Date().toISOString();
    const nextState: MediaState = {
      schemaVersion: 1,
      revision: snapshot.state.revision + 1,
      updatedAt: now,
      items: snapshot.state.items.map((item) =>
        item.id === asset.id ? { ...item, alt, caption, updatedAt: now } : item,
      ),
    };
    try {
      await persistMediaState(nextState);
      return json(payload(nextState, true));
    } catch {
      return json({ error: "MEDIA_UPDATE_FAILED" }, 503);
    }
  }

  if (body.action === "delete") {
    const cms = await getCmsSnapshot();
    const usedBy = cms.state.items
      .filter((item) =>
        (typeof item.contentHtml === "string" && item.contentHtml.includes(asset.publicUrl)) ||
        item.coverMediaId === asset.id ||
        item.ogMediaId === asset.id,
      )
      .map((item) => ({
        title: item.title,
        status: item.status,
        slug: item.slug,
        usage: [
          typeof item.contentHtml === "string" && item.contentHtml.includes(asset.publicUrl) ? "Nội dung bài" : null,
          item.coverMediaId === asset.id ? "Ảnh đại diện" : null,
          item.ogMediaId === asset.id ? "OpenGraph" : null,
        ].filter(Boolean),
      }));

    if (usedBy.length) {
      return json(
        {
          error: "MEDIA_IN_USE",
          message: `Ảnh đang được sử dụng trong ${usedBy.length} nội dung. Hãy gỡ ảnh khỏi bài trước khi xóa.`,
          usedBy,
        },
        409,
      );
    }

    const now = new Date().toISOString();
    const nextState: MediaState = {
      schemaVersion: 1,
      revision: snapshot.state.revision + 1,
      updatedAt: now,
      items: snapshot.state.items.filter((item) => item.id !== asset.id),
    };

    try {
      await persistMediaState(nextState);
      await deleteMediaBlob(asset.pathname);
      return json(payload(nextState, true));
    } catch {
      return json({ error: "MEDIA_DELETE_FAILED", message: "Không thể xóa ảnh khỏi kho Media." }, 503);
    }
  }

  return json({ error: "INVALID_ACTION" }, 400);
}
