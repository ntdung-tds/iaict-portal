import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "@/lib/admin-auth";
import {
  bootstrapEditorialUser,
  getEditorialUserSnapshot,
  hashEditorialPassword,
  isEditorialRole,
  isValidUsername,
  normalizeUsername,
  persistEditorialUsers,
  publicEditorialUser,
} from "@/lib/admin-users";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function requireSuperadmin() {
  const store = await cookies();
  const session = await validateAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
  return session?.role === "superadmin" ? session : null;
}

function payload(snapshot: Awaited<ReturnType<typeof getEditorialUserSnapshot>>) {
  const users = snapshot.state.users.map(publicEditorialUser);
  const bootstrap = bootstrapEditorialUser();
  if (bootstrap && !users.some((user) => user.username === bootstrap.username)) users.unshift(bootstrap);
  return {
    revision: snapshot.state.revision,
    updatedAt: snapshot.state.updatedAt,
    storageReady: snapshot.storageReady,
    materialized: snapshot.materialized,
    users,
  };
}

export async function GET() {
  const session = await requireSuperadmin();
  if (!session) return json({ error: "FORBIDDEN" }, 403);
  const snapshot = await getEditorialUserSnapshot();
  return json(payload(snapshot));
}

export async function POST(request: Request) {
  const session = await requireSuperadmin();
  if (!session) return json({ error: "FORBIDDEN" }, 403);

  let input: {
    action?: "create" | "update" | "reset-password" | "toggle-active";
    expectedRevision?: number;
    id?: string;
    username?: string;
    displayName?: string;
    role?: string;
    password?: string;
    active?: boolean;
  };
  try {
    input = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const snapshot = await getEditorialUserSnapshot();
  if (!snapshot.storageReady) return json({ error: "STORAGE_NOT_CONFIGURED" }, 503);
  if (typeof input.expectedRevision === "number" && input.expectedRevision !== snapshot.state.revision) {
    return json({ error: "REVISION_CONFLICT", message: "Danh sách người dùng đã thay đổi. Hãy tải lại.", ...payload(snapshot) }, 409);
  }

  const action = input.action;
  if (!action) return json({ error: "MISSING_ACTION" }, 400);
  const now = new Date().toISOString();
  let users = [...snapshot.state.users];

  if (action === "create") {
    const username = normalizeUsername(input.username ?? "");
    const displayName = (input.displayName ?? "").trim();
    const password = input.password ?? "";
    if (!isValidUsername(username)) return json({ error: "INVALID_USERNAME", message: "Tên đăng nhập cần 3–40 ký tự: chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang." }, 400);
    if (!displayName) return json({ error: "DISPLAY_NAME_REQUIRED", message: "Cần nhập tên hiển thị." }, 400);
    if (!isEditorialRole(input.role)) return json({ error: "INVALID_ROLE" }, 400);
    if (password.length < 10) return json({ error: "WEAK_PASSWORD", message: "Mật khẩu tạm thời cần tối thiểu 10 ký tự." }, 400);
    const bootstrap = bootstrapEditorialUser();
    if (users.some((user) => user.username === username) || bootstrap?.username === username) {
      return json({ error: "USERNAME_EXISTS", message: "Tên đăng nhập đã tồn tại." }, 409);
    }
    const passwordData = hashEditorialPassword(password);
    users.unshift({
      id: `user:${crypto.randomUUID()}`,
      username,
      displayName,
      role: input.role,
      active: true,
      passwordSalt: passwordData.salt,
      passwordHash: passwordData.hash,
      createdAt: now,
      updatedAt: now,
      createdBy: session.username,
    });
  } else {
    const index = users.findIndex((user) => user.id === input.id);
    if (index < 0) return json({ error: "NOT_FOUND" }, 404);
    const user = users[index];
    if (action === "update") {
      const displayName = (input.displayName ?? user.displayName).trim();
      const role = input.role ?? user.role;
      if (!displayName) return json({ error: "DISPLAY_NAME_REQUIRED" }, 400);
      if (!isEditorialRole(role)) return json({ error: "INVALID_ROLE" }, 400);
      users[index] = { ...user, displayName, role, updatedAt: now };
    } else if (action === "reset-password") {
      const password = input.password ?? "";
      if (password.length < 10) return json({ error: "WEAK_PASSWORD", message: "Mật khẩu mới cần tối thiểu 10 ký tự." }, 400);
      const passwordData = hashEditorialPassword(password);
      users[index] = { ...user, passwordSalt: passwordData.salt, passwordHash: passwordData.hash, updatedAt: now };
    } else if (action === "toggle-active") {
      users[index] = { ...user, active: typeof input.active === "boolean" ? input.active : !user.active, updatedAt: now };
    }
  }

  const next = {
    schemaVersion: 1 as const,
    revision: snapshot.state.revision + 1,
    updatedAt: now,
    users,
  };
  await persistEditorialUsers(next);
  return json(payload({ state: next, storageReady: true, materialized: true }));
}
