/**
 * Private Media inventory. No original bytes, R2 keys, digests or public URLs.
 * Staging-only: quarantine may be inspected but never displayed or published.
 */
import type { D1DatabaseLike } from "./cloudflare-db";
import type { NewsroomActor } from "./newsroom-auth";
import { MEDIA_POLICY } from "./media-policy";
import { MEDIA_STAGING_SCOPE_ID } from "./media-r2-quarantine";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
type InventoryRow = {
  id:string; display_filename:string; mime_type:string; byte_length:number; state:string;
  revision:number; created_at:string; updated_at:string; actor_user_id:string;
  private_scan_count:number;
};
export type PrivateMediaItem = Readonly<{
  id:string; filename:string; mimeType:string; bytes:number; state:string;
  revision:number; createdAt:string; updatedAt:string; scanPrivate:boolean;
  canRevoke:boolean; publicUrl:null;
}>;
export type MediaLibraryResult =
  | {ok:true;items:PrivateMediaItem[];page:number;pageSize:number;hasNext:boolean;publicAccess:false}
  | {ok:false;status:400|403|503;code:string};
export type MediaRevokeResult =
  | {ok:true;status:200;id:string;state:"REVOKED";publicUrl:null}
  | {ok:false;status:400|403|404|409|503;code:string};

function isAdmin(actor:NewsroomActor) {return actor.roles.includes("admin");}
function canInventory(actor:NewsroomActor) {
  return actor.roles.some(role => role==="admin" || role==="reviewer" || role==="editor");
}
function writable(result:unknown) {
  const r=result as {success?:boolean;meta?:{changes?:unknown}}|null;
  return !!r && r.success!==false && Number.isSafeInteger(r.meta?.changes) && r.meta?.changes===1;
}

/** Pagination is bounded to avoid large D1 reads and sensitive bulk enumeration. */
export async function listPrivateMedia(
  db:D1DatabaseLike,actor:NewsroomActor, rawPage:unknown=1,
):Promise<MediaLibraryResult> {
  if(!canInventory(actor))return {ok:false,status:403,code:"ROLE_DENIED"};
  const page=typeof rawPage==="number"?rawPage:Number(rawPage);
  if(!Number.isSafeInteger(page)||page<1||page>100)
    return {ok:false,status:400,code:"INVALID_PAGE"};
  const limit=20;
  try {
    // Editor may inspect only the upload entries they themselves created.
    // Reviewer/Admin can inspect scoped metadata, never unscanned content.
    const result=await db.prepare(`SELECT m.id,m.display_filename,m.mime_type,m.byte_length,
      m.state,m.revision,m.created_at,m.updated_at,m.actor_user_id,
      CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS private_scan_count
      FROM media_r2_quarantine_uploads m
      LEFT JOIN media_r2_scan_evidence e ON e.source_upload_id=m.id
      WHERE m.scope_id=? AND (?=1 OR m.actor_user_id=?)
      ORDER BY m.created_at DESC,m.id DESC LIMIT ? OFFSET ?`)
      .bind(MEDIA_STAGING_SCOPE_ID,isAdmin(actor)||actor.roles.includes("reviewer")?1:0,
        actor.id,limit+1,(page-1)*limit).all<InventoryRow>();
    const rows=result.results;
    return {ok:true,page,pageSize:limit,hasNext:rows.length>limit,publicAccess:false,
      items:rows.slice(0,limit).map(row=>({
        id:row.id,filename:row.display_filename,mimeType:row.mime_type,bytes:row.byte_length,
        state:row.state,revision:row.revision,createdAt:row.created_at,updatedAt:row.updated_at,
        scanPrivate:row.private_scan_count===1,
        canRevoke:isAdmin(actor)&&row.state==="QUARANTINED",
        publicUrl:null,
      }))};
  }catch{return {ok:false,status:503,code:"MEDIA_LIBRARY_UNAVAILABLE"}}
}

/**
 * Explicit admin-only revocation with exact D1 CAS and audit.
 * It NEVER deletes user bytes synchronously or exposes original bytes.
 * Existing bounded janitor handles the 24h REVOKED retention window.
 */
export async function revokePrivateMedia(
 db:D1DatabaseLike,actor:NewsroomActor,id:unknown,expectedRevision:unknown,
):Promise<MediaRevokeResult>{
 if(!isAdmin(actor))return {ok:false,status:403,code:"ROLE_DENIED"};
 if(typeof id!=="string"||!UUID.test(id)||typeof expectedRevision!=="number"||
    !Number.isSafeInteger(expectedRevision)||expectedRevision<1)
   return {ok:false,status:400,code:"INVALID_REVOKE_REQUEST"};
 try{
   const row=await db.prepare("SELECT state,revision FROM media_r2_quarantine_uploads WHERE id=? AND scope_id=? LIMIT 1")
      .bind(id,MEDIA_STAGING_SCOPE_ID).first<{state:string;revision:number}>();
   if(!row)return {ok:false,status:404,code:"MEDIA_NOT_FOUND"};
   if(row.state!=="QUARANTINED"||row.revision!==expectedRevision)
     return {ok:false,status:409,code:"MEDIA_STATE_CONFLICT"};
   // D1 batch executes atomically. SQLite changes() ties the audit insert
   // to the immediately preceding CAS UPDATE even when another request raced.
   const ops=await db.batch([
     db.prepare(`UPDATE media_r2_quarantine_uploads
       SET state='REVOKED',revision=revision+1,updated_at=datetime('now')
       WHERE id=? AND scope_id=? AND state='QUARANTINED' AND revision=?`)
       .bind(id,MEDIA_STAGING_SCOPE_ID,expectedRevision),
     db.prepare(`INSERT INTO audit_logs
       (id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
       SELECT ?,?,'media.quarantine.revoked','media_r2_quarantine',id,?,datetime('now')
       FROM media_r2_quarantine_uploads
       WHERE id=? AND scope_id=? AND state='REVOKED' AND revision=? AND changes()=1`)
       .bind(crypto.randomUUID(),actor.id,JSON.stringify({policy:MEDIA_POLICY.id,state:"REVOKED"}),
         id,MEDIA_STAGING_SCOPE_ID,expectedRevision+1),
   ]);
   if(ops.length!==2||!ops.every(writable))
     return {ok:false,status:409,code:"MEDIA_STATE_CONFLICT"};
   return {ok:true,status:200,id,state:"REVOKED",publicUrl:null};
 }catch{return {ok:false,status:503,code:"MEDIA_REVOKE_UNAVAILABLE"}}
}
