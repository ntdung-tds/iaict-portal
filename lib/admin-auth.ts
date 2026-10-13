import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "iaict_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

type SessionPayload = {
  username: string;
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

export function isAdminAuthConfigured() {
  return Boolean(
    process.env.IAICT_ADMIN_USERNAME &&
      process.env.IAICT_ADMIN_PASSWORD &&
      process.env.IAICT_ADMIN_SESSION_SECRET,
  );
}

export function verifyAdminCredentials(username: string, password: string) {
  if (!isAdminAuthConfigured()) return false;
  return safeEqual(username, process.env.IAICT_ADMIN_USERNAME ?? "") && safeEqual(password, process.env.IAICT_ADMIN_PASSWORD ?? "");
}

export function createAdminSession(username: string) {
  if (!getSessionSecret()) throw new Error("Admin session secret is not configured");
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSession(token?: string | null) {
  if (!token || !isAdminAuthConfigured()) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.username || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!safeEqual(payload.username, process.env.IAICT_ADMIN_USERNAME ?? "")) return null;
    return payload;
  } catch {
    return null;
  }
}
