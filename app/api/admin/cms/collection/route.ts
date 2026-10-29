import { sessionDateLabel } from "@/lib/cms-session-dates";
import { getDatabaseBinding, type D1DatabaseLike } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import { deleteCmsRecord, listCmsRecords, saveCmsRecord } from "@/lib/cms-repository";
import { CMS_ADMIN_ROLES, CMS_EDIT_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { getCmsModule } from "@/lib/cms-schema";
import { canMutatePublication, PUBLICATION_MODULES } from "@/lib/cms-publication-permissions";
import { prepareCmsData } from "@/lib/cms-validation";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Unknown CMS error";
  const isValidation = message.startsWith("INVALID_CMS_");
  const isConflict = /UNIQUE constraint failed/i.test(message) || message === "INVALID_CMS_CONFLICT";
  return Response.json({ error: translateCmsError(message), code: cmsErrorCode(message) }, { status: isConflict ? 409 : isValidation ? 400 : 500 });
}

function moduleFrom(value: unknown) {
  const moduleKey = typeof value === "string" ? value.trim() : "";
  const config = getCmsModule(moduleKey);
  if (!config) throw new Error("INVALID_CMS_MODULE");
  if (moduleKey === "users") throw new Error("INVALID_CMS_USE_DEDICATED_USER_MANAGER");
  return { moduleKey, config };
}

async function referencesFor(db: D1DatabaseLike, moduleKey: string, items: Array<Record<string, unknown>> = []) {
  const references: Record<string, Array<{ value: string; label: string; disabled?: boolean }>> = {};
  if (["pages", "experts", "partners"].includes(moduleKey)) {
    const rows = await db.prepare(`SELECT id,COALESCE(filename,alt,id) AS label FROM media WHERE type='image' ${["pages", "experts", "partners"].includes(moduleKey) ? "AND visibility='public' AND public_url LIKE 'https://%'" : ""} ORDER BY updated_at DESC LIMIT 200`).all<{ id: string; label: string }>();
    references.media = rows.results.map((row) => ({ value: row.id, label: row.label }));
  }
  if (moduleKey === "leads") {
    const rows = await db.prepare(`SELECT u.id,COALESCE(NULLIF(u.display_name,''),u.email) AS label,u.is_active FROM admin_users u WHERE u.is_active=1 OR EXISTS(SELECT 1 FROM leads l WHERE l.owner_id=u.id) ORDER BY u.is_active DESC,lower(COALESCE(u.display_name,u.email))`).all<{ id: string; label: string; is_active: number }>();
    references.users = rows.results.map(row => ({value:row.id,label:row.is_active ? row.label : `${row.label} · Đã ngừng hoạt động`,disabled:!row.is_active}));
  }
  if (moduleKey === "registrations") {
    const courseIds = [...new Set(items.map(item => String(item.course_id ?? "")).filter(Boolean))];
    const sessionIds = [...new Set(items.map(item => String(item.session_id ?? "")).filter(Boolean))];
    // Keep each query below D1's bound-parameter limit, even for a full list page.
    async function byIds<T>(ids: string[], query: (placeholders: string) => string): Promise<T[]> {
      const rows: T[] = [];
      for (let offset = 0; offset < ids.length; offset += 80) {
        const batch = ids.slice(offset, offset + 80);
        const result = await db.prepare(query(batch.map(() => "?").join(","))).bind(...batch).all<T>();
        rows.push(...result.results);
      }
      return rows;
    }
    const courses = await byIds<{id:string;label:string}>(courseIds, placeholders => `SELECT id,title AS label FROM courses WHERE id IN (${placeholders}) ORDER BY title`);
    const sessions = await byIds<{id:string;title:string;start_at:string|null}>(sessionIds, placeholders => `SELECT s.id,c.title,s.start_at FROM course_sessions s JOIN courses c ON c.id=s.course_id WHERE s.id IN (${placeholders})`);
    references.courses = courses.map(row => ({value:row.id,label:row.label}));
    references.sessions = sessions.map(row => ({value:row.id,label:`${row.title} · ${sessionDateLabel(row.start_at)} (giờ Việt Nam)`}));
  }
  return references;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { moduleKey, config } = moduleFrom(url.searchParams.get("module"));
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, config.adminOnly ? CMS_ADMIN_ROLES : CMS_READ_ROLES);
    const limitRaw = Number(url.searchParams.get("limit") ?? "80");
    const result = await listCmsRecords(db, moduleKey, { q: url.searchParams.get("q") ?? undefined, status: url.searchParams.get("status") ?? undefined, offset: Number(url.searchParams.get("offset") ?? "0"), limit: Number.isFinite(limitRaw) ? limitRaw : 80 });
    const references = await referencesFor(db, moduleKey, result.items);
    return Response.json({ ok: true, module: config, actor, references, ...result }, {headers:{"Cache-Control":"no-store"}});
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { module?: unknown; id?: unknown; data?: unknown; expectedUpdatedAt?: unknown };
    const { moduleKey, config } = moduleFrom(body.module);
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, config.adminOnly ? CMS_ADMIN_ROLES : CMS_EDIT_ROLES);
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;
    const rawData = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data as Record<string, unknown> : {};
    const data = await prepareCmsData(db, moduleKey, config, id, rawData);
    if (PUBLICATION_MODULES.has(moduleKey) && !actor.roles.includes("admin")) {
      const current = id
        ? await db.prepare(`SELECT status FROM ${config.table} WHERE id = ? LIMIT 1`).bind(id).first<{ status: string }>()
        : null;
      if (!canMutatePublication(actor.roles, current?.status, data.status)) {
        throw new NewsroomAuthError(403, "Only a CMS administrator may modify published content");
      }
    }
    // Legacy callers may omit this precondition. The CMS UI sends it on edits.
    const expectedUpdatedAt = typeof body.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : undefined;
    // Editors may edit drafts, but must present the version they actually read.
    // Otherwise a legacy client could pass the earlier publication gate while
    // an administrator publishes the record, then overwrite it without CAS.
    if (id && PUBLICATION_MODULES.has(moduleKey) && !actor.roles.includes("admin") && expectedUpdatedAt === undefined) {
      throw new Error("INVALID_CMS_CONFLICT");
    }
    const entityId = await saveCmsRecord(db, actor, moduleKey, id, data, { expectedUpdatedAt });
    const record = await db.prepare(`SELECT * FROM ${config.table} WHERE id=? LIMIT 1`).bind(entityId).first<Record<string, unknown>>();
    return Response.json({ ok: true, id: entityId, record });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { module?: unknown; id?: unknown; expectedUpdatedAt?: unknown };
    const { moduleKey } = moduleFrom(body.module);
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return Response.json({ error: translateCmsError("ID_REQUIRED"), code: "ID_REQUIRED" }, { status: 400 });
    if (moduleKey === "registrations") return Response.json({ error: translateCmsError("REGISTRATION_DELETE_DISABLED"), code: "REGISTRATION_DELETE_DISABLED" }, { status: 400 });
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    const expectedUpdatedAt = typeof body.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : undefined;
    await deleteCmsRecord(db, actor, moduleKey, id, { expectedUpdatedAt });
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
