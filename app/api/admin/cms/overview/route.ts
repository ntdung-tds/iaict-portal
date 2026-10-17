import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { getCmsOverview } from "@/lib/cms-repository";
import { CMS_READ_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

function errorResponse(error:unknown){if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status});return Response.json({error:"Không thể tải tổng quan CMS."},{status:500});}
export async function GET(request:Request){
  try{
    const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,CMS_READ_ROLES);const overview=await getCmsOverview(db,actor.roles.includes("admin"));
    return Response.json({ok:true,actor,...overview},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorResponse(error);}
}
