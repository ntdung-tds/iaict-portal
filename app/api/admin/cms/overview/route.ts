import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { getCmsOverview } from "@/lib/cms-repository";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Unknown CMS error";
  return Response.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, ["admin", "editor", "reviewer"]);
    return Response.json({ ok: true, actor, ...(await getCmsOverview(db)) });
  } catch (error) {
    return errorResponse(error);
  }
}
