import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { NEWSROOM_ADMIN_ROLES } from "@/lib/cms-roles";
import { translateNewsroomError } from "@/lib/newsroom-errors";
import { ingestNewsSource } from "@/lib/news-repository";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "no-store" };

function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) {
    return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders });
  }
  const message = error instanceof Error ? error.message : "Unknown newsroom error";
  const status = message === "NEWS_SOURCE_NOT_ACTIVE" ? 400 : 500;
  return Response.json({ error: translateNewsroomError(message) }, { status, headers: privateHeaders });
}

export async function POST(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, NEWSROOM_ADMIN_ROLES);
    const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (mediaType !== "application/json") {
      return Response.json({ error: "Nội dung gửi lên phải có định dạng JSON." },
        { status: 400, headers: privateHeaders });
    }
    let raw: unknown;
    try { raw = await request.json(); } catch {
      return Response.json({ error: "Nội dung gửi lên phải là JSON hợp lệ." },
        { status: 400, headers: privateHeaders });
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return Response.json({ error: "Dữ liệu nhập tin phải là một đối tượng." },
        { status: 400, headers: privateHeaders });
    }
    const body = raw as Record<string, unknown>;
    const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim() : "";
    if (!sourceId) {
      return Response.json({ error: "Vui lòng chọn nguồn tin cần lấy dữ liệu." },
        { status: 400, headers: privateHeaders });
    }
    const summary = await ingestNewsSource(db, sourceId, { actorId: actor.id });
    return Response.json({ ok: true, summary }, { status: 200, headers: privateHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
