import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import {
  CMS_ADMIN_ROLES,
  CMS_ROLE_DEFINITIONS,
  normalizeRoleSelection,
  type CmsRoleCode,
} from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

type UserRow = { id:string; email:string; display_name:string|null; access_subject:string|null; is_active:number; created_at:string; updated_at:string; roles:string; };
type UserBody = { id?:unknown; email?:unknown; displayName?:unknown; isActive?:unknown; roles?:unknown; };
function nowIso(){return new Date().toISOString();}
function invalid(message:string):never{throw new Error(`INVALID_CMS_${message}`);}
function errorResponse(error:unknown){
  if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status});
  const message=error instanceof Error?error.message:"Unknown user-management error";
  const validation=message.startsWith("INVALID_CMS_");
  const conflict=/UNIQUE constraint failed/i.test(message);
  return Response.json({error:translateCmsError(message),code:cmsErrorCode(message)},{status:conflict?409:validation?400:500});
}
async function listUsers(db:ReturnType<typeof getDatabaseBinding>){
  const rows=await db.prepare(`SELECT u.id,u.email,u.display_name,u.access_subject,u.is_active,u.created_at,u.updated_at,COALESCE(group_concat(r.code),'') AS roles FROM admin_users u LEFT JOIN admin_user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id GROUP BY u.id,u.email,u.display_name,u.access_subject,u.is_active,u.created_at,u.updated_at ORDER BY u.is_active DESC,lower(COALESCE(u.display_name,u.email)),lower(u.email)`).all<UserRow>();
  return rows.results.map(row=>({...row,roles:row.roles?row.roles.split(",").filter(Boolean):[]}));
}
async function countActiveAdmins(db:ReturnType<typeof getDatabaseBinding>,excludeUserId?:string){
  const row=await db.prepare(`SELECT COUNT(DISTINCT u.id) AS count FROM admin_users u JOIN admin_user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE u.is_active=1 AND r.code='admin' ${excludeUserId?"AND u.id <> ?":""}`).bind(...(excludeUserId?[excludeUserId]:[])).first<{count:number}>();
  return Number(row?.count??0);
}
async function writeAudit(db:ReturnType<typeof getDatabaseBinding>,actorId:string,action:string,userId:string,metadata:Record<string,unknown>){await db.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),actorId,action,"users",userId,JSON.stringify(metadata),nowIso()).run();}
async function snapshotUser(db:ReturnType<typeof getDatabaseBinding>,actorId:string,user:UserRow,roles:string[]){await db.prepare(`INSERT INTO cms_revisions(id,entity_type,entity_id,actor_user_id,snapshot_json,created_at) VALUES(?,?,?,?,?,?)`).bind(crypto.randomUUID(),"users",user.id,actorId,JSON.stringify({...user,roles}),nowIso()).run();}

export async function GET(request:Request){try{const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);return Response.json({ok:true,actor,users:await listUsers(db),roles:CMS_ROLE_DEFINITIONS});}catch(error){return errorResponse(error);}}

export async function POST(request:Request){
  try{
    const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);const body=await request.json() as UserBody;
    const id=typeof body.id==="string"&&body.id.trim()?body.id.trim():null;
    const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
    const displayName=typeof body.displayName==="string"?body.displayName.trim():"";
    const isActive=body.isActive===false||body.isActive===0||body.isActive==="0"?0:1;
    const roles=normalizeRoleSelection(body.roles);
    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))invalid("USER_EMAIL");
    if(roles.length===0)invalid("USER_ROLES");
    if(id===actor.id&&email!==actor.email.trim().toLowerCase())invalid("USER_SELF_EMAIL_CHANGE");
    if(id===actor.id&&!isActive)invalid("USER_SELF_DEACTIVATE");
    if(id===actor.id&&!roles.includes("admin"))invalid("USER_SELF_ADMIN_REMOVE");
    const emailOwner=await db.prepare(`SELECT id FROM admin_users WHERE lower(email)=lower(?) LIMIT 1`).bind(email).first<{id:string}>();
    if(emailOwner&&emailOwner.id!==id)invalid("USER_EMAIL_IN_USE");
    const dbRoles=await db.prepare(`SELECT id,code FROM roles`).all<{id:string;code:string}>();
    const roleMap=new Map(dbRoles.results.map(role=>[role.code,role.id]));
    const missing=roles.filter(role=>!roleMap.has(role));
    if(missing.length)invalid(`USER_ROLE_NOT_SEEDED_${missing.join("_")}`);
    const timestamp=nowIso();const entityId=id??crypto.randomUUID();let previousRoles:string[]=[];
    if(id){
      const current=await db.prepare(`SELECT * FROM admin_users WHERE id=?`).bind(id).first<UserRow>();if(!current)invalid("USER_NOT_FOUND");
      const oldRoles=await db.prepare(`SELECT r.code FROM admin_user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?`).bind(id).all<{code:string}>();previousRoles=oldRoles.results.map(row=>row.code);await snapshotUser(db,actor.id,current,previousRoles);
      const removesAdmin=previousRoles.includes("admin")&&(!roles.includes("admin")||!isActive);if(removesAdmin&&await countActiveAdmins(db,id)===0)invalid("LAST_ACTIVE_ADMIN");
      await db.prepare(`UPDATE admin_users SET email=?,display_name=?,is_active=?,updated_at=? WHERE id=?`).bind(email,displayName||null,isActive,timestamp,id).run();
    }else await db.prepare(`INSERT INTO admin_users(id,email,display_name,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?)`).bind(entityId,email,displayName||null,isActive,timestamp,timestamp).run();
    await db.prepare(`DELETE FROM admin_user_roles WHERE user_id=?`).bind(entityId).run();
    await db.batch(roles.map(role=>db.prepare(`INSERT INTO admin_user_roles(user_id,role_id) VALUES(?,?)`).bind(entityId,roleMap.get(role)!)));
    await writeAudit(db,actor.id,id?"cms.user.update":"cms.user.create",entityId,{email,isActive:Boolean(isActive),roles,previousRoles});
    return Response.json({ok:true,id:entityId});
  }catch(error){return errorResponse(error);}
}

export async function DELETE(request:Request){
  try{
    const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);const body=await request.json() as {id?:unknown};const id=typeof body.id==="string"?body.id.trim():"";
    if(!id)invalid("USER_ID");if(id===actor.id)invalid("USER_SELF_DEACTIVATE");
    const current=await db.prepare(`SELECT * FROM admin_users WHERE id=?`).bind(id).first<UserRow>();if(!current)invalid("USER_NOT_FOUND");
    const roleRows=await db.prepare(`SELECT r.code FROM admin_user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?`).bind(id).all<{code:CmsRoleCode}>();const roles=roleRows.results.map(row=>row.code);
    if(roles.includes("admin")&&current.is_active===1&&await countActiveAdmins(db,id)===0)invalid("LAST_ACTIVE_ADMIN");
    await snapshotUser(db,actor.id,current,roles);await db.prepare(`UPDATE admin_users SET is_active=0,updated_at=? WHERE id=?`).bind(nowIso(),id).run();await writeAudit(db,actor.id,"cms.user.deactivate",id,{email:current.email,roles});
    return Response.json({ok:true});
  }catch(error){return errorResponse(error);}
}
