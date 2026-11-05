import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { NEWSROOM_READ_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

// Private session identity and role data must never be cached at the browser,
// intermediary CDN, or shared-proxy layer, including 401 and 500 responses.
const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, NEWSROOM_READ_ROLES);
    return Response.json({ ok: true, actor }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof NewsroomAuthError) return Response.json(
      { error: error.status === 401 ? "Authentication required" : "Insufficient CMS role" },
      { status: error.status, headers: privateHeaders },
    );
    // Do not leak internal D1/session error messages to a public caller.
    return Response.json({ error: "CMS_SESSION_UNAVAILABLE" }, {
      status: 503, headers: privateHeaders,
    });
  }
}
