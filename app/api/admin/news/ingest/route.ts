import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { NEWSROOM_ADMIN_ROLES } from "@/lib/cms-roles";
import { translateNewsroomError } from "@/lib/newsroom-errors";
import { ingestNewsSource } from "@/lib/news-repository";
import { NewsroomAuthError,requireNewsroomActor } from "@/lib/newsroom-auth";
export const dynamic="force-dynamic";
function errorResponse(error:unknown){if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status});const message=error instanceof Error?error.message:"Unknown newsroom error";const status=message==="NEWS_SOURCE_NOT_ACTIVE"?400:500;return Response.json({error:translateNewsroomError(message)},{status});}
export async function POST(request:Request){try{const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,NEWSROOM_ADMIN_ROLES);const body=await request.json() as {sourceId?:unknown};const sourceId=typeof body.sourceId==="string"?body.sourceId.trim():"";if(!sourceId)return Response.json({error:"Vui lòng chọn nguồn tin cần lấy dữ liệu."},{status:400});const summary=await ingestNewsSource(db,sourceId,{actorId:actor.id});return Response.json({ok:true,summary},{status:200});}catch(error){return errorResponse(error);}}
