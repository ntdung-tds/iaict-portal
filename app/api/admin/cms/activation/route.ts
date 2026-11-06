import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { CMS_ADMIN_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";
import { issueNativeActivation, revokeNativeActivation } from "@/lib/native-activation";
import { sameOriginPost } from "@/lib/native-auth";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private", "Vary": "Cookie",
  "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const json = (body: Record<string,unknown>, status: number) =>
  Response.json(body, { status, headers });

export async function POST(request: Request) {
  const runtime = globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean };
  if (!runtime.__IAICT_NATIVE_AUTH_ENABLED__) return json({error:"Chưa kích hoạt."}, 404);
  if (!sameOriginPost(request)) return json({error:"Nguồn yêu cầu không hợp lệ."}, 403);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return json({error:"Yêu cầu phải là JSON."},415);
  }
  if (Number(request.headers.get("Content-Length") || 0)>4096) return json({error:"Dữ liệu quá lớn."},413);
  try {
    const db=getDatabaseBinding();
    const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);
    const raw=await request.text();
    if (raw.length>4096) return json({error:"Dữ liệu quá lớn."},413);
    const body: unknown=JSON.parse(raw);
    if (!body || typeof body!=="object" || Array.isArray(body)) return json({error:"Dữ liệu không hợp lệ."},400);
    const id=(body as Record<string,unknown>).id;
    if (typeof id!=="string" || !id.trim() || id.length>128) return json({error:"Tài khoản không hợp lệ."},400);
    const action=(body as Record<string,unknown>).action;
    if(action==="revoke"){
      const revoked=await revokeNativeActivation(db,actor.id,id.trim());
      return json({ok:true,revoked},200);
    }
    if(action!==undefined)return json({error:"Hành động không hợp lệ."},400);
    const activation=await issueNativeActivation(db,actor.id,id.trim());
    // One-time bearer link is returned only to the verified administrator.
    // Fragment prevents token transmission in the GET request or referer.
    return Response.json({ok:true,activationUrl:new URL("/activate",request.url).origin +
      "/activate#token="+activation.token,expiresAt:activation.expiresAt},{headers});
  } catch(error) {
    if(error instanceof NewsroomAuthError) return json({error:error.message},error.status);
    if(error instanceof Error && error.message==="ACTIVATION_NOT_ELIGIBLE") {
      return json({error:"Tài khoản không đủ điều kiện kích hoạt."},409);
    }
    return json({error:"Không thể tạo liên kết kích hoạt."},503);
  }
}
export async function GET() { return json({error:"Method not allowed"},405); }
