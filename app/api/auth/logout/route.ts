import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { clearSessionCookie, revokeNativeSession, sameOriginPost } from "@/lib/native-auth";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOriginPost(request)) {
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  try { await revokeNativeSession(request, getDatabaseBinding()); }
  catch { return Response.json({ error: "Không thể đăng xuất." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  return Response.json({ ok: true }, {
    headers: { "Cache-Control": "no-store", "Set-Cookie": clearSessionCookie },
  });
}
