/**
 * Future native MFA first-factor challenge and session-assurance primitives.
 *
 * ISOLATED FOUNDATION ONLY: no route imports this module, no D1 schema or
 * Worker binding is provisioned, and no real MFA flow is enforced yet.
 *
 * Security boundary:
 * - A successful password check must NEVER issue a full admin session for
 *   an account whose server-derived effective policy requires MFA.
 * - A pending challenge is NOT a session and may NEVER authorize an admin API.
 * - Eligibility here is not redemption: final code MUST atomically consume
 *   a challenge, advance the TOTP counter and issue the full session in D1.
 */
export const NATIVE_MFA_PENDING_COOKIE = "__Host-iaict_mfa_pending";
export const NATIVE_MFA_PENDING_TTL_MS = 5 * 60 * 1000;
export const NATIVE_MFA_MAX_CHALLENGE_FAILURES = 5;

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
const TOKEN_RE = /^[0-9a-f]{64}$/;
const HASH_RE = /^[0-9a-f]{64}$/;
// TypeScript annotations do not validate data materialized from D1/JSON.
const validToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_RE.test(value);
const validHash = (value: unknown): value is string =>
  typeof value === "string" && HASH_RE.test(value);

export type PendingMfaChallengeRecord = Readonly<{
  tokenHash: string;
  userId: string;
  credentialFingerprint: string;
  purpose: "LOGIN";
  createdAtMs: number;
  expiresAtMs: number;
  consumedAtMs: number | null;
  failedAttempts: number;
  lockedUntilMs: number | null;
  revision: number;
}>;

export type PendingMfaChallengeIssue = Readonly<{
  // Sensitive one-time bearer value; never persist or log it.
  token: string;
  record: PendingMfaChallengeRecord;
}>;

function safeTime(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function safeUserId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128 &&
    !/[\u0000-\u001f\u007f]/.test(value);
}
async function digestToken(value: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}
function equalHash(a: string, b: string): boolean {
  if (!validHash(a) || !validHash(b)) return false;
  let delta = 0;
  for (let i = 0; i < 64; i++) delta |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return delta === 0;
}

/**
 * Generates a 256-bit challenge token. Only record.tokenHash belongs in D1.
 * Call ONLY after server-verified first factor and account status checks.
 * The caller must safely persist the record before returning any cookie.
 */
export async function issuePendingMfaChallenge(
  userId: string, credentialFingerprint: string, nowMs: number,
): Promise<PendingMfaChallengeIssue> {
  if (!safeUserId(userId) || !validHash(credentialFingerprint) ||
      !safeTime(nowMs) || !safeTime(nowMs + NATIVE_MFA_PENDING_TTL_MS))
    throw new Error("INVALID_PRE_MFA_CHALLENGE_CONTEXT");

  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await digestToken(token);
  return {
    token,
    record: {
      tokenHash, userId, credentialFingerprint, purpose: "LOGIN",
      createdAtMs: nowMs, expiresAtMs: nowMs + NATIVE_MFA_PENDING_TTL_MS,
      consumedAtMs: null, failedAttempts: 0, lockedUntilMs: null, revision: 0,
    },
  };
}

/** Separate cookie namespace from __Host-iaict_session; never use for admin auth. */
export function cookieForPendingMfaChallenge(token: string): string {
  if (!validToken(token)) throw new Error("INVALID_PRE_MFA_TOKEN");
  return NATIVE_MFA_PENDING_COOKIE + "=" + token +
    "; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=Lax";
}
export const clearPendingMfaCookie = NATIVE_MFA_PENDING_COOKIE +
  "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";

/** Reject duplicate/ambiguous Cookie entries instead of choosing one. */
export function pendingMfaTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  const values = header.split(";").map(part => part.trim())
    .filter(part => part.startsWith(NATIVE_MFA_PENDING_COOKIE + "="));
  if (values.length !== 1) return null;
  const token = values[0].slice(NATIVE_MFA_PENDING_COOKIE.length + 1);
  return validToken(token) ? token : null;
}

/**
 * A read-only filter for a potential CAS attempt. Returning true NEVER
 * authenticates anyone; the caller must still verify OTP and transactionally
 * consume challenge + counter before minting the full session.
 *
 * userId and currentCredentialFingerprint must come from trusted D1 reads,
 * not from the browser request.
 */
export async function pendingChallengeEligibleForCas(
  token: string,
  row: PendingMfaChallengeRecord | null,
  current: {
    userId: string;
    credentialFingerprint: string;
    accountActive: boolean;
    hasActiveRole: boolean;
    nowMs: number;
  },
): Promise<boolean> {
  if (!validToken(token) || !row || !current ||
      !safeTime(current.nowMs) ||
      !safeUserId(current.userId) ||
      !validHash(current.credentialFingerprint) ||
      row.purpose !== "LOGIN" || row.userId !== current.userId ||
      // Require exact booleans: "false", 1 and other truthy D1/JSON
      // representations are NOT trusted. Adapt D1 0/1 explicitly upstream.
      current.accountActive !== true || current.hasActiveRole !== true ||
      !safeTime(row.createdAtMs) || !safeTime(row.expiresAtMs) ||
      row.expiresAtMs <= row.createdAtMs ||
      row.expiresAtMs - row.createdAtMs > NATIVE_MFA_PENDING_TTL_MS ||
      current.nowMs < row.createdAtMs || current.nowMs >= row.expiresAtMs ||
      row.consumedAtMs !== null ||
      !Number.isSafeInteger(row.failedAttempts) || row.failedAttempts < 0 ||
      row.failedAttempts >= NATIVE_MFA_MAX_CHALLENGE_FAILURES ||
      (row.lockedUntilMs !== null &&
        (!safeTime(row.lockedUntilMs) || row.lockedUntilMs > current.nowMs)) ||
      !Number.isSafeInteger(row.revision) || row.revision < 0 ||
      !equalHash(row.credentialFingerprint, current.credentialFingerprint))
    return false;

  return equalHash(await digestToken(token), row.tokenHash);
}

export type NativeSessionAssurance = "password" | "mfa";
export type NativeMfaPolicy = "PASSWORD_ONLY" | "MFA_REQUIRED";
export type NativeSessionCheck = Readonly<{
  // The caller MUST derive effectivePolicy from trusted server-side account
  // and current-role state. Unknown/missing policy fails closed.
  effectivePolicy: NativeMfaPolicy | null;
  accountActive: boolean;
  hasActiveRole: boolean;
  authLevel: NativeSessionAssurance | null;
  createdAtMs: number;
  expiresAtMs: number;
  revokedAtMs: number | null;
  mfaVerifiedAtMs: number | null;
  nowMs: number;
}>;

/**
 * A separate server-side assurance predicate for future session readers.
 * Password-only/legacy sessions remain valid ONLY under explicitly approved
 * PASSWORD_ONLY policy, never when MFA_REQUIRED. No browser flag is accepted.
 * No current route/Worker calls this function yet.
 */
export function nativeSessionMeetsAssurance(check: NativeSessionCheck): boolean {
  if (!check || check.accountActive !== true || check.hasActiveRole !== true ||
      !safeTime(check.createdAtMs) || !safeTime(check.expiresAtMs) ||
      !safeTime(check.nowMs) || check.expiresAtMs <= check.createdAtMs ||
      check.createdAtMs > check.nowMs || check.expiresAtMs <= check.nowMs ||
      check.revokedAtMs !== null ||
      (check.effectivePolicy !== "PASSWORD_ONLY" &&
       check.effectivePolicy !== "MFA_REQUIRED"))
    return false;
  if (check.effectivePolicy === "PASSWORD_ONLY")
    return check.authLevel === null ||
      check.authLevel === "password" ||
      (check.authLevel === "mfa" &&
       safeTime(check.mfaVerifiedAtMs) &&
       check.mfaVerifiedAtMs >= check.createdAtMs &&
       check.mfaVerifiedAtMs <= check.nowMs);
  return check.authLevel === "mfa" &&
    safeTime(check.mfaVerifiedAtMs) &&
    check.mfaVerifiedAtMs >= check.createdAtMs &&
    check.mfaVerifiedAtMs <= check.nowMs;
}
