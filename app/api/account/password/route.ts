import { getDatabaseBinding } from "@/lib/cloudflare-db";
import {
  acceptableNewPassword, clearSessionCookie, nativeActorEmail, sameOriginPost, setNativePassword, validPassword,
} from "@/lib/native-auth";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, private",
  "Vary": "Cookie",
  "X-Content-Type-Options": "nosniff",
};
const json = (body: Record<string, unknown>, status: number) =>
  Response.json(body, { status, headers: responseHeaders });

/**
 * Native user self-service password rotation, independent of Cloudflare Access.
 * A genuine, unexpired, unrevoked IAICT session AND the current password are
 * both mandatory. This never bootstraps a new credential for another user.
 * Successful rotation invalidates all native sessions, including this one.
 */
export async function POST(request: Request) {
  const runtime = globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean };
  if (!runtime.__IAICT_NATIVE_AUTH_ENABLED__) return json({ error: "Chức năng chưa được kích hoạt." }, 404);

  if (!sameOriginPost(request)) return json({ error: "Nguồn yêu cầu không hợp lệ." }, 403);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Yêu cầu phải là JSON." }, 415);
  }
  if (Number(request.headers.get("Content-Length") || 0) > 4096) {
    return json({ error: "Dữ liệu quá lớn." }, 413);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: "Dữ liệu quá lớn." }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("BAD_BODY");
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "Dữ liệu không hợp lệ." }, 400);
  }
  if (!validPassword(body.password) ||
      typeof body.currentPassword !== "string" ||
      !validPassword(body.currentPassword)) {
    return json({ error: "Mật khẩu hiện tại và mật khẩu mới phải dài 8–128 ký tự." }, 400);
  }
  if (!acceptableNewPassword(body.password)) {
    return json({error:"Mật khẩu mới quá phổ biến hoặc dễ đoán. Vui lòng chọn mật khẩu khác."},400);
  }
  if (body.password === body.currentPassword) {
    return json({ error: "Mật khẩu mới phải khác mật khẩu hiện tại." }, 400);
  }

  try {
    const db = getDatabaseBinding();
    const email = await nativeActorEmail(request, db);
    if (!email) return json({ error: "Vui lòng đăng nhập lại IAICT." }, 401);

    // Never trust an email supplied by the client. Require currently active
    // membership and a previously established native password.
    const actor = await db.prepare(
      "SELECT u.id,u.email FROM admin_users u " +
      "WHERE lower(u.email)=lower(?) AND u.is_active=1 " +
      "AND EXISTS(SELECT 1 FROM admin_user_roles r WHERE r.user_id=u.id) " +
      "AND EXISTS(SELECT 1 FROM iaict_password_credentials_v2 c WHERE c.user_id=u.id) " +
      "LIMIT 1",
    ).bind(email.toLowerCase()).first<{ id: string; email: string }>();
    if (!actor) return json({ error: "Tài khoản chưa đủ điều kiện đổi mật khẩu." }, 403);

    await setNativePassword(db, actor, body.password, body.currentPassword);
    return Response.json({ ok: true, reauthenticationRequired: true }, {
      headers: { ...responseHeaders, "Set-Cookie": clearSessionCookie },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CURRENT_PASSWORD") {
      return json({ error: "Mật khẩu hiện tại không đúng." }, 403);
    }
    return json({ error: "Không thể đổi mật khẩu. Vui lòng thử lại." }, 503);
  }
}

export async function GET() {
  return json({ error: "Method not allowed." }, 405);
}
