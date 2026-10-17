import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { NEWSROOM_READ_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, NEWSROOM_READ_ROLES);
    return Response.json({ ok: true, actor });
  } catch (error) {
    if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : "Unknown session error";
    return Response.json({ error: message }, { status: 500 });
  }
}
