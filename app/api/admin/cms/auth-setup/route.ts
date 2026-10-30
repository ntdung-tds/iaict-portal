import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { CMS_ADMIN_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";
import { sameOriginPost, setNativePassword, validPassword } from "@/lib/native-auth";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  if (!sameOriginPost(request)) return Response.json({ error: "Invalid origin" }, { status: 403, headers: noStore });
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: "Payload too large" }, { status: 413, headers: noStore });
    const body = JSON.parse(raw) as {password?:unknown;currentPassword?:unknown};
    if (!validPassword(body.password)) {
      return Response.json({ error: "Mật khẩu phải dài 14–128 ký tự." }, { status: 400, headers: noStore });
    }
    const result = await setNativePassword(db, actor, body.password,
      typeof body.currentPassword === "string" ? body.currentPassword : undefined);
    return Response.json({ ok: true, action: result }, { headers: noStore });
  } catch (error) {
    if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status, headers: noStore });
    if (error instanceof Error && error.message === "INVALID_CURRENT_PASSWORD") {
      return Response.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 403, headers: noStore });
    }
    return Response.json({ error: "Không thể cập nhật mật khẩu." }, { status: 503, headers: noStore });
  }
}
