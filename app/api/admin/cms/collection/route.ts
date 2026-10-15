import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import { deleteCmsRecord, listCmsRecords, saveCmsRecord } from "@/lib/cms-repository";
import { CMS_ADMIN_ROLES, CMS_EDIT_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { getCmsModule } from "@/lib/cms-schema";
import { prepareCmsData } from "@/lib/cms-validation";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Unknown CMS error";
  const isValidation = message.startsWith("INVALID_CMS_");
  const isConflict = /UNIQUE constraint failed/i.test(message);
  return Response.json(
    { error: translateCmsError(message), code: cmsErrorCode(message) },
    { status: isConflict ? 409 : isValidation ? 400 : 500 },
  );
}

function moduleFrom(value: unknown) {
  const moduleKey = typeof value === "string" ? value.trim() : "";
  const config = getCmsModule(moduleKey);
  if (!config) throw new Error("INVALID_CMS_MODULE");
  if (moduleKey === "users") throw new Error("INVALID_CMS_USE_DEDICATED_USER_MANAGER");
  return { moduleKey, config };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { moduleKey, config } = moduleFrom(url.searchParams.get("module"));
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, config.adminOnly ? CMS_ADMIN_ROLES : CMS_READ_ROLES);
    const limitRaw = Number(url.searchParams.get("limit") ?? "80");
    const result = await listCmsRecords(db, moduleKey, {
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      limit: Number.isFinite(limitRaw) ? limitRaw : 80,
    });
    return Response.json({ ok: true, module: config, actor, ...result });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { module?: unknown; id?: unknown; data?: unknown };
    const { moduleKey, config } = moduleFrom(body.module);
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, config.adminOnly ? CMS_ADMIN_ROLES : CMS_EDIT_ROLES);
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;
    const rawData = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data as Record<string, unknown> : {};
    const data = await prepareCmsData(db, moduleKey, config, id, rawData);
    const entityId = await saveCmsRecord(db, actor, moduleKey, id, data);
    return Response.json({ ok: true, id: entityId });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { module?: unknown; id?: unknown };
    const { moduleKey } = moduleFrom(body.module);
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return Response.json({ error: translateCmsError("ID_REQUIRED"), code: "ID_REQUIRED" }, { status: 400 });
    if (moduleKey === "registrations") return Response.json({ error: translateCmsError("REGISTRATION_DELETE_DISABLED"), code: "REGISTRATION_DELETE_DISABLED" }, { status: 400 });
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    await deleteCmsRecord(db, actor, moduleKey, id);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
