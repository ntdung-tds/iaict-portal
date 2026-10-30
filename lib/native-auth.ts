import type { D1DatabaseLike } from "./cloudflare-db";

/** Set only by worker.ts after verifying a D1-backed cookie. */
export const NATIVE_VERIFIED_EMAIL_HEADER = "X-IAICT-Verified-Email";
export const NATIVE_COOKIE = "__Host-iaict_session";
// Workerd limits PBKDF2 to 100,000 iterations per WebCrypto invocation.
export const PBKDF2_ITERATIONS = 100_000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) => [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
const randomHex = (length: number) => hex(crypto.getRandomValues(new Uint8Array(length)));
async function sha256(value: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}
function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
export function normalizeLoginEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 128 &&
    !/[\u0000-\u001f\u007f]/.test(value);
}
async function derivePassword(password: string, saltHex: string, iterations: number): Promise<string> {
  if (!/^[0-9a-f]{32,128}$/.test(saltHex) || iterations !== PBKDF2_ITERATIONS) {
    throw new Error("INVALID_PASSWORD_CREDENTIAL");
  }
  const salt = new Uint8Array(saltHex.match(/../g)!.map(part => Number.parseInt(part, 16)));
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, material, 256,
  )));
}
export async function createPasswordHash(password: string) {
  if (!validPassword(password)) throw new Error("INVALID_PASSWORD_LENGTH");
  const salt = randomHex(16);
  return { salt, hash: await derivePassword(password, salt, PBKDF2_ITERATIONS), iterations: PBKDF2_ITERATIONS };
}
export async function verifyPasswordHash(
  password: string, credential: { salt: string; password_hash: string; iterations: number },
): Promise<boolean> {
  const actual = await derivePassword(password, credential.salt, credential.iterations);
  return constantTimeEqual(actual, credential.password_hash);
}
export function sameOriginPost(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return origin !== null && origin === new URL(request.url).origin;
}
export function nativeAuthEnabled(value: unknown): boolean { return value === "true"; }
export function cookieForSession(token: string): string {
  return NATIVE_COOKIE + "=" + token +
    "; Path=/; Max-Age=" + Math.floor(SESSION_TTL_MS / 1000) + "; HttpOnly; Secure; SameSite=Lax";
}
export const clearSessionCookie = NATIVE_COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
function cookieToken(request: Request): string | null {
  const match = request.headers.get("Cookie")?.match(/(?:^|;\s*)__Host-iaict_session=([a-f0-9]{64})(?:;|$)/);
  return match?.[1] ?? null;
}
export async function nativeActorEmail(request: Request, db: D1DatabaseLike): Promise<string | null> {
  const token = cookieToken(request);
  if (!token) return null;
  const hash = await sha256(token);
  const row = await db.prepare(
    "SELECT u.email FROM iaict_auth_sessions s JOIN admin_users u ON u.id=s.user_id " +
    "WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.is_active=1 LIMIT 1",
  ).bind(hash, Date.now()).first<{email: string}>();
  return row?.email ?? null;
}
export async function revokeNativeSession(request: Request, db: D1DatabaseLike) {
  const token = cookieToken(request);
  if (token) {
    await db.prepare("UPDATE iaict_auth_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL")
      .bind(Date.now(), await sha256(token)).run();
  }
}
type CredentialRow = {id: string; salt: string; password_hash: string; iterations: number};
async function failLogin(db: D1DatabaseLike, key: string, now: number) {
  await db.prepare(
    "INSERT INTO iaict_login_attempts(email_hash,window_start,failures,blocked_until) VALUES(?,?,1,0) " +
    "ON CONFLICT(email_hash) DO UPDATE SET " +
    "window_start=CASE WHEN ?-window_start>? THEN ? ELSE window_start END, " +
    "failures=CASE WHEN ?-window_start>? THEN 1 ELSE failures+1 END, " +
    "blocked_until=CASE WHEN ?-window_start>? THEN 0 " +
    "WHEN failures+1>=? THEN ? ELSE blocked_until END",
  ).bind(key, now, now, LOGIN_WINDOW_MS, now, now, LOGIN_WINDOW_MS,
    now, LOGIN_WINDOW_MS, MAX_FAILURES, now + LOGIN_WINDOW_MS).run();
}
export async function authenticateNativePassword(
  db: D1DatabaseLike, email: string, password: string,
): Promise<string | null> {
  const normalized = normalizeLoginEmail(email);
  if (!normalized || !validPassword(password)) return null;
  const emailKey = await sha256(normalized);
  const now = Date.now();
  const attempts = await db.prepare("SELECT blocked_until FROM iaict_login_attempts WHERE email_hash=? LIMIT 1")
    .bind(emailKey).first<{blocked_until: number}>();
  if (Number(attempts?.blocked_until ?? 0) > now) return null;
  const user = await db.prepare(
    "SELECT u.id,c.salt,c.password_hash,c.iterations FROM admin_users u " +
    "JOIN iaict_password_credentials_v2 c ON c.user_id=u.id " +
    "WHERE lower(u.email)=? AND u.is_active=1 AND EXISTS(" +
    "SELECT 1 FROM admin_user_roles ar WHERE ar.user_id=u.id) LIMIT 1",
  ).bind(normalized).first<CredentialRow>();
  const dummy = {salt:"7ba4bd5ac74d98ae5a725f6e0cd57a2a", password_hash:"00".repeat(32), iterations: PBKDF2_ITERATIONS};
  const valid = await verifyPasswordHash(password, user ?? dummy);
  if (!user || !valid) { await failLogin(db, emailKey, now); return null; }
  const token = randomHex(32);
  const hash = await sha256(token);
  await db.batch([
    db.prepare("DELETE FROM iaict_login_attempts WHERE email_hash=?").bind(emailKey),
    db.prepare(
      "INSERT INTO iaict_auth_sessions(token_hash,user_id,created_at,expires_at) " +
      "SELECT ?,u.id,?,? FROM admin_users u WHERE u.id=? AND u.is_active=1",
    ).bind(hash, now, now + SESSION_TTL_MS, user.id),
  ]);
  return token;
}
export async function setNativePassword(
  db: D1DatabaseLike, actor: {id: string; email: string}, password: string, currentPassword?: string,
): Promise<"created"|"rotated"> {
  if (!validPassword(password)) throw new Error("INVALID_PASSWORD_LENGTH");
  const old = await db.prepare("SELECT salt,password_hash,iterations FROM iaict_password_credentials_v2 WHERE user_id=?")
    .bind(actor.id).first<{salt:string;password_hash:string;iterations:number}>();
  if (old && (!currentPassword || !(await verifyPasswordHash(currentPassword, old)))) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }
  const next = await createPasswordHash(password);
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(
      "INSERT INTO iaict_password_credentials_v2(user_id,salt,password_hash,iterations,updated_at) " +
      "VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET " +
      "salt=excluded.salt,password_hash=excluded.password_hash," +
      "iterations=excluded.iterations,updated_at=excluded.updated_at",
    ).bind(actor.id, next.salt, next.hash, next.iterations, now),
    db.prepare("DELETE FROM iaict_auth_sessions WHERE user_id=?").bind(actor.id),
    db.prepare(
      "INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) " +
      "VALUES(?,?,'auth.password.rotate','admin_users',?,'{}',?)",
    ).bind(crypto.randomUUID(), actor.id, actor.id, now),
  ]);
  return old ? "rotated" : "created";
}
