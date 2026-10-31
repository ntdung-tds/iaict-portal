import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { nativeActorEmail, nativeAuthEnabled } from "@/lib/native-auth";
import { isCmsRoleCode } from "@/lib/cms-roles";

export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store, private",
  "Vary": "Cookie",
  "X-Content-Type-Options": "nosniff",
};

type ActorRecord = {
  id: string;
  email: string;
  display_name: string | null;
  role_codes: string | null;
};

/**
 * Staging native-session verification that does not require the external
 * Cloudflare Access edge. Read-only: never returns session tokens or hashes.
 * This is a pilot identity check, not an unprotected CMS administration API.
 */
export async function GET(request: Request) {
  const env = globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean };
  if (!nativeAuthEnabled(env.__IAICT_NATIVE_AUTH_ENABLED__ ? "true" : undefined)) {
    return Response.json({ error: "IAICT native login is not enabled." }, { status: 404, headers });
  }
  try {
    const db = getDatabaseBinding();
    const email = await nativeActorEmail(request, db);
    if (!email) {
      return Response.json({ error: "Phiên đăng nhập IAICT không hợp lệ hoặc đã hết hạn." }, { status: 401, headers });
    }
    const record = await db.prepare(`SELECT u.id,u.email,u.display_name,group_concat(r.code) AS role_codes
       FROM admin_users u
       LEFT JOIN admin_user_roles ar ON ar.user_id = u.id
       LEFT JOIN roles r ON r.id = ar.role_id
       WHERE lower(u.email)=lower(?) AND u.is_active=1
       GROUP BY u.id,u.email,u.display_name
       LIMIT 1`).bind(email).first<ActorRecord>();
    const roles = (record?.role_codes ?? "").split(",").filter(isCmsRoleCode);
    if (!record || roles.length === 0) {
      return Response.json({ error: "Tài khoản không còn quyền sử dụng IAICT." }, { status: 403, headers });
    }
    return Response.json({
      ok: true,
      actor: { email: record.email, displayName: record.display_name, roles },
    }, { headers });
  } catch {
    return Response.json({ error: "Không thể xác minh phiên đăng nhập." }, { status: 503, headers });
  }
}
export async function POST() {
  return Response.json({ error: "Method not allowed." }, { status: 405, headers });
}
