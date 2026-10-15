import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import { saveCmsRecord } from "@/lib/cms-repository";
import { CMS_ADMIN_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { getCmsModule } from "@/lib/cms-schema";
import { prepareCmsData } from "@/lib/cms-validation";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

type RevisionRow={id:string;entity_type:string;entity_id:string;actor_user_id:string|null;snapshot_json:string;created_at:string;actor:string|null};
function invalid(code:string):never{throw new Error(`INVALID_CMS_${code}`);}
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
    if(entityType){clauses.push("r.entity_type = ?");values.push(entityType);}if(entityId){clauses.push("r.entity_id = ?");values.push(entityId);}const where=clauses.length?`WHERE ${clauses.join(" AND ")}`:"";
    const rows=await db.prepare(`SELECT r.id,r.entity_type,r.entity_id,r.actor_user_id,r.snapshot_json,r.created_at,COALESCE(u.display_name,u.email,'Hệ thống') AS actor FROM cms_revisions r LEFT JOIN admin_users u ON u.id=r.actor_user_id ${where} ORDER BY r.created_at DESC LIMIT 120`).bind(...values).all<RevisionRow>();
    return Response.json({ok:true,actor,revisions:rows.results.map(row=>({...row,canRestore:canAutoRestore(row.entity_type)}))});
  }catch(error){return errorResponse(error);}
}

export async function POST(request:Request){
  try{
    const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);const body=await request.json() as {revisionId?:unknown};const revisionId=typeof body.revisionId==="string"?body.revisionId.trim():"";
    if(!revisionId)invalid("REVISION_ID_REQUIRED");
    const revision=await db.prepare(`SELECT * FROM cms_revisions WHERE id=?`).bind(revisionId).first<RevisionRow>();if(!revision)invalid("REVISION_NOT_FOUND");
    const config=getCmsModule(revision.entity_type);if(!config||config.readOnly||revision.entity_type==="users")invalid("REVISION_NOT_RESTORABLE");
    let snapshot:Record<string,unknown>;try{snapshot=JSON.parse(revision.snapshot_json) as Record<string,unknown>;}catch{invalid("REVISION_SNAPSHOT_INVALID");}
    const prepared=await prepareCmsData(db,revision.entity_type,config,revision.entity_id,snapshot);
    await saveCmsRecord(db,actor,revision.entity_type,revision.entity_id,prepared);
    await db.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),actor.id,"cms.revision.restore",revision.entity_type,revision.entity_id,JSON.stringify({revisionId}),new Date().toISOString()).run();
    return Response.json({ok:true});
  }catch(error){return errorResponse(error);}
}
