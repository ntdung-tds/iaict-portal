import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { CMS_EDIT_ROLES } from "@/lib/cms-roles";
import { getPrivateMediaR2Runtime } from "@/lib/media-r2-runtime";
import { submitPrivateMediaQuarantine } from "@/lib/media-r2-quarantine";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

/**
 * STAGING ONLY, opt-in. This endpoint *only* writes private quarantine;
 * it NEVER publishes, serves, or returns R2 keys. Requires verified CMS
 * identity/role from the Worker/Cloudflare Access or D1 native session.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_EDIT_ROLES);
    const media = getPrivateMediaR2Runtime();
    if (!media) return Response.json({
      ok: false, code: "MEDIA_QUARANTINE_NOT_ENABLED",
    }, { status: 503, headers: noStore });

    const result = await submitPrivateMediaQuarantine(request, actor, db, media.bucket);
    return Response.json(result, {
      status: result.ok ? result.status : result.status,
      headers: noStore,
    });
  } catch (error) {
    if (error instanceof NewsroomAuthError) return Response.json(
      { ok: false, code: error.status === 401 ? "AUTH_REQUIRED" : "ROLE_DENIED" },
      { status: error.status, headers: noStore },
    );
    return Response.json({ ok: false, code: "MEDIA_UNAVAILABLE" }, { status: 503, headers: noStore });
  }
}

/**
 * Authenticated, no-store capability discovery for the CMS upload UI.
 * A disabled scanner only prohibits use/publication, not storing raw bytes
 * privately in quarantine. A disabled Worker/bucket gate prohibits uploads.
 * Never expose D1 IDs, R2 keys or the list of private assets via GET.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_EDIT_ROLES);
    const roleAllowed = actor.roles.some(role => role === "admin" || role === "editor");
    const media = getPrivateMediaR2Runtime();
    return Response.json({
      ok: true,
      quarantineEnabled: Boolean(media && roleAllowed),
      roleAllowed,
      scannerConfigured: false,
      publicationEnabled: false,
      policyId: "IAICT-MEDIA-20261104-V1",
      maxBytes: 10 * 1024 * 1024,
    }, { status: 200, headers: noStore });
  } catch (error) {
    if (error instanceof NewsroomAuthError) return Response.json({
      ok: false, code: error.status === 401 ? "AUTH_REQUIRED" : "ROLE_DENIED",
      quarantineEnabled: false, publicationEnabled: false,
    }, { status: error.status, headers: noStore });
    return Response.json({
      ok: false, code: "MEDIA_UNAVAILABLE", quarantineEnabled: false,
      publicationEnabled: false,
    }, { status: 503, headers: noStore });
  }
}
