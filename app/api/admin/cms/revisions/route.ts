import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import { saveCmsRecord } from "@/lib/cms-repository";
import { CMS_ADMIN_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { cmsModules, getCmsModule } from "@/lib/cms-schema";
import { prepareCmsData } from "@/lib/cms-validation";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

type RevisionRow={id:string;entity_type:string;entity_id:string;actor_user_id:string|null;snapshot_json:string;created_at:string;actor:string|null};
function invalid(code:string):never{throw new Error(`INVALID_CMS_${code}`);}
function snapshotObject(raw:string):Record<string,unknown>|null{try{const value=JSON.parse(raw);return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}catch{return null;}}
function hasRestorableFields(type:string,snapshot:Record<string,unknown>){return getCmsModule(type)?.fields.some(field=>!field.readonly&&field.key in snapshot)??false;}
function canAutoRestore(entityType:string){const config=getCmsModule(entityType);return Boolean(config&&!config.readOnly&&entityType!=="users");}
function errorResponse(error:unknown){
  if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status});
  const message=error instanceof Error?error.message:"Unknown revision error";
  const validation=message.startsWith("INVALID_CMS_");
  return Response.json({error:translateCmsError(message),code:cmsErrorCode(message)},{status:validation?400:500});
}

export async function GET(request:Request){
  try{
    const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_READ_ROLES);const url=new URL(request.url);const entityType=(url.searchParams.get("entityType")??"").trim();const entityId=(url.searchParams.get("entityId")??"").trim();const clauses:string[]=[];const values:string[]=[];
    if(!actor.roles.includes("admin")){
      const allowed=[...Object.values(cmsModules).filter(config=>!config.adminOnly).map(config=>config.key),"articles","article_categories","course_sessions"];
      clauses.push(`r.entity_type IN (${allowed.map(()=>"?").join(",")})`);values.push(...allowed);
    }
    if(entityType){clauses.push("r.entity_type = ?");values.push(entityType);}if(entityId){clauses.push("r.entity_id = ?");values.push(entityId);}const where=clauses.length?`WHERE ${clauses.join(" AND ")}`:"";
    const rawOffset=Number(url.searchParams.get("offset")??0);const offset=Number.isFinite(rawOffset)?Math.max(0,Math.trunc(rawOffset)):0;
    const rows=await db.prepare(`SELECT r.id,r.entity_type,r.entity_id,r.actor_user_id,r.snapshot_json,r.created_at,COALESCE(NULLIF(u.display_name,''),u.email,NULLIF(r.actor_user_id,''),'Hệ thống') AS actor FROM cms_revisions r LEFT JOIN admin_users u ON u.id=r.actor_user_id ${where} ORDER BY r.created_at DESC,r.id DESC LIMIT 40 OFFSET ?`).bind(...values,offset).all<RevisionRow>();
    const count=await db.prepare(`SELECT COUNT(*) AS count FROM cms_revisions r ${where}`).bind(...values).first<{count:number}>();
    const existing=new Set<string>();
    for(const type of new Set(rows.results.map(row=>row.entity_type))){
      if(!canAutoRestore(type))continue;
      const config=getCmsModule(type)!;const ids=[...new Set(rows.results.filter(row=>row.entity_type===type).map(row=>row.entity_id))];
      const records=await db.prepare(`SELECT id FROM ${config.table} WHERE id IN (${ids.map(()=>"?").join(",")})`).bind(...ids).all<{id:string}>();
      for(const record of records.results)existing.add(`${type}:${record.id}`);
    }
    return Response.json({ok:true,actor,total:Number(count?.count??0),revisions:rows.results.map(row=>{
      const reason=!canAutoRestore(row.entity_type)?"Loại dữ liệu này chỉ hỗ trợ xem lịch sử.":(!snapshotObject(row.snapshot_json)||!hasRestorableFields(row.entity_type,snapshotObject(row.snapshot_json)!))?"Dữ liệu phiên bản không hợp lệ.":!existing.has(`${row.entity_type}:${row.entity_id}`)?"Bản ghi gốc đã bị xóa; không hỗ trợ tự tạo lại từ phiên bản.":null;
      return {...row,canRestore:!reason,restoreReason:reason};
    })},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorResponse(error);}
}

export async function POST(request:Request){
  try{
    const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);const body=await request.json() as {revisionId?:unknown};const revisionId=typeof body.revisionId==="string"?body.revisionId.trim():"";
    if(!revisionId)invalid("REVISION_ID_REQUIRED");
    const revision=await db.prepare(`SELECT * FROM cms_revisions WHERE id=?`).bind(revisionId).first<RevisionRow>();if(!revision)invalid("REVISION_NOT_FOUND");
    const config=getCmsModule(revision.entity_type);if(!config||config.readOnly||revision.entity_type==="users")invalid("REVISION_NOT_RESTORABLE");
    const snapshot=snapshotObject(revision.snapshot_json);if(!snapshot||!hasRestorableFields(revision.entity_type,snapshot))invalid("REVISION_SNAPSHOT_INVALID");
    const current=await db.prepare(`SELECT id FROM ${config.table} WHERE id=?`).bind(revision.entity_id).first<{id:string}>();if(!current)invalid("REVISION_TARGET_MISSING");
    const prepared=await prepareCmsData(db,revision.entity_type,config,revision.entity_id,snapshot);
    await saveCmsRecord(db, actor, revision.entity_type, revision.entity_id, prepared, { restoreRevisionId: revisionId });
    return Response.json({ok:true});
  }catch(error){return errorResponse(error);}
}
