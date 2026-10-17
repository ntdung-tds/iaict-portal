import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { NEWSROOM_EDIT_ROLES,NEWSROOM_REVIEW_ROLES } from "@/lib/cms-roles";
import { translateNewsroomError } from "@/lib/newsroom-errors";
import { publishApprovedReviewItem,setReviewDecision,updateReviewDraft } from "@/lib/news-repository";
import { NewsroomAuthError,requireNewsroomActor } from "@/lib/newsroom-auth";
export const dynamic="force-dynamic";
function mapError(error:unknown){if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status});const message=error instanceof Error?error.message:"Unknown newsroom error";const status=message==="REVIEW_ITEM_NOT_FOUND"?404:message.includes("CONFLICT")||message==="INVALID_REVIEW_TRANSITION"?409:message.includes("REQUIRED")||message.includes("INVALID")||message.includes("TOO_SHORT")||message==="REVIEW_ITEM_NOT_EDITABLE"?400:500;return Response.json({error:translateNewsroomError(message)},{status});}
export async function POST(request:Request){
 try{
  const db=getDatabaseBinding();let raw:unknown;
  try{raw=await request.json();}catch{return Response.json({error:"Nội dung gửi lên phải là JSON hợp lệ."},{status:400});}
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return Response.json({error:"Dữ liệu xử lý bài viết không hợp lệ."},{status:400});
  const body=raw as Record<string,unknown>;const action=body.action;
  if(!["edit","approve","reject","publish"].includes(String(action)))return Response.json({error:"Thao tác xử lý bài viết không được hỗ trợ."},{status:400});
  const actor=await requireNewsroomActor(request,db,action==="edit"?NEWSROOM_EDIT_ROLES:NEWSROOM_REVIEW_ROLES);
  const queueId=typeof body.queueId==="string"?body.queueId.trim():"";
  if(!queueId)return Response.json({error:"Vui lòng chọn nội dung cần xử lý."},{status:400});
  for(const key of ["title","excerpt","categoryId","notes","reason"]){const value=body[key];if(value!==undefined&&typeof value!=="string"&&!(key!=="title"&&value===null))return Response.json({error:"Tiêu đề, tóm tắt, chuyên mục và ghi chú phải là văn bản hợp lệ."},{status:400});}
  if(action==="edit"){
   await updateReviewDraft(db,actor,{queueId,title:body.title as string|undefined,excerpt:body.excerpt as string|null|undefined,categoryId:body.categoryId as string|null|undefined,notes:body.notes as string|null|undefined});
  }else if(action==="approve"||action==="reject"){
   const reason=typeof body.reason==="string"?body.reason.trim():null;
   if(action==="reject"&&!reason)return Response.json({error:"Vui lòng nhập lý do từ chối."},{status:400});
   await setReviewDecision(db,actor,{queueId,decision:action==="approve"?"approved":"rejected",reason});
  }else{
   const article=await publishApprovedReviewItem(db,actor,queueId);return Response.json({ok:true,action,queueId,article});
  }
  return Response.json({ok:true,action,queueId});
 }catch(error){return mapError(error);}
}
