import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import {
  findEditorialUserById,
  findEditorialUserByUsername,
  isEditorialRole,
  normalizeUsername,
  verifyEditorialPassword,
  type EditorialRole,
} from "@/lib/admin-users";

export const ADMIN_SESSION_COOKIE = "iaict_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

export type AdminRole = EditorialRole;

export type AdminSession = {
  userId: string;
  username: string;
  displayName: string;
  role: AdminRole;
  bootstrap?: boolean;
  exp: number;
};

function getSessionSecret() {
  return process.env.IAICT_ADMIN_SESSION_SECRET ?? "";
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function isAdminRole(value: unknown): value is AdminRole {
  return isEditorialRole(value);
}

export function resolveAdminRole(): AdminRole {
  const configured = process.env.IAICT_ADMIN_ROLE;
  return isEditorialRole(configured) ? configured : "superadmin";
}

export function isAdminAuthConfigured() {
  const bootstrapReady = Boolean(process.env.IAICT_ADMIN_USERNAME && process.env.IAICT_ADMIN_PASSWORD);
  const storedUsersReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return Boolean(getSessionSecret() && (bootstrapReady || storedUsersReady));
}

export async function authenticateAdminUser(username: string, password: string): Promise<Omit<AdminSession, "exp"> | null> {
  if (!isAdminAuthConfigured()) return null;
  const normalized = normalizeUsername(username);
  const bootstrapUsername = normalizeUsername(process.env.IAICT_ADMIN_USERNAME ?? "");

  if (bootstrapUsername && normalized === bootstrapUsername && safeEqual(password, process.env.IAICT_ADMIN_PASSWORD ?? "")) {
    return {
      userId: `bootstrap:${bootstrapUsername}`,
      username: bootstrapUsername,
      displayName: "Quản trị hệ thống",
      role: resolveAdminRole(),
      bootstrap: true,
    };
  }

  const user = await findEditorialUserByUsername(normalized);
  if (!user || !user.active) return null;
  if (!verifyEditorialPassword(password, user.passwordSalt, user.passwordHash)) return null;
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

export function createAdminSession(principal: Omit<AdminSession, "exp">) {
  if (!getSessionSecret()) throw new Error("Admin session secret is not configured");
  const payload: AdminSession = {
    ...principal,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSession(token?: string | null): AdminSession | null {
  if (!token || !getSessionSecret()) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<AdminSession>;
    if (!payload.userId || !payload.username || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!isAdminRole(payload.role)) return null;
    return {
      userId: payload.userId,
      username: payload.username,
      displayName: payload.displayName || payload.username,
      role: payload.role,
      bootstrap: Boolean(payload.bootstrap),
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function validateAdminSession(token?: string | null) {
  const session = verifyAdminSession(token);
  if (!session) return null;
  if (session.bootstrap) {
    const username = normalizeUsername(process.env.IAICT_ADMIN_USERNAME ?? "");
    return username && username === session.username ? session : null;
  }
  const user = await findEditorialUserById(session.userId);
  if (!user || !user.active) return null;
  return {
    ...session,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}
