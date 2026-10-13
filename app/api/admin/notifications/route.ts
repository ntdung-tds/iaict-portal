import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "@/lib/admin-auth";
import { getNotificationInbox, markNotificationsRead } from "@/lib/admin-notifications";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function requireAdmin() {
  const cookieStore = await cookies();
  return validateAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);
  return json(await getNotificationInbox(session));
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  let payload: { ids?: string[]; markAll?: boolean };
  try {
    payload = (await request.json()) as { ids?: string[]; markAll?: boolean };
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const inbox = await getNotificationInbox(session);
  const validIds = new Set(inbox.items.map((item) => item.id));
  const ids = payload.markAll
    ? [...validIds]
    : Array.isArray(payload.ids)
      ? payload.ids.filter((id) => typeof id === "string" && validIds.has(id))
      : [];

  if (!ids.length) return json(inbox);

  try {
    await markNotificationsRead(session.userId, ids);
  } catch {
    return json({ error: "NOTIFICATION_WRITE_FAILED", message: "Không thể cập nhật trạng thái thông báo." }, 503);
  }

  return json(await getNotificationInbox(session));
}
