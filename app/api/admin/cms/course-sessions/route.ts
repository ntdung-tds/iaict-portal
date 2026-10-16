import { sessionDateIso } from "@/lib/cms-session-dates";
import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import { CMS_ADMIN_ROLES, CMS_EDIT_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor, type NewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
function nowIso(){return new Date().toISOString();}
function invalid(message:string):never{throw new Error(`INVALID_SESSION_${message}`);}
function errorResponse(error:unknown){
  if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status});
  const message=error instanceof Error?error.message:"Unknown course session error";
  const validation=message.startsWith("INVALID_SESSION_");
  return Response.json({error:translateCmsError(message),code:cmsErrorCode(message)},{status:validation?400:500});
}
function validateHttps(value:unknown){
  const text=String(value??"").trim();
  if(!text)return null;
  try{const url=new URL(text);if(url.protocol!=="https:")invalid("ONLINE_URL");return url.toString();}
  catch(error){if(error instanceof Error&&error.message.startsWith("INVALID_SESSION_"))throw error;invalid("ONLINE_URL");}
}
async function audit(db:ReturnType<typeof getDatabaseBinding>,actor:NewsroomActor,action:string,id:string){await db.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,'course_sessions',?,'{}',?)`).bind(crypto.randomUUID(),actor.id,action,id,nowIso()).run();}
async function revision(db:ReturnType<typeof getDatabaseBinding>,actor:NewsroomActor,id:string,snapshot:Row){await db.prepare(`INSERT INTO cms_revisions(id,entity_type,entity_id,actor_user_id,snapshot_json,created_at) VALUES(?,'course_sessions',?,?,?,?)`).bind(crypto.randomUUID(),id,actor.id,JSON.stringify(snapshot),nowIso()).run();}

export async function GET(request:Request){
  try{
    const db=getDatabaseBinding();
    const actor=await requireNewsroomActor(request,db,CMS_READ_ROLES);
    const sessions=await db.prepare(`SELECT s.*,c.title AS course_title,c.code AS course_code FROM course_sessions s JOIN courses c ON c.id=s.course_id ORDER BY COALESCE(s.start_at,s.created_at) DESC LIMIT 150`).all<Row>();
    const courses=await db.prepare(`SELECT id,title,code,status FROM courses WHERE status<>'archived' ORDER BY title`).all<Row>();
    return Response.json({ok:true,actor,sessions:sessions.results,courses:courses.results});
  }catch(error){return errorResponse(error);}
}

export async function POST(request:Request){
  try{
    const db=getDatabaseBinding();
    const actor=await requireNewsroomActor(request,db,CMS_EDIT_ROLES);
    const body=await request.json() as {id?:string;data?:Row};
    const data=body.data??{};
    const courseId=String(data.course_id??"").trim();
    const status=String(data.status??"draft").trim();
    if(!courseId)invalid("COURSE_REQUIRED");
    if(!["draft","open","closed","completed","cancelled"].includes(status))invalid("STATUS");
    const course=await db.prepare(`SELECT id FROM courses WHERE id=? AND status<>'archived'`).bind(courseId).first<{id:string}>();
    if(!course)invalid("COURSE_NOT_FOUND");

    const startAt=sessionDateIso(data.start_at);
    const endAt=sessionDateIso(data.end_at);
    const registrationOpenAt=sessionDateIso(data.registration_open_at);
    const registrationCloseAt=sessionDateIso(data.registration_close_at);
    if(startAt&&endAt&&new Date(endAt).getTime()<new Date(startAt).getTime())invalid("END_BEFORE_START");
    if(registrationOpenAt&&registrationCloseAt&&new Date(registrationCloseAt).getTime()<new Date(registrationOpenAt).getTime())invalid("REGISTRATION_CLOSE_BEFORE_OPEN");

    const capacity=data.capacity===""||data.capacity==null?null:Number(data.capacity);
    if(capacity!==null&&(!Number.isSafeInteger(capacity)||capacity<0))invalid("CAPACITY");
    const onlineUrl=validateHttps(data.online_url_private);
    const values=[courseId,status,startAt,endAt,registrationOpenAt,registrationCloseAt,String(data.location??"").trim()||null,onlineUrl,capacity,String(data.notes_public??"").trim()||null] as const;
    const timestamp=nowIso();
    const id=body.id?.trim()||crypto.randomUUID();
    if(body.id){
      const current=await db.prepare(`SELECT * FROM course_sessions WHERE id=?`).bind(id).first<Row>();
      if(!current)invalid("NOT_FOUND");
      await revision(db,actor,id,current);
      await db.prepare(`UPDATE course_sessions SET course_id=?,status=?,start_at=?,end_at=?,registration_open_at=?,registration_close_at=?,location=?,online_url_private=?,capacity=?,notes_public=?,updated_at=? WHERE id=?`).bind(...values,timestamp,id).run();
    }else{
      await db.prepare(`INSERT INTO course_sessions(id,course_id,status,start_at,end_at,registration_open_at,registration_close_at,location,online_url_private,capacity,notes_public,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,...values,timestamp,timestamp).run();
    }
    await audit(db,actor,body.id?"cms.course_session.update":"cms.course_session.create",id);
    const record=await db.prepare(`SELECT s.*,c.title AS course_title,c.code AS course_code FROM course_sessions s JOIN courses c ON c.id=s.course_id WHERE s.id=?`).bind(id).first<Row>();
    return Response.json({ok:true,id,record});
  }catch(error){return errorResponse(error);}
}

export async function DELETE(request:Request){
  try{
    const db=getDatabaseBinding();
    const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);
    const body=await request.json() as {id?:string};
    const id=body.id?.trim()??"";
    if(!id)invalid("ID");
    const current=await db.prepare(`SELECT * FROM course_sessions WHERE id=?`).bind(id).first<Row>();
    if(!current)invalid("NOT_FOUND");
    await revision(db,actor,id,current);
    await db.prepare(`DELETE FROM course_sessions WHERE id=?`).bind(id).run();
    await audit(db,actor,"cms.course_session.delete",id);
    return Response.json({ok:true});
  }catch(error){return errorResponse(error);}
}
