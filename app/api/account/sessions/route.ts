import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { nativeSessionPrincipal, sameOriginPost } from "@/lib/native-auth";

export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store, private",
  "Vary": "Cookie",
  "X-Content-Type-Options": "nosniff",
};
const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers });

/** Returns only a count, never session hashes, cookies, IPs or device guesses. */
export async function GET(request: Request) {
  const enabled = (globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean }).__IAICT_NATIVE_AUTH_ENABLED__;
  if (!enabled) return json({error:"Chưa kích hoạt."},404);
  try {
    const db=getDatabaseBinding();
    const actor=await nativeSessionPrincipal(request,db);
    if(!actor)return json({error:"Vui lòng đăng nhập IAICT."},401);
    const result=await db.prepare(
      "SELECT COUNT(*) AS count FROM iaict_auth_sessions " +
      "WHERE user_id=? AND token_hash<>? AND revoked_at IS NULL AND expires_at>?",
    ).bind(actor.userId,actor.tokenHash,Date.now()).first<{count:number}>();
    return json({ok:true,otherActiveSessions:Number(result?.count??0)});
  } catch {
    return json({error:"Không thể xác minh phiên IAICT."},503);
  }
}

/** Revoke all OTHER native sessions; never touch the current cookie/session. */
export async function POST(request: Request) {
  const enabled = (globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean }).__IAICT_NATIVE_AUTH_ENABLED__;
  if (!enabled) return json({error:"Chưa kích hoạt."},404);
  if (!sameOriginPost(request)) return json({error:"Nguồn yêu cầu không hợp lệ."},403);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))
    return json({error:"Yêu cầu phải là JSON."},415);
  if(Number(request.headers.get("Content-Length")||0)>256)return json({error:"Yêu cầu quá lớn."},413);
  let body:unknown;
  try {
    const raw=await request.text();
    if(raw.length>256)return json({error:"Yêu cầu quá lớn."},413);
    body=JSON.parse(raw);
  } catch {return json({error:"Dữ liệu không hợp lệ."},400);}
  if (!body || typeof body!=="object" || Array.isArray(body) ||
    (body as Record<string,unknown>).action!=="revokeOthers" ||
    Object.keys(body).some(key=>key!=="action"))
    return json({error:"Hành động không hợp lệ."},400);
  try {
    const db=getDatabaseBinding();
    const actor=await nativeSessionPrincipal(request,db);
    if(!actor)return json({error:"Vui lòng đăng nhập IAICT."},401);
    const now=Date.now();
    const results=await db.batch([
      db.prepare(
        "UPDATE iaict_auth_sessions SET revoked_at=? WHERE user_id=? AND token_hash<>? " +
        "AND revoked_at IS NULL AND expires_at>?",
      ).bind(now,actor.userId,actor.tokenHash,now),
      db.prepare(
        "INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) " +
        "VALUES(?,?,'auth.sessions.revoke_others','admin_users',?,'{}',?)",
      ).bind(crypto.randomUUID(),actor.userId,actor.userId,new Date(now).toISOString()),
    ]);
    return json({ok:true,revoked:Number(results[0]?.meta?.changes??0)});
  } catch {
    return json({error:"Không thể thu hồi các phiên khác."},503);
  }
}
