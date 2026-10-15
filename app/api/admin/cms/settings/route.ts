import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { getCmsSettings, saveCmsSettings } from "@/lib/cms-repository";
import { CMS_ADMIN_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Unknown CMS error";
  const status = message.startsWith("INVALID_CMS_") ? 400 : 500;
  return Response.json({ error: message.replace(/^INVALID_CMS_/, "") }, { status });
}

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_READ_ROLES);
    return Response.json({ ok: true, actor, ...(await getCmsSettings(db)) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    const body = await request.json() as { organizationName?: unknown; settings?: unknown };
    const organizationName = typeof body.organizationName === "string" ? body.organizationName.trim() : "";
    const settings = body.settings && typeof body.settings === "object" && !Array.isArray(body.settings) ? body.settings as Record<string, unknown> : {};
    if (!organizationName) return Response.json({ error: "ORGANIZATION_NAME_REQUIRED" }, { status: 400 });
    return Response.json({ ok: true, ...(await saveCmsSettings(db, actor, organizationName, settings)) });
  } catch (error) { return errorResponse(error); }
}
