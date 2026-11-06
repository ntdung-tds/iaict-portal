import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { redeemNativeActivation } from "@/lib/native-activation";
import { acceptableNewPassword, sameOriginPost, validPassword } from "@/lib/native-auth";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private", "Vary": "Cookie",
  "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
const json = (body:Record<string,unknown>,status:number) =>
  Response.json(body,{status,headers});

export async function POST(request:Request) {
  const runtime = globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean };
  if (!runtime.__IAICT_NATIVE_AUTH_ENABLED__) return json({error:"Chưa kích hoạt."},404);
  if (!sameOriginPost(request)) return json({error:"Nguồn yêu cầu không hợp lệ."},403);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return json({error:"Yêu cầu phải là JSON."},415);
  }
  if (Number(request.headers.get("Content-Length")||0)>4096) return json({error:"Dữ liệu quá lớn."},413);
  try {
    const raw=await request.text();
    if(raw.length>4096) return json({error:"Dữ liệu quá lớn."},413);
    const body:unknown=JSON.parse(raw);
    if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"Dữ liệu không hợp lệ."},400);
    const {token,password} = body as Record<string,unknown>;
    if(typeof token!=="string"||! /^[a-f0-9]{64}$/.test(token)) {
      return json({error:"Liên kết không hợp lệ hoặc đã hết hạn."},400);
    }
    if(!validPassword(password))return json({error:"Mật khẩu phải dài 8–128 ký tự."},400);
    if(!acceptableNewPassword(password)) return json({error:"Mật khẩu quá phổ biến hoặc dễ đoán. Vui lòng chọn mật khẩu khác."},400);
    const ok=await redeemNativeActivation(getDatabaseBinding(),token,password);
    if(!ok)return json({error:"Liên kết không hợp lệ, đã sử dụng hoặc hết hạn."},410);
    return json({ok:true,loginUrl:"/login"},200);
  } catch { return json({error:"Không thể kích hoạt tài khoản."},503); }
}
export async function GET(){return json({error:"Method not allowed."},405);}
