import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { getCmsOverview } from "@/lib/cms-repository";
import { CMS_READ_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

function errorResponse(error:unknown){if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status});return Response.json({error:"Không thể tải tổng quan CMS."},{status:500});}
export async function GET(request:Request){
  try{
    const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_READ_ROLES);const overview=await getCmsOverview(db);
    const [articles,sessions,published]=await Promise.all([
      db.prepare(`SELECT COUNT(*) AS count FROM articles`).first<{count:number}>(),
      db.prepare(`SELECT COUNT(*) AS count FROM course_sessions`).first<{count:number}>(),
      db.prepare(`SELECT (SELECT COUNT(*) FROM pages WHERE status='published')+(SELECT COUNT(*) FROM products WHERE status='published')+(SELECT COUNT(*) FROM solutions WHERE status='published')+(SELECT COUNT(*) FROM courses WHERE status='published')+(SELECT COUNT(*) FROM projects WHERE status='published')+(SELECT COUNT(*) FROM articles WHERE status='published')+(SELECT COUNT(*) FROM events WHERE status='published')+(SELECT COUNT(*) FROM experts WHERE status='published')+(SELECT COUNT(*) FROM partners WHERE status='published') AS count`).first<{count:number}>(),
    ]);
    return Response.json({ok:true,actor,...overview,counts:{...overview.counts,articles:Number(articles?.count??0),courseSessions:Number(sessions?.count??0)},publishedCount:Number(published?.count??0)});
  }catch(error){return errorResponse(error);}
}
