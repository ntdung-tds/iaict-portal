import { describe, expect, it } from "vitest";
import {
  NATIVE_MFA_MAX_CHALLENGE_FAILURES,
  NATIVE_MFA_PENDING_COOKIE,
  NATIVE_MFA_PENDING_TTL_MS,
  clearPendingMfaCookie,
  cookieForPendingMfaChallenge,
  issuePendingMfaChallenge,
  nativeSessionMeetsAssurance,
  pendingChallengeEligibleForCas,
  pendingMfaTokenFromRequest,
  type NativeSessionCheck,
  type PendingMfaChallengeRecord,
} from "./native-mfa-preauth";

const NOW = 1_800_000_000_000;
const USER = "synthetic-user-1";
const FINGERPRINT = "a".repeat(64);
const trustedCurrent = {
  userId: USER, credentialFingerprint: FINGERPRINT,
  accountActive: true, hasActiveRole: true, nowMs: NOW,
};
const replaceRecord = (r: PendingMfaChallengeRecord, patch: Partial<PendingMfaChallengeRecord>) =>
  ({ ...r, ...patch });

describe("IAM-FUT-011 isolated pre-MFA challenge issuance", () => {
  it("issues a random 256-bit opaque token but stores only its digest in record", async () => {
    const a = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    const b = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    expect(a.token).toMatch(/^[a-f0-9]{64}$/);
    expect(a.token).not.toBe(b.token);
    expect(a.record.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(a.record.tokenHash).not.toBe(a.token);
    expect(a.record.tokenHash).not.toBe(b.record.tokenHash);
    expect(JSON.stringify(a.record)).not.toContain(a.token);
    expect(a.record).toMatchObject({
      userId: USER, credentialFingerprint: FINGERPRINT, purpose: "LOGIN",
      createdAtMs: NOW, expiresAtMs: NOW + NATIVE_MFA_PENDING_TTL_MS,
      failedAttempts: 0, consumedAtMs: null, lockedUntilMs: null, revision: 0,
    });
  });

  it("rejects invalid user, credential binding, unsafe timestamp, or overflow", async () => {
    for (const userId of ["", "a".repeat(129), "bad\nuser"]) {
      await expect(issuePendingMfaChallenge(userId, FINGERPRINT, NOW))
        .rejects.toThrow("INVALID_PRE_MFA_CHALLENGE_CONTEXT");
    }
    for (const digest of ["", "A".repeat(64), "0".repeat(63), "x".repeat(64)]) {
      await expect(issuePendingMfaChallenge(USER, digest, NOW))
        .rejects.toThrow("INVALID_PRE_MFA_CHALLENGE_CONTEXT");
    }
    for (const t of [-1, NaN, 1.5, Number.MAX_SAFE_INTEGER, Infinity]) {
      await expect(issuePendingMfaChallenge(USER, FINGERPRINT, t))
        .rejects.toThrow("INVALID_PRE_MFA_CHALLENGE_CONTEXT");
    }
  });

  it("keeps pending and privileged cookies distinct, HttpOnly, Secure, same-site", async () => {
    const { token } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    const header = cookieForPendingMfaChallenge(token);
    expect(header.startsWith(NATIVE_MFA_PENDING_COOKIE + "=")).toBe(true);
    expect(header).not.toContain("__Host-iaict_session=");
    for (const part of ["Path=/", "Max-Age=300", "HttpOnly", "Secure", "SameSite=Lax"])
      expect(header).toContain(part);
    expect(clearPendingMfaCookie).toContain("Max-Age=0");
    expect(clearPendingMfaCookie).toContain("HttpOnly");
    expect(() => cookieForPendingMfaChallenge("abc")).toThrow("INVALID_PRE_MFA_TOKEN");
  });

  it("reads only a single well-formed pending cookie, not a full session cookie or user header", async () => {
    const { token } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    const make = (cookie: string, extra: HeadersInit = {}) =>
      new Request("https://staging.invalid/admin", {
        headers: { Cookie: cookie, "X-IAICT-Verified-Email": "attacker@invalid.test", ...extra },
      });
    expect(pendingMfaTokenFromRequest(make(NATIVE_MFA_PENDING_COOKIE + "=" + token))).toBe(token);
    expect(pendingMfaTokenFromRequest(make(
      "__Host-iaict_session=" + "b".repeat(64)))).toBeNull();
    expect(pendingMfaTokenFromRequest(make(
      NATIVE_MFA_PENDING_COOKIE + "=" + token + "; " + NATIVE_MFA_PENDING_COOKIE + "=" + token
    ))).toBeNull();
    expect(pendingMfaTokenFromRequest(make(NATIVE_MFA_PENDING_COOKIE + "=invalid"))).toBeNull();
    expect(pendingMfaTokenFromRequest(make(
      "x" + NATIVE_MFA_PENDING_COOKIE + "=" + token))).toBeNull();
    expect(pendingMfaTokenFromRequest(new Request("https://staging.invalid/admin"))).toBeNull();
  });
});

describe("IAM-FUT-011 read-only challenge eligibility (never grants a session)", () => {
  it("accepts only a matching fresh synthetic candidate for future CAS", async () => {
    const { token, record } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    expect(await pendingChallengeEligibleForCas(token, record, trustedCurrent)).toBe(true);
    // Eligibility is repeatable; it is NOT atomic consumption or authorization.
    expect(await pendingChallengeEligibleForCas(token, record, trustedCurrent)).toBe(true);
  });

  it("rejects a wrong token, bad digest, mismatched owner and changed credential", async () => {
    const { token, record } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    const { token: otherToken } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    expect(await pendingChallengeEligibleForCas(otherToken, record, trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas("not-64-hex", record, trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { tokenHash: "x".repeat(64) }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, userId: "other-user" })).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, credentialFingerprint: "b".repeat(64) })).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, credentialFingerprint: "bad" })).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, null, trustedCurrent)).toBe(false);
  });

  it("blocks expiry exactly on boundary, future challenge, and overlong lifetime", async () => {
    const { token, record } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, nowMs: NOW + NATIVE_MFA_PENDING_TTL_MS - 1 })).toBe(true);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, nowMs: NOW + NATIVE_MFA_PENDING_TTL_MS })).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, nowMs: NOW - 1 })).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { expiresAtMs: NOW + 2 * NATIVE_MFA_PENDING_TTL_MS }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { expiresAtMs: NOW }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, nowMs: Infinity })).toBe(false);
  });

  it("blocks disabled/no-role user, consumed challenge, wrong purpose or exhausted attempts", async () => {
    const { token, record } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, accountActive: false })).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, record, { ...trustedCurrent, hasActiveRole: false })).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { consumedAtMs: NOW }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { purpose: "RESET" as "LOGIN" }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { failedAttempts: NATIVE_MFA_MAX_CHALLENGE_FAILURES }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { failedAttempts: -1 }), trustedCurrent)).toBe(false);
  });

  it("blocks locked attempts and malformed D1 revision; lock expiry alone does not grant a session", async () => {
    const { token, record } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { lockedUntilMs: NOW + 1 }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { lockedUntilMs: NOW }), trustedCurrent)).toBe(true);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { lockedUntilMs: -1 }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { revision: -1 }), trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, replaceRecord(record, { revision: 1.5 }), trustedCurrent)).toBe(false);
  });
});

const baseSession: NativeSessionCheck = {
  effectivePolicy: "MFA_REQUIRED", accountActive: true, hasActiveRole: true,
  authLevel: "mfa", createdAtMs: NOW - 60_000, expiresAtMs: NOW + 3600_000,
  revokedAtMs: null, mfaVerifiedAtMs: NOW - 30_000, nowMs: NOW,
};

describe("IAM-FUT-011 server-assurance predicate for future native session readers", () => {
  it("accepts a valid MFA-assured session under required policy", () => {
    expect(nativeSessionMeetsAssurance(baseSession)).toBe(true);
  });
  it("rejects old sessions and password-only sessions when policy requires MFA", () => {
    expect(nativeSessionMeetsAssurance({ ...baseSession, authLevel: null, mfaVerifiedAtMs: null })).toBe(false);
    expect(nativeSessionMeetsAssurance({ ...baseSession, authLevel: "password" })).toBe(false);
    expect(nativeSessionMeetsAssurance({ ...baseSession, authLevel: "mfa", mfaVerifiedAtMs: null })).toBe(false);
  });
  it("fails closed when server policy is unknown, absent or malformed", () => {
    for (const effectivePolicy of [null, undefined, "DISABLED_FROM_BROWSER", "UNKNOWN"]) {
      expect(nativeSessionMeetsAssurance({
        ...baseSession, effectivePolicy: effectivePolicy as NativeSessionCheck["effectivePolicy"],
      })).toBe(false);
    }
  });
  it("permits legacy/password session ONLY under an explicit PASSWORD_ONLY policy", () => {
    expect(nativeSessionMeetsAssurance({ ...baseSession, effectivePolicy: "PASSWORD_ONLY", authLevel: null, mfaVerifiedAtMs: null })).toBe(true);
    expect(nativeSessionMeetsAssurance({ ...baseSession, effectivePolicy: "PASSWORD_ONLY", authLevel: "password", mfaVerifiedAtMs: null })).toBe(true);
    expect(nativeSessionMeetsAssurance({ ...baseSession, effectivePolicy: "PASSWORD_ONLY" })).toBe(true);
    expect(nativeSessionMeetsAssurance({ ...baseSession, effectivePolicy: "PASSWORD_ONLY", authLevel: "unexpected" as "mfa" })).toBe(false);
  });
  it("denies disabled, roleless, revoked, expired and not-yet-created sessions", () => {
    for (const p of [
      { accountActive: false }, { hasActiveRole: false }, { revokedAtMs: NOW },
      { expiresAtMs: NOW }, { expiresAtMs: NOW - 1 },
      { createdAtMs: NOW + 1 }, { createdAtMs: -1 },
      { createdAtMs: NOW + 1, expiresAtMs: NOW + 2 },
    ]) {
      expect(nativeSessionMeetsAssurance({ ...baseSession, ...p })).toBe(false);
    }
  });
  it("denies absent, forged/invalid and impossible MFA verification timestamps", () => {
    for (const mfaVerifiedAtMs of [null, -1, NOW + 1, NOW - 120_000, Infinity, 1.5]) {
      expect(nativeSessionMeetsAssurance({ ...baseSession, mfaVerifiedAtMs })).toBe(false);
    }
  });
  it("requires a real server-side assurance level; pending cookie alone is never a session", async () => {
    const { token } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    expect(cookieForPendingMfaChallenge(token)).toContain(NATIVE_MFA_PENDING_COOKIE);
    expect(nativeSessionMeetsAssurance({ ...baseSession, authLevel: "pending" as "mfa" })).toBe(false);
    expect(nativeSessionMeetsAssurance({ ...baseSession, authLevel: null, mfaVerifiedAtMs: null })).toBe(false);
  });
});


describe("IAM-FUT-011 adversarial runtime type handling (review pass 2)", () => {
  it("rejects truthy strings, objects and numeric D1 flags for challenge account and roles", async () => {
    const { token, record } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    for (const invalid of ["false", "true", 1, 0, new Boolean(false), undefined, null]) {
      expect(await pendingChallengeEligibleForCas(token, record, {
        ...trustedCurrent, accountActive: invalid as unknown as boolean,
      })).toBe(false);
      expect(await pendingChallengeEligibleForCas(token, record, {
        ...trustedCurrent, hasActiveRole: invalid as unknown as boolean,
      })).toBe(false);
    }
    // D1 integer booleans must be explicitly normalized at the trusted caller.
    expect(await pendingChallengeEligibleForCas(token, record, {
      ...trustedCurrent, accountActive: (1 === Number(1)), hasActiveRole: true,
    })).toBe(true);
  });

  it("rejects non-boolean flags for privileged session assurance, even under password-only policy", () => {
    for (const invalid of ["false", "true", 1, 0, new Boolean(false), undefined, null]) {
      for (const effectivePolicy of ["MFA_REQUIRED", "PASSWORD_ONLY"] as const) {
        expect(nativeSessionMeetsAssurance({
          ...baseSession, effectivePolicy, accountActive: invalid as unknown as boolean,
        })).toBe(false);
        expect(nativeSessionMeetsAssurance({
          ...baseSession, effectivePolicy, hasActiveRole: invalid as unknown as boolean,
        })).toBe(false);
      }
    }
    expect(nativeSessionMeetsAssurance(baseSession)).toBe(true);
  });

  it("rejects non-string tokens and cookie objects rather than coercing them", async () => {
    const { token, record } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    for (const value of [new String(token), { toString: () => token }, null, 1]) {
      expect(await pendingChallengeEligibleForCas(
        value as unknown as string, record, trustedCurrent,
      )).toBe(false);
      expect(() => cookieForPendingMfaChallenge(value as unknown as string)).toThrow("INVALID_PRE_MFA_TOKEN");
    }
  });

  it("rejects object-like hash and credential fields without throwing on malformed database data", async () => {
    const { token, record } = await issuePendingMfaChallenge(USER, FINGERPRINT, NOW);
    const disguisedHash = { toString: () => FINGERPRINT } as unknown as string;
    const disguisedTokenHash = { toString: () => record.tokenHash } as unknown as string;
    await expect(issuePendingMfaChallenge(USER, disguisedHash, NOW))
      .rejects.toThrow("INVALID_PRE_MFA_CHALLENGE_CONTEXT");
    expect(await pendingChallengeEligibleForCas(token, record, {
      ...trustedCurrent, credentialFingerprint: disguisedHash,
    })).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, {
      ...record, credentialFingerprint: disguisedHash,
    }, trustedCurrent)).toBe(false);
    expect(await pendingChallengeEligibleForCas(token, {
      ...record, tokenHash: disguisedTokenHash,
    }, trustedCurrent)).toBe(false);
  });
});
