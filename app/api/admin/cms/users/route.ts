import { getDatabaseBinding, type D1PreparedStatementLike } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import {
  CMS_ADMIN_ROLES,
  CMS_ROLE_DEFINITIONS,
  normalizeRoleSelection,
  type CmsRoleCode,
} from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";
import { sameOriginPost } from "@/lib/native-auth";

export const dynamic = "force-dynamic";

type UserRow = { id:string; email:string; display_name:string|null; access_subject:string|null; is_active:number; created_at:string; updated_at:string; roles:string; native_ready?:number; };
type UserBody = { id?:unknown; email?:unknown; displayName?:unknown; isActive?:unknown; roles?:unknown; action?:unknown; updatedAt?:unknown; };
function nowIso(){return new Date().toISOString();}
// updated_at is the existing concurrency token: make each successful write
// strictly newer even when two writes occur within the same millisecond.
function nextUserTimestamp(previous:string){const last=Date.parse(previous);return new Date(Math.max(Date.now(),Number.isFinite(last)?last+1:Date.now())).toISOString();}
const hasUpdatedVersion="EXISTS(SELECT 1 FROM admin_users WHERE id=? AND updated_at=?)";
const noStore = { "Cache-Control": "no-store" };
function requireMutationRequest(request:Request){
  if(!sameOriginPost(request)) invalid("REQUEST_ORIGIN");
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) invalid("REQUEST_CONTENT_TYPE");
  if(Number(request.headers.get("content-length")||0)>16_384) invalid("REQUEST_TOO_LARGE");
}
async function readMutationBody(request:Request):Promise<UserBody>{
  const raw=await request.text();
  if(raw.length>16_384) invalid("REQUEST_TOO_LARGE");
  let value:unknown;
  try{value=JSON.parse(raw);}catch{invalid("REQUEST_JSON");}
  if(!value||typeof value!=="object"||Array.isArray(value)) invalid("REQUEST_JSON");
  return value as UserBody;
}
function invalid(message:string):never{throw new Error(`INVALID_CMS_${message}`);}
function errorResponse(error:unknown){
  if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status,headers:noStore});
  const message=error instanceof Error?error.message:"Unknown user-management error";
  const validation=message.startsWith("INVALID_CMS_");
  const conflict=/UNIQUE constraint failed/i.test(message);
  return Response.json({error:translateCmsError(message),code:cmsErrorCode(message)},{status:conflict||message==="INVALID_CMS_USER_CONFLICT"?409:message==="INVALID_CMS_USER_VERSION_REQUIRED"?428:validation?400:500,headers:noStore});
}
/**
 * A D1 batch is atomic. When removing an ACTIVE admin, its UPDATE must
 * re-check that another active admin still exists INSIDE the transaction.
 * A NULL value violates admin_users.is_active NOT NULL and aborts the batch.
 * Unlike a preflight SELECT, this check cannot race a concurrent role change.
 */
const otherActiveAdminExists = `EXISTS (
  SELECT 1 FROM admin_users remaining
  JOIN admin_user_roles assignments ON assignments.user_id = remaining.id
  JOIN roles assigned_role ON assigned_role.id = assignments.role_id
  WHERE remaining.id <> ? AND remaining.is_active = 1 AND assigned_role.code = 'admin'
)`;

function userMutationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/NOT NULL constraint failed: admin_users\.is_active/i.test(message)) {
    return errorResponse(new Error("INVALID_CMS_LAST_ACTIVE_ADMIN"));
  }
  return errorResponse(error);
}

async function listUsers(db:ReturnType<typeof getDatabaseBinding>){
  const rows=await db.prepare(`SELECT u.id,u.email,u.display_name,u.access_subject,u.is_active,u.created_at,u.updated_at,COALESCE(group_concat(r.code),'') AS roles, MAX(CASE WHEN pc.user_id IS NOT NULL THEN 1 ELSE 0 END) AS native_ready FROM admin_users u LEFT JOIN admin_user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id LEFT JOIN iaict_password_credentials_v2 pc ON pc.user_id=u.id GROUP BY u.id,u.email,u.display_name,u.access_subject,u.is_active,u.created_at,u.updated_at ORDER BY u.is_active DESC,lower(COALESCE(u.display_name,u.email)),lower(u.email)`).all<UserRow>();
  return rows.results.map(row=>({...row,hasNativePassword:row.native_ready===1,roles:row.roles?row.roles.split(",").filter(Boolean):[]}));
}
async function countActiveAdmins(db:ReturnType<typeof getDatabaseBinding>,excludeUserId?:string){
  const row=await db.prepare(`SELECT COUNT(DISTINCT u.id) AS count FROM admin_users u JOIN admin_user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE u.is_active=1 AND r.code='admin' ${excludeUserId?"AND u.id <> ?":""}`).bind(...(excludeUserId?[excludeUserId]:[])).first<{count:number}>();
  return Number(row?.count??0);
}
function auditStatement(
  db: ReturnType<typeof getDatabaseBinding>,
  actorId: string,
  action: string,
  userId: string,
  metadata: Record<string, unknown>,
  versionGuard?: string,
): D1PreparedStatementLike {
  // A stale compare-and-swap must never write a misleading audit record.
  const where=versionGuard?" WHERE "+hasUpdatedVersion:"";
  const params=versionGuard?[userId,versionGuard]:[];
  return db.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
    SELECT ?,?,?,?,?,?,?${where}`)
    .bind(crypto.randomUUID(), actorId, action, "users", userId, JSON.stringify(metadata), nowIso(), ...params);
}

function snapshotStatement(
  db: ReturnType<typeof getDatabaseBinding>,
  actorId: string,
  user: UserRow,
  roles: string[],
  versionGuard?: string,
): D1PreparedStatementLike {
  const where=versionGuard?" WHERE "+hasUpdatedVersion:"";
  const params=versionGuard?[user.id,versionGuard]:[];
  return db.prepare(`INSERT INTO cms_revisions(id,entity_type,entity_id,actor_user_id,snapshot_json,created_at)
    SELECT ?,?,?,?,?,?${where}`)
    .bind(crypto.randomUUID(), "users", user.id, actorId, JSON.stringify({ ...user, roles }), nowIso(), ...params);
}

export async function GET(request:Request){try{const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);return Response.json({ok:true,actor,users:await listUsers(db),roles:CMS_ROLE_DEFINITIONS},{headers:noStore});}catch(error){return errorResponse(error);}}

export async function POST(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    requireMutationRequest(request);
    const body = await readMutationBody(request);
    if (body.action === "revokeSessions") {
      const target = typeof body.id === "string" ? body.id.trim() : "";
      if (!target || target.length > 128) invalid("USER_ID");
      const exists = await db.prepare("SELECT id FROM admin_users WHERE id=? LIMIT 1").bind(target).first<{id:string}>();
      if (!exists) invalid("USER_NOT_FOUND");
      await db.batch([
        db.prepare("DELETE FROM iaict_auth_sessions WHERE user_id=?").bind(target),
        auditStatement(db, actor.id, "cms.user.sessions.revoke", target, { self: target===actor.id }),
      ]);
      return Response.json({ok:true,revoked:true},{headers:noStore});
    }
    if(body.action!==undefined) invalid("USER_ACTION");
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const isActive = body.isActive === false || body.isActive === 0 || body.isActive === "0" ? 0 : 1;
    const roles = normalizeRoleSelection(body.roles);

    if (!email || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid("USER_EMAIL");
    if (displayName.length > 160) invalid("USER_DISPLAY_NAME");
    if (id && id.length > 128) invalid("USER_ID");
    if (roles.length === 0) invalid("USER_ROLES");
    if (id === actor.id && email !== actor.email.trim().toLowerCase()) invalid("USER_SELF_EMAIL_CHANGE");
    if (id === actor.id && !isActive) invalid("USER_SELF_DEACTIVATE");
    if (id === actor.id && !roles.includes("admin")) invalid("USER_SELF_ADMIN_REMOVE");

    const owner = await db.prepare(`SELECT id FROM admin_users WHERE lower(email)=lower(?) LIMIT 1`)
      .bind(email).first<{ id: string }>();
    if (owner && owner.id !== id) invalid("USER_EMAIL_IN_USE");

    const dbRoles = await db.prepare(`SELECT id,code FROM roles`).all<{ id: string; code: string }>();
    const roleMap = new Map(dbRoles.results.map(role => [role.code, role.id]));
    const missing = roles.filter(role => !roleMap.has(role));
    if (missing.length) invalid(`USER_ROLE_NOT_SEEDED_${missing.join("_")}`);

    let timestamp = nowIso();
    const entityId = id ?? crypto.randomUUID();
    const statements: D1PreparedStatementLike[] = [];
    let previousRoles: string[] = [];
    let revokeExistingSessions = false;
    let guardedVersion = ""; // Only non-empty for an existing user update.

    if (id) {
      const current = await db.prepare(`SELECT * FROM admin_users WHERE id=?`).bind(id).first<UserRow>();
      if (!current) invalid("USER_NOT_FOUND");
      if(typeof body.updatedAt!=="string"||!body.updatedAt)invalid("USER_VERSION_REQUIRED");
      if(body.updatedAt!==current.updated_at)invalid("USER_CONFLICT");
      timestamp=nextUserTimestamp(current.updated_at);
      guardedVersion=timestamp;
      const oldRoles = await db.prepare(`
        SELECT r.code FROM admin_user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?
      `).bind(id).all<{ code: string }>();
      previousRoles = oldRoles.results.map(row => row.code);
      revokeExistingSessions = current.email.toLowerCase()!==email ||
        current.is_active!==isActive ||
        previousRoles.slice().sort().join(",")!==roles.slice().sort().join(",");

      // Validate before *any* mutation. Previously a rejected last-admin edit
      // still created a revision row.
      const removesAdmin = current.is_active === 1 && previousRoles.includes("admin") && (!roles.includes("admin") || !isActive);
      if (removesAdmin && await countActiveAdmins(db, id) === 0) invalid("LAST_ACTIVE_ADMIN");

      if (removesAdmin) {
        statements.push(db.prepare(`
          UPDATE admin_users SET email=?,display_name=?,
            is_active=CASE WHEN ${otherActiveAdminExists} THEN ? ELSE NULL END,
            updated_at=? WHERE id=? AND updated_at=?
        `).bind(email, displayName || null, id, isActive, timestamp, id, current.updated_at));
      } else {
        statements.push(db.prepare(`UPDATE admin_users SET email=?,display_name=?,is_active=?,updated_at=? WHERE id=? AND updated_at=?`)
          .bind(email, displayName || null, isActive, timestamp, id, current.updated_at));
      }
      // A rejected CAS produces 0 changes. Every subsequent statement is
      // guarded on the NEW version; stale requests have no side effects.
      statements.push(snapshotStatement(db, actor.id, current, previousRoles, timestamp));
    } else {
      statements.push(
        db.prepare(`INSERT INTO admin_users(id,email,display_name,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?)`)
          .bind(entityId, email, displayName || null, isActive, timestamp, timestamp),
      );
    }

    if(revokeExistingSessions){
      // Same D1 transaction: privileges and all previously minted sessions change together.
      statements.push(db.prepare(`DELETE FROM iaict_auth_sessions WHERE user_id=? AND ${hasUpdatedVersion}`).bind(entityId, entityId, guardedVersion));
      // Changed identity/role/status invalidates every outstanding activation link.
      statements.push(db.prepare(`DELETE FROM iaict_activation_invites WHERE user_id=? AND ${hasUpdatedVersion}`).bind(entityId, entityId, guardedVersion));
    }
    if (id) {
      statements.push(db.prepare(`DELETE FROM admin_user_roles WHERE user_id=? AND ${hasUpdatedVersion}`)
        .bind(entityId, entityId, guardedVersion));
    } else {
      statements.push(db.prepare("DELETE FROM admin_user_roles WHERE user_id=?").bind(entityId));
    }
    for (const role of roles) {
      statements.push(id
        ? db.prepare(`INSERT INTO admin_user_roles(user_id,role_id) SELECT ?,? WHERE ${hasUpdatedVersion}`)
            .bind(entityId, roleMap.get(role)!, entityId, guardedVersion)
        : db.prepare("INSERT INTO admin_user_roles(user_id,role_id) VALUES(?,?)")
            .bind(entityId, roleMap.get(role)!));
    }
    statements.push(auditStatement(db, actor.id, id ? "cms.user.update" : "cms.user.create",
      entityId, { email, isActive: Boolean(isActive), roles, previousRoles }, guardedVersion));

    // A single D1 batch runs as one transaction. If any role INSERT or audit
    // fails, previous roles, account data, and revision are rolled back.
    const results=await db.batch(statements);
    if(Number(results[0]?.meta?.changes??0)!==1)invalid("USER_CONFLICT");
    return Response.json({ ok: true, id: entityId, updatedAt: timestamp },{headers:noStore});
  } catch (error) {
    return userMutationError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    requireMutationRequest(request);
    const body = await readMutationBody(request);
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id || id.length>128) invalid("USER_ID");
    if (id === actor.id) invalid("USER_SELF_DEACTIVATE");

    const current = await db.prepare(`SELECT * FROM admin_users WHERE id=?`).bind(id).first<UserRow>();
    if (!current) invalid("USER_NOT_FOUND");
    if(typeof body.updatedAt!=="string"||!body.updatedAt)invalid("USER_VERSION_REQUIRED");
    if(body.updatedAt!==current.updated_at)invalid("USER_CONFLICT");
    const nextVersion=nextUserTimestamp(current.updated_at);

    const roleRows = await db.prepare(`
      SELECT r.code FROM admin_user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?
    `).bind(id).all<{ code: CmsRoleCode }>();
    const roles = roleRows.results.map(row => row.code);
    if (roles.includes("admin") && current.is_active === 1 &&
        await countActiveAdmins(db, id) === 0) invalid("LAST_ACTIVE_ADMIN");

    const removingActiveAdmin = roles.includes("admin") && current.is_active === 1;
    const disableStatement = removingActiveAdmin
      ? db.prepare(`UPDATE admin_users SET
          is_active=CASE WHEN ${otherActiveAdminExists} THEN 0 ELSE NULL END,
          updated_at=? WHERE id=? AND updated_at=?`).bind(id, nextVersion, id, current.updated_at)
      : db.prepare(`UPDATE admin_users SET is_active=0,updated_at=? WHERE id=? AND updated_at=?`).bind(nextVersion, id, current.updated_at);
    const results=await db.batch([
      disableStatement,
      snapshotStatement(db, actor.id, current, roles, nextVersion),
      db.prepare(`DELETE FROM iaict_auth_sessions WHERE user_id=? AND ${hasUpdatedVersion}`).bind(id,id,nextVersion),
      db.prepare(`DELETE FROM iaict_activation_invites WHERE user_id=? AND ${hasUpdatedVersion}`).bind(id,id,nextVersion),
      auditStatement(db, actor.id, "cms.user.deactivate", id, { email: current.email, roles }, nextVersion),
    ]);
    if(Number(results[0]?.meta?.changes??0)!==1)invalid("USER_CONFLICT");
    return Response.json({ ok: true, updatedAt: nextVersion },{headers:noStore});
  } catch (error) {
    return userMutationError(error);
  }
}
