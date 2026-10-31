import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { authenticateNativePassword, cookieForSession, normalizeLoginEmail, sameOriginPost } from "@/lib/native-auth";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  const env = globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean };
  if (!env.__IAICT_NATIVE_AUTH_ENABLED__) {
    return Response.json({ error: "Đăng nhập IAICT chưa được kích hoạt." }, { status: 503, headers: noStore });
  }
  if (!sameOriginPost(request) || !request.headers.get("Content-Type")?.startsWith("application/json")) {
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403, headers: noStore });
  }
  if (Number(request.headers.get("Content-Length") || 0) > 4096) {
    return Response.json({ error: "Dữ liệu quá lớn." }, { status: 413, headers: noStore });
  }
  let payload: {email?: unknown; password?: unknown};
  try {
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: "Dữ liệu quá lớn." }, { status: 413, headers: noStore });
    payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("BAD_JSON");
  } catch {
    return Response.json({ error: "Dữ liệu đăng nhập không hợp lệ." }, { status: 400, headers: noStore });
  }
  const email = normalizeLoginEmail(payload.email);
  const password = typeof payload.password === "string" ? payload.password : "";
  try {
    const token = email ? await authenticateNativePassword(getDatabaseBinding(), email, password) : null;
    if (!token) return Response.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401, headers: noStore });
    return Response.json({ ok: true }, {
      headers: { ...noStore, "Set-Cookie": cookieForSession(token) },
    });
  } catch {
    return Response.json({ error: "Đăng nhập tạm thời không khả dụng." }, { status: 503, headers: noStore });
  }
}
export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: noStore });
}
