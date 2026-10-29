import { isNavigationHref } from "./cms-navigation-link";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import { getCmsModule, type CmsField, type CmsModuleConfig } from "./cms-schema";
import type { NewsroomActor } from "./newsroom-auth";

type CmsRow = Record<string, unknown>;

type ListOptions = {
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

function invalid(message: string): never {
  throw new Error(`INVALID_CMS_${message}`);
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function fieldDefaultJson(field: CmsField) {
  if (["seo_json", "layout_json", "metadata_json", "public_contacts_json"].includes(field.key)) return "{}";
  return "[]";
}

function normalizeFieldValue(field: CmsField, value: unknown): D1BindValue {
  if (field.type === "boolean") return value === true || value === 1 || value === "1" ? 1 : 0;
  if (field.type === "number") {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) invalid(`FIELD_${field.key.toUpperCase()}_NUMBER`);
    return parsed;
  }
  if (field.type === "json") {
    if (value === "" || value === null || value === undefined) return fieldDefaultJson(field);
    if (typeof value !== "string") return JSON.stringify(value);
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      invalid(`FIELD_${field.key.toUpperCase()}_JSON`);
    }
  }
  if (value === undefined || value === null) return null;
  return String(value).trim();
}

async function writeAudit(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await db.prepare(`
    INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    actor.id,
    action,
    entityType,
    entityId,
    JSON.stringify(metadata),
    nowIso(),
  ).run();
}

async function recordRevision(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  entityType: string,
  entityId: string,
  snapshot: CmsRow,
) {
  await db.prepare(`
    INSERT INTO cms_revisions(id, entity_type, entity_id, actor_user_id, snapshot_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    entityType,
    entityId,
    actor.id,
    JSON.stringify(snapshot),
    nowIso(),
  ).run();
}

type CmsMutationOptions = {
  /** Timestamp of the selected record in the editor before any changes. */
  expectedUpdatedAt?: string | null;
  /** Restore audit must be committed in the same batch as the content change. */
  restoreRevisionId?: string;
};

function auditStatement(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
): D1PreparedStatementLike {
  return db.prepare(`
    INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), actor.id, action, entityType, entityId, JSON.stringify(metadata), nowIso());
}

function revisionStatement(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  entityType: string,
  entityId: string,
  snapshot: CmsRow,
): D1PreparedStatementLike {
  return db.prepare(`
    INSERT INTO cms_revisions(id, entity_type, entity_id, actor_user_id, snapshot_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), entityType, entityId, actor.id, JSON.stringify(snapshot), nowIso());
}

/** Every save moves the version forward even when two writes occur in the same millisecond. */
function nextUpdatedAt(previous: unknown): string {
  const last = typeof previous === "string" ? Date.parse(previous) : Number.NaN;
  return new Date(Number.isFinite(last) ? Math.max(Date.now(), last + 1) : Date.now()).toISOString();
}

function conflict(): never {
  throw new Error("INVALID_CMS_CONFLICT");
}

/**
 * Read the affected-row count provided by Cloudflare D1 batch().
 * An in-memory D1 adapter used by older unit tests may omit meta.changes;
 * those callers do not submit optimistic-locking tokens.
 */
function assertChanged(result: Awaited<ReturnType<D1DatabaseLike["batch"]>>, index: number): void {
  const changes = result[index]?.meta?.changes;
  if (typeof changes === "number" && changes === 0) conflict();
}

function assertConfig(moduleKey: string) {
  const config = getCmsModule(moduleKey);
  if (!config) invalid("MODULE");
  return config;
}

function whereFor(config: CmsModuleConfig, options: ListOptions) {
  const clauses: string[] = [];
  const bindings: D1BindValue[] = [];
  const q = options.q?.trim();
  if (q && config.searchColumns.length > 0) {
    clauses.push(`(${config.searchColumns.map((column) => `lower(COALESCE(${column}, '')) LIKE ?`).join(" OR ")})`);
    for (let i = 0; i < config.searchColumns.length; i += 1) bindings.push(`%${q.toLowerCase()}%`);
  }
  if (options.status?.trim() && config.statusColumn) {
    clauses.push(`${config.statusColumn} = ?`);
    bindings.push(options.status.trim());
  }
  return {
    sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "",
    bindings,
  };
}

async function listUsers(db: D1DatabaseLike, options: ListOptions) {
  const q = options.q?.trim().toLowerCase();
  const where = q ? "WHERE lower(COALESCE(u.display_name, '')) LIKE ? OR lower(u.email) LIKE ?" : "";
  const values: D1BindValue[] = q ? [`%${q}%`, `%${q}%`] : [];
  const rows = await db.prepare(`
    SELECT
      u.id,
      u.email,
      u.display_name,
      u.is_active,
      u.access_subject,
      u.created_at,
      u.updated_at,
      COALESCE(group_concat(r.code), '') AS roles
    FROM admin_users u
    LEFT JOIN admin_user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    ${where}
    GROUP BY u.id, u.email, u.display_name, u.is_active, u.access_subject, u.created_at, u.updated_at
    ORDER BY u.updated_at DESC
    LIMIT ?
  `).bind(...values, Math.min(Math.max(options.limit ?? 80, 1), 200)).all<CmsRow>();

  const total = await db.prepare(`SELECT COUNT(*) AS count FROM admin_users`).first<{ count: number }>();
  return { items: rows.results, total: Number(total?.count ?? rows.results.length) };
}

async function listAudit(db: D1DatabaseLike, options: ListOptions) {
  const limit = Number.isFinite(options.limit) ? Math.min(Math.max(Math.trunc(options.limit!), 1), 200) : 40;
  const offset = Number.isFinite(options.offset) ? Math.max(Math.trunc(options.offset!), 0) : 0;
  const q = options.q?.trim().toLowerCase();
  const columns = ["a.action", "a.entity_type", "a.entity_id", "a.metadata_json", "a.actor_user_id", "u.display_name", "u.email"];
  const where = q ? ` WHERE (${columns.map(column => `lower(COALESCE(${column},'')) LIKE ? ESCAPE '\\'`).join(" OR ")})` : "";
  const escaped = q?.replace(/[\\%_]/g, character => `\\${character}`);
  const bindings = q ? columns.map(() => `%${escaped}%`) : [];
  const from = `FROM audit_logs a LEFT JOIN admin_users u ON u.id=a.actor_user_id`;
  const rows = await db.prepare(`SELECT a.*, COALESCE(NULLIF(u.display_name,''),u.email,NULLIF(a.actor_user_id,''),'Hệ thống') AS actor_name ${from}${where} ORDER BY a.created_at DESC,a.id DESC LIMIT ? OFFSET ?`).bind(...bindings,limit,offset).all<CmsRow>();
  const total = await db.prepare(`SELECT COUNT(*) AS count ${from}${where}`).bind(...bindings).first<{count:number}>();
  return {items:rows.results,total:Number(total?.count??0)};
}

export async function listCmsRecords(db: D1DatabaseLike, moduleKey: string, options: ListOptions = {}) {
  const config = assertConfig(moduleKey);
  if (moduleKey === "users") return listUsers(db, options);
  if (moduleKey === "audit") return listAudit(db, options);

  const limit = Math.min(Math.max(options.limit ?? 80, 1), 200);
  const where = whereFor(config, options);
  const items = await db.prepare(`
    SELECT * FROM ${config.table}${where.sql}
    ORDER BY ${config.orderBy}
    LIMIT ?
  `).bind(...where.bindings, limit).all<CmsRow>();
  const total = await db.prepare(`SELECT COUNT(*) AS count FROM ${config.table}${where.sql}`)
    .bind(...where.bindings)
    .first<{ count: number }>();
  return { items: items.results, total: Number(total?.count ?? items.results.length) };
}

async function saveUser(db: D1DatabaseLike, actor: NewsroomActor, id: string | null, data: CmsRow) {
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const displayName = typeof data.display_name === "string" ? data.display_name.trim() : "";
  const isActive = data.is_active === false || data.is_active === 0 || data.is_active === "0" ? 0 : 1;
  const roleCodes = String(data.roles ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!email || !email.includes("@")) invalid("USER_EMAIL");
  if (roleCodes.length === 0) invalid("USER_ROLES");

  const validRoles = await db.prepare(`SELECT id, code FROM roles`).all<{ id: string; code: string }>();
  const roleMap = new Map(validRoles.results.map((row) => [row.code, row.id]));
  const roleIds = roleCodes.map((code) => roleMap.get(code)).filter((value): value is string => Boolean(value));
  if (roleIds.length !== roleCodes.length) invalid("USER_ROLE_UNKNOWN");

  const timestamp = nowIso();
  const entityId = id ?? crypto.randomUUID();
  if (id) {
    const current = await db.prepare(`SELECT * FROM admin_users WHERE id = ?`).bind(id).first<CmsRow>();
    if (!current) invalid("USER_NOT_FOUND");
    await recordRevision(db, actor, "users", id, current);
    await db.prepare(`UPDATE admin_users SET email = ?, display_name = ?, is_active = ?, updated_at = ? WHERE id = ?`)
      .bind(email, displayName || null, isActive, timestamp, id)
      .run();
  } else {
    await db.prepare(`
      INSERT INTO admin_users(id, email, display_name, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(entityId, email, displayName || null, isActive, timestamp, timestamp).run();
  }

  await db.prepare(`DELETE FROM admin_user_roles WHERE user_id = ?`).bind(entityId).run();
  if (roleIds.length > 0) {
    await db.batch(roleIds.map((roleId) => db.prepare(`
      INSERT INTO admin_user_roles(user_id, role_id) VALUES (?, ?)
    `).bind(entityId, roleId)));
  }
  await writeAudit(db, actor, id ? "cms.user.update" : "cms.user.create", "users", entityId, { email, roles: roleCodes });
  return entityId;
}

export async function saveCmsRecord(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  moduleKey: string,
  id: string | null,
  data: CmsRow,
  options: CmsMutationOptions = {},
) {
  const config = assertConfig(moduleKey);
  if (config.readOnly) invalid("READ_ONLY");
  if (!id && config.allowCreate === false) invalid("CREATE_DISABLED");
  if (moduleKey === "users") return saveUser(db, actor, id, data);

  const editableFields = config.fields.filter((field) => !field.readonly);
  const fieldByKey = new Map(editableFields.map((field) => [field.key, field]));
  const normalized: Record<string, D1BindValue> = {};
  for (const [key, rawValue] of Object.entries(data)) {
    const field = fieldByKey.get(key);
    if (!field) continue;
    normalized[key] = normalizeFieldValue(field, rawValue);
  }
  if (moduleKey === "courses" && normalized.code === "") normalized.code = null;

  if (config.slugColumn && !String(normalized[config.slugColumn] ?? "").trim()) {
    const source = normalized[config.titleColumn] ?? data[config.titleColumn];
    if (source) normalized[config.slugColumn] = slugify(String(source));
  }

  if (!id) {
    for (const field of editableFields.filter((item) => item.required)) {
      const value = normalized[field.key];
      if (value === undefined || value === null || String(value).trim() === "") invalid(`FIELD_${field.key.toUpperCase()}_REQUIRED`);
    }
  }

  const entityId = id ?? crypto.randomUUID();
  const action = id ? "cms.entity.update" : "cms.entity.create";
  const auditMeta = { changedFields: Object.keys(normalized) };
  const statements: D1PreparedStatementLike[] = [];

  if (id) {
    const current = await db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).bind(id).first<CmsRow>();
    if (!current) invalid("NOT_FOUND");
    const hasUpdatedAt = moduleKey !== "redirects";
    const locking = hasUpdatedAt && options.expectedUpdatedAt !== undefined;
    const expected = options.expectedUpdatedAt ?? null;
    if (locking && (current.updated_at ?? null) !== expected) conflict();

    const updates = Object.keys(normalized);
    if (!updates.length) invalid("NO_FIELDS");
    const values = updates.map(key => normalized[key]);
    const assignments = updates.map(key => `${key} = ?`);
    const timestamp = nextUpdatedAt(current.updated_at);

    if (hasUpdatedAt) {
      assignments.push("updated_at = ?");
      values.push(timestamp);
    }
    if (config.publishColumn && normalized[config.statusColumn ?? ""] === "published" && !current[config.publishColumn]) {
      assignments.push(`${config.publishColumn} = ?`);
      values.push(timestamp);
    }

    if (locking) {
      // Atomic compare-and-swap: both revision and audit are conditional on
      // the matching old/new version, so stale requests leave NO side effects.
      statements.push(db.prepare(`
        INSERT INTO cms_revisions(id,entity_type,entity_id,actor_user_id,snapshot_json,created_at)
        SELECT ?,?,?,?,?,? FROM ${config.table} WHERE id=? AND updated_at IS ?
      `).bind(crypto.randomUUID(), moduleKey, id, actor.id, JSON.stringify(current), nowIso(), id, expected));
      statements.push(db.prepare(`
        UPDATE ${config.table} SET ${assignments.join(", ")} WHERE id=? AND updated_at IS ?
      `).bind(...values, id, expected));
      statements.push(db.prepare(`
        INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
        SELECT ?,?,?,?,?,?,? FROM ${config.table} WHERE id=? AND updated_at=?
      `).bind(crypto.randomUUID(), actor.id, action, moduleKey, entityId, JSON.stringify(auditMeta), nowIso(), id, timestamp));
      if (options.restoreRevisionId) {
        statements.push(db.prepare(`
          INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
          SELECT ?,?,?,?,?,?,? FROM ${config.table} WHERE id=? AND updated_at=?
        `).bind(crypto.randomUUID(), actor.id, "cms.revision.restore", moduleKey, entityId,
          JSON.stringify({ revisionId: options.restoreRevisionId }), nowIso(), id, timestamp));
      }
    } else {
      statements.push(revisionStatement(db, actor, moduleKey, id, current));
      statements.push(db.prepare(`UPDATE ${config.table} SET ${assignments.join(", ")} WHERE id=?`)
        .bind(...values, id));
      statements.push(auditStatement(db, actor, action, moduleKey, entityId, auditMeta));
      if (options.restoreRevisionId) {
        statements.push(auditStatement(db, actor, "cms.revision.restore", moduleKey, id,
          { revisionId: options.restoreRevisionId }));
      }
    }

    const result = await db.batch(statements);
    if (locking) assertChanged(result, 1);
  } else {
    const timestamp = nowIso();
    const columns = ["id", ...Object.keys(normalized)];
    const values: D1BindValue[] = [entityId, ...Object.values(normalized)];
    if (moduleKey !== "redirects") {
      columns.push("created_at", "updated_at");
      values.push(timestamp, timestamp);
    } else {
      columns.push("created_at");
      values.push(timestamp);
    }
    if (config.publishColumn && normalized[config.statusColumn ?? ""] === "published") {
      columns.push(config.publishColumn);
      values.push(timestamp);
    }
    statements.push(db.prepare(`
      INSERT INTO ${config.table}(${columns.join(", ")})
      VALUES (${columns.map(() => "?").join(", ")})
    `).bind(...values));
    statements.push(auditStatement(db, actor, action, moduleKey, entityId, auditMeta));
    await db.batch(statements);
  }
  return entityId;
}

export async function deleteCmsRecord(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  moduleKey: string,
  id: string,
  options: CmsMutationOptions = {},
) {
  const config = assertConfig(moduleKey);
  if (config.readOnly || config.allowDelete === false) invalid("DELETE_DISABLED");
  if (!id) invalid("ID");

  if (moduleKey === "users") {
    if (id === actor.id) invalid("USER_SELF_DELETE");
    const current = await db.prepare(`SELECT * FROM admin_users WHERE id = ?`).bind(id).first<CmsRow>();
    if (!current) invalid("NOT_FOUND");
    await db.batch([
      revisionStatement(db, actor, moduleKey, id, current),
      db.prepare(`UPDATE admin_users SET is_active=0, updated_at=? WHERE id=?`)
        .bind(nextUpdatedAt(current.updated_at), id),
      auditStatement(db, actor, "cms.user.deactivate", moduleKey, id),
    ]);
    return;
  }

  const current = await db.prepare(`SELECT * FROM ${config.table} WHERE id=?`).bind(id).first<CmsRow>();
  if (!current) invalid("NOT_FOUND");
  const locking = moduleKey !== "redirects" && options.expectedUpdatedAt !== undefined;
  const expected = options.expectedUpdatedAt ?? null;
  if (locking && (current.updated_at ?? null) !== expected) conflict();

  if (locking) {
    const revisionId = crypto.randomUUID();
    const results = await db.batch([
      db.prepare(`
        INSERT INTO cms_revisions(id,entity_type,entity_id,actor_user_id,snapshot_json,created_at)
        SELECT ?,?,?,?,?,? FROM ${config.table} WHERE id=? AND updated_at IS ?
      `).bind(revisionId, moduleKey, id, actor.id, JSON.stringify(current), nowIso(), id, expected),
      db.prepare(`DELETE FROM ${config.table} WHERE id=? AND updated_at IS ?`).bind(id, expected),
      db.prepare(`
        INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
        SELECT ?,?,?,?,?,?,? FROM cms_revisions WHERE id=?
      `).bind(crypto.randomUUID(), actor.id, "cms.entity.delete", moduleKey, id, "{}", nowIso(), revisionId),
    ]);
    assertChanged(results, 1);
  } else {
    await db.batch([
      revisionStatement(db, actor, moduleKey, id, current),
      db.prepare(`DELETE FROM ${config.table} WHERE id=?`).bind(id),
      auditStatement(db, actor, "cms.entity.delete", moduleKey, id),
    ]);
  }
}

export async function getCmsOverview(db: D1DatabaseLike, includeActivity = false) {
  const moduleKeys = ["pages", "products", "solutions", "courses", "projects", "experts", "partners", "events", "media", "leads", "registrations"];
  const counts: Record<string, number | null> = {};
  for (const key of moduleKeys) {
    const config = assertConfig(key);
    const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${config.table}`).first<{ count: number }>();
    counts[key] = Number(row?.count ?? 0);
  }

  const pendingNews = await db.prepare(`
    SELECT COUNT(*) AS count FROM news_review_queue WHERE workflow_status IN ('pending', 'editing', 'approved')
  `).first<{ count: number }>().catch(() => null);
  counts.newsQueue = pendingNews ? Number(pendingNews.count) : null;
  for(const [key,table] of [["articles","articles"],["courseSessions","course_sessions"]]){const row=await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{count:number}>();counts[key]=Number(row?.count??0);}

  const published = await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM products WHERE status = 'published') +
      (SELECT COUNT(*) FROM solutions WHERE status = 'published') +
      (SELECT COUNT(*) FROM courses WHERE status = 'published') +
      (SELECT COUNT(*) FROM projects WHERE status = 'published') +
      (SELECT COUNT(*) FROM pages WHERE status = 'published') +
      (SELECT COUNT(*) FROM articles WHERE status = 'published') +
      (SELECT COUNT(*) FROM events WHERE status = 'published') +
      (SELECT COUNT(*) FROM experts WHERE status = 'published') +
      (SELECT COUNT(*) FROM partners WHERE status = 'published') AS count
  `).first<{ count: number }>();

  const recentActivity = includeActivity ? await db.prepare(`
    SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at,
           COALESCE(NULLIF(u.display_name,''), u.email, NULLIF(a.actor_user_id,''), 'Hệ thống') AS actor
    FROM audit_logs a
    LEFT JOIN admin_users u ON u.id = a.actor_user_id
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT 12
  `).all<CmsRow>() : {results:[]};

  return {
    counts,
    publishedCount: Number(published?.count ?? 0),
    recentActivity: recentActivity.results,
  };
}

export async function getCmsSettings(db: D1DatabaseLike) {
  const row = await db.prepare(`SELECT organization_name, settings_json, updated_at FROM site_settings WHERE id = 'default' LIMIT 1`)
    .first<{ organization_name: string; settings_json: string; updated_at: string }>();
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(row?.settings_json ?? "{}");
  } catch {
    settings = {};
  }
  return {
    organizationName: row?.organization_name ?? "Viện Ứng dụng Công nghệ Thông tin và Truyền thông",
    settings,
    updatedAt: row?.updated_at ?? null,
  };
}

export async function saveCmsSettings(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  organizationName: string,
  settings: Record<string, unknown>,
) {
  const timestamp = nowIso();
  const current = await db.prepare(`SELECT * FROM site_settings WHERE id = 'default'`).first<CmsRow>();
  if (current) await recordRevision(db, actor, "site_settings", "default", current);
  await db.prepare(`
    INSERT INTO site_settings(id, organization_name, settings_json, updated_at)
    VALUES ('default', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      organization_name = excluded.organization_name,
      settings_json = excluded.settings_json,
      updated_at = excluded.updated_at
  `).bind(organizationName.trim(), JSON.stringify(settings), timestamp).run();
  await writeAudit(db, actor, "cms.settings.update", "site_settings", "default", { organizationName });
  return getCmsSettings(db);
}

export async function getPublicNavigation(db: D1DatabaseLike) {
  const rows = await db.prepare(`
    SELECT label, href, opens_new_tab FROM navigation_items
    WHERE group_name = 'main' AND is_active = 1
    ORDER BY sort_order ASC, label ASC, id ASC
  `).all<{ label: string; href: string; opens_new_tab: number }>();
  return rows.results.filter(row => isNavigationHref(row.href)).map(row => ({label:row.label,href:row.href,opensNewTab:row.opens_new_tab===1}));
}
