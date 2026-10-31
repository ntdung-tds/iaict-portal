import type { D1DatabaseLike } from "./cloudflare-db";
import { acceptableNewPassword, createPasswordHash, validPassword } from "./native-auth";

export const ACTIVATION_TTL_MS = 30 * 60 * 1000;
const tokenPattern = /^[a-f0-9]{64}$/;
const hex = (bytes: Uint8Array) => [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
const sha256 = async (value: string) =>
  hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));

/**
 * Only an already verified CMS administrator may call this function. The
 * returned 256-bit bearer token is displayed ONCE and never stored/logged.
 * Existing passwords cannot be reset or overridden with an invitation.
 */
export async function issueNativeActivation(
  db: D1DatabaseLike, actorId: string, userId: string,
): Promise<{ token: string; expiresAt: number }> {
  if (!userId || userId.length > 128 || !actorId || actorId.length > 128) {
    throw new Error("INVALID_ACTIVATION_TARGET");
  }
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const now = Date.now();
  const expiresAt = now + ACTIVATION_TTL_MS;
  const results = await db.batch([
    db.prepare(
      "INSERT INTO iaict_activation_invites" +
      "(user_id,token_hash,issued_by,issued_at,expires_at,consumed_at) " +
      "SELECT u.id,?,?,?, ?,NULL FROM admin_users u " +
      "WHERE u.id=? AND u.id<>? AND u.is_active=1 " +
      "AND EXISTS(SELECT 1 FROM admin_user_roles r WHERE r.user_id=u.id) " +
      "AND NOT EXISTS(SELECT 1 FROM iaict_password_credentials_v2 c WHERE c.user_id=u.id) " +
      "ON CONFLICT(user_id) DO UPDATE SET token_hash=excluded.token_hash," +
      "issued_by=excluded.issued_by,issued_at=excluded.issued_at," +
      "expires_at=excluded.expires_at,consumed_at=NULL",
    ).bind(tokenHash, actorId, now, expiresAt, userId, actorId),
    db.prepare(
      "INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) " +
      "SELECT ?,?,'auth.activation.issue','admin_users',?,'{}',? " +
      "WHERE EXISTS(SELECT 1 FROM iaict_activation_invites WHERE user_id=? AND token_hash=?)",
    ).bind(crypto.randomUUID(), actorId, userId, new Date(now).toISOString(), userId, tokenHash),
  ]);
  if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new Error("ACTIVATION_NOT_ELIGIBLE");
  return { token, expiresAt };
}

/**
 * Requires token from URL fragment + same-origin POST. A single D1 batch
 * inserts the first credential, consumes the invite, and writes the audit.
 * Conditional INSERT and unique user_id rule make concurrent replays fail.
 */
export async function redeemNativeActivation(
  db: D1DatabaseLike, token: string, password: string,
): Promise<boolean> {
  if (!tokenPattern.test(token) || !acceptableNewPassword(password)) return false;
  const tokenHash = await sha256(token);
  const now = Date.now();
  // A random, unknown, expired, used or disabled-user invitation must NOT
  // trigger PBKDF2. This is a publicly reachable API: expensive derivation
  // before a cheap indexed lookup permits unauthenticated CPU exhaustion.
  // The invite token is 256 random bits; lookups do not expose identities.
  const eligible = await db.prepare(
    "SELECT i.user_id FROM iaict_activation_invites i " +
    "JOIN admin_users u ON u.id=i.user_id " +
    "WHERE i.token_hash=? AND i.consumed_at IS NULL " +
    "AND i.expires_at>? AND i.issued_at<=? AND u.is_active=1 " +
    "AND EXISTS(SELECT 1 FROM admin_user_roles r WHERE r.user_id=i.user_id) " +
    "AND NOT EXISTS(SELECT 1 FROM iaict_password_credentials_v2 c WHERE c.user_id=i.user_id) " +
    "LIMIT 1",
  ).bind(tokenHash, now, now).first<{user_id:string}>();
  if (!eligible) return false;
  // The indexed preflight is only an optimization. The atomic D1 batch below
  // MUST re-check expiration/consumption/user state to defeat concurrent use.
  const credential = await createPasswordHash(password);
  // Expiration must also hold at commit time, not only before PBKDF2 work.
  const commitNow = Date.now();
  const createdAt = new Date(commitNow).toISOString();
  const currentCredential = "EXISTS(SELECT 1 FROM iaict_password_credentials_v2 c " +
    "WHERE c.user_id=i.user_id AND c.salt=? AND c.password_hash=? AND c.iterations=?)";
  const results = await db.batch([
    db.prepare(
      "INSERT INTO iaict_password_credentials_v2" +
      "(user_id,salt,password_hash,iterations,updated_at) " +
      "SELECT i.user_id,?,?,?,? FROM iaict_activation_invites i " +
      "JOIN admin_users u ON u.id=i.user_id " +
      "WHERE i.token_hash=? AND i.consumed_at IS NULL AND i.expires_at>? " +
      "AND i.issued_at<=? AND u.is_active=1 " +
      "AND EXISTS(SELECT 1 FROM admin_user_roles r WHERE r.user_id=u.id) " +
      "AND NOT EXISTS(SELECT 1 FROM iaict_password_credentials_v2 c WHERE c.user_id=u.id) " +
      "ON CONFLICT(user_id) DO NOTHING",
    ).bind(credential.salt, credential.hash, credential.iterations, createdAt, tokenHash, commitNow, commitNow),
    db.prepare(
      "UPDATE iaict_activation_invites AS i SET consumed_at=? WHERE token_hash=? " +
      "AND consumed_at IS NULL AND " + currentCredential,
    ).bind(commitNow, tokenHash, credential.salt, credential.hash, credential.iterations),
    db.prepare(
      "INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) " +
      "SELECT ?,i.user_id,'auth.activation.redeem','admin_users',i.user_id,'{}',? " +
      "FROM iaict_activation_invites i WHERE i.token_hash=? " +
      "AND i.consumed_at=? AND " + currentCredential,
    ).bind(crypto.randomUUID(), createdAt, tokenHash, commitNow,
      credential.salt, credential.hash, credential.iterations),
  ]);
  return Number(results[0]?.meta?.changes ?? 0) === 1 &&
    Number(results[1]?.meta?.changes ?? 0) === 1;
}
