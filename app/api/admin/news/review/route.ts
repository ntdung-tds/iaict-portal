import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { NEWSROOM_READ_ROLES } from "@/lib/cms-roles";
import { countReviewQueue,listReviewQueue } from "@/lib/news-repository";
import { NewsroomAuthError,requireNewsroomActor } from "@/lib/newsroom-auth";
import { NEWS_REVIEW_STATUSES,type NewsReviewStatus } from "@/lib/news-workflow";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const db=getDatabaseBinding();const actor=await requireNewsroomActor(request,db,NEWSROOM_READ_ROLES);const url=new URL(request.url);const statusParam=url.searchParams.get("status")??"pending";if(!NEWS_REVIEW_STATUSES.includes(statusParam as NewsReviewStatus))return Response.json({error:"Trạng thái hàng chờ không hợp lệ."},{status:400});const limit=Number(url.searchParams.get("limit")??"30");const requestedOffset=Number(url.searchParams.get("offset")??"0");
if(!Number.isSafeInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(requestedOffset)||requestedOffset<0)return Response.json({error:"Phân trang không hợp lệ: số bài mỗi trang từ 1 đến 100, vị trí bắt đầu là số nguyên không âm."},{status:400});
const status=statusParam as NewsReviewStatus;
const total=await countReviewQueue(db,status);
const offset=Math.min(requestedOffset,Math.max(0,Math.ceil(total/limit)-1)*limit);
const items=await listReviewQueue(db,{status,limit,offset});return Response.json({ok:true,actor,status:statusParam,items,total,offset,limit},{status:200,headers:{"Cache-Control":"no-store"}});}catch(error){if(error instanceof NewsroomAuthError)return Response.json({error:error.message},{status:error.status});return Response.json({error:"Không thể tải hàng chờ Newsroom."},{status:500});}}
