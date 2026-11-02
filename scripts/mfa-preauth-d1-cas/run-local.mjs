#!/usr/bin/env node
/**
 * IAM-FUT-012 — disposable Miniflare D1 pre-MFA challenge CAS contract.
 *
 * SECURITY LIMITS: a synthetic challenge table and synthetic user table ONLY;
 * no real worker, migration, MFA factor, OTP check, cookie, session, audit,
 * encryption key, deployed D1 binding or remote Cloudflare request.
 * A successful CAS in this test NEVER issues or authorizes any session.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const NOW = 1_800_000_000_000; // synthetic clock, milliseconds
const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const USER = "synthetic-qa-user";
const OTHER = "synthetic-other-user";
const FP = "a".repeat(64); // synthetic credential fingerprint, never a password
const CHANGED_FP = "b".repeat(64);
const TOKEN = /^[a-f0-9]{64}$/;
const sha = value => createHash("sha256").update(value).digest("hex");
const checks = [];
const check = (id, ok) => {
  if (ok !== true) throw Error("CHECK_FAILED_" + id);
  checks.push(id);
};
const changed = result =>
  result?.success === true && Number.isInteger(result?.meta?.changes)
    ? result.meta.changes : -1;
const sql = `
  UPDATE synthetic_mfa_challenges
     SET consumed_at_ms=?, revision=revision+1
   WHERE challenge_hash=? AND user_id=? AND credential_fingerprint=?
     AND credential_revision=? AND purpose='LOGIN'
     AND security_revision>=0
     AND consumed_at_ms IS NULL AND revision>=0
     AND created_at_ms>=0 AND created_at_ms<=?
     AND expires_at_ms>? AND expires_at_ms>created_at_ms
     AND expires_at_ms-created_at_ms<=?
     AND failed_attempts BETWEEN 0 AND ?
     AND (locked_until_ms IS NULL OR locked_until_ms<=?)
     AND EXISTS (
       SELECT 1 FROM synthetic_mfa_users AS u
        WHERE u.user_id=synthetic_mfa_challenges.user_id
          AND u.is_active=1 AND u.has_active_role=1
          AND u.credential_fingerprint=synthetic_mfa_challenges.credential_fingerprint
          AND u.credential_revision=synthetic_mfa_challenges.credential_revision
          AND u.security_revision=synthetic_mfa_challenges.security_revision
     )
`;
let mf;
let stage = "START";
try {
  // The new random D1 UUID and absence of a persistence directory ensure
  // this is an ephemeral local test; no configured D1 binding is read.
  mf = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: "export default { fetch() { return new Response('synthetic'); } }",
    compatibilityDate: "2026-10-12",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: randomUUID() },
  }));
  const db = await mf.getD1Database("DB");
  stage = "SYNTHETIC_SCHEMA";
  await db.prepare(`
    CREATE TABLE synthetic_mfa_users(
      user_id TEXT PRIMARY KEY,
      is_active INTEGER NOT NULL CHECK(is_active IN (0,1)),
      has_active_role INTEGER NOT NULL CHECK(has_active_role IN (0,1)),
      credential_fingerprint TEXT NOT NULL,
      credential_revision INTEGER NOT NULL,
      security_revision INTEGER NOT NULL CHECK(security_revision>=0)
    )
  `).run();
  await db.prepare(`
    CREATE TABLE synthetic_mfa_challenges(
      challenge_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      credential_fingerprint TEXT NOT NULL,
      credential_revision INTEGER NOT NULL,
      security_revision INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL,
      expires_at_ms INTEGER NOT NULL,
      consumed_at_ms INTEGER,
      failed_attempts INTEGER NOT NULL,
      locked_until_ms INTEGER,
      revision INTEGER NOT NULL
    )
  `).run();
  check("DISPOSABLE_EMPTY_SCHEMA",
    (await db.prepare("SELECT COUNT(*) AS n FROM synthetic_mfa_challenges").first()).n === 0);
  let currentSecurityRevision = 1;
  for (const id of [USER, OTHER]) {
    await db.prepare(`
      INSERT INTO synthetic_mfa_users
        (user_id,is_active,has_active_role,credential_fingerprint,credential_revision,security_revision)
      VALUES(?,1,1,?,1,1)
    `).bind(id, FP).run();
  }
  const seed = async (overrides={}) => {
    const token = randomBytes(32).toString("hex");
    const data = {
      userId: USER, fingerprint: FP, credRevision: 1,
      securityRevision: currentSecurityRevision, purpose: "LOGIN",
      created: NOW - 1000, expires: NOW + TTL_MS - 1000,
      consumed: null, failed: 0, locked: null, revision: 0,
      ...overrides,
    };
    await db.prepare(`
      INSERT INTO synthetic_mfa_challenges
        (challenge_hash,user_id,credential_fingerprint,credential_revision,security_revision,
         purpose,created_at_ms,expires_at_ms,consumed_at_ms,
         failed_attempts,locked_until_ms,revision)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      sha(token), data.userId, data.fingerprint, data.credRevision,
      data.securityRevision, data.purpose, data.created, data.expires, data.consumed,
      data.failed, data.locked, data.revision,
    ).run();
    return token; // no token or digest is ever printed
  };
  const row = async token => db.prepare(`
    SELECT consumed_at_ms AS used, revision AS rev
    FROM synthetic_mfa_challenges WHERE challenge_hash=?
  `).bind(sha(token)).first();
  const consume = async (token, {
    userId=USER, fingerprint=FP, credRevision=1, now=NOW,
  }={}) => {
    if (typeof token !== "string" || !TOKEN.test(token) ||
        typeof userId !== "string" || !userId ||
        typeof fingerprint !== "string" || !TOKEN.test(fingerprint) ||
        !Number.isSafeInteger(credRevision) || credRevision < 0 ||
        !Number.isSafeInteger(now) || now < 0) return false;
    const outcome = await db.prepare(sql).bind(
      now, sha(token), userId, fingerprint, credRevision,
      now, now, TTL_MS, MAX_ATTEMPTS - 1, now,
    ).run();
    // SQL may succeed with zero changed rows: that is DENIED, never a session.
    return changed(outcome) === 1;
  };

  stage = "PARALLEL_ONE_TIME";
  const token = await seed();
  const outcomes = await Promise.all(Array.from({length:16}, () => consume(token)));
  check("PARALLEL_SAME_CHALLENGE_SINGLE_WINNER",
    outcomes.filter(Boolean).length === 1 &&
    (await row(token)).used === NOW && (await row(token)).rev === 1);
  check("REPLAY_DENIED", await consume(token) === false && (await row(token)).rev === 1);

  stage = "TIME_AND_BINDINGS";
  const expired = await seed({expires:NOW});
  check("EXPIRED_AT_BOUNDARY", await consume(expired) === false && (await row(expired)).rev === 0);
  const future = await seed({created:NOW+1,expires:NOW+TTL_MS});
  check("FUTURE_CHALLENGE_DENIED", await consume(future) === false);
  const overlong = await seed({created:NOW-1,expires:NOW+TTL_MS});
  check("OVERLONG_TTL_DENIED", await consume(overlong) === false);
  const otherUser = await seed();
  check("WRONG_OWNER_DENIED",
    await consume(otherUser,{userId:OTHER}) === false && (await row(otherUser)).rev === 0);
  const validButUnsent = await seed();
  const unmatchedToken = randomBytes(32).toString("hex");
  check("WRONG_TOKEN_HASH_DENIED",
    await consume(unmatchedToken) === false &&
    (await row(validButUnsent)).rev === 0);
  const wrongCred = await seed();
  check("CHALLENGE_CREDENTIAL_MISMATCH",
    await consume(wrongCred,{fingerprint:CHANGED_FP}) === false &&
    (await row(wrongCred)).rev === 0);

  stage = "CURRENT_SERVER_STATE";
  const changedPassword = await seed();
  await db.prepare(`
    UPDATE synthetic_mfa_users
    SET credential_fingerprint=?,credential_revision=credential_revision+1
    WHERE user_id=?
  `).bind(CHANGED_FP, USER).run();
  check("PASSWORD_ROTATION_DENIED",
    await consume(changedPassword) === false && (await row(changedPassword)).rev === 0);
  // Restore to a different revision: an old challenge cannot be revived even
  // if a user later selects a password yielding an earlier fingerprint.
  await db.prepare(`
    UPDATE synthetic_mfa_users
    SET credential_fingerprint=?,credential_revision=credential_revision+1
    WHERE user_id=?
  `).bind(FP, USER).run();
  check("PASSWORD_REVERSION_DENIED",
    await consume(changedPassword) === false && (await row(changedPassword)).rev === 0);
  const oldRevision = await seed();
  check("STALE_CREDENTIAL_REVISION_DENIED", await consume(oldRevision) === false);

  const fresh = await seed({credRevision:3});
  // Revocation events MUST invalidate issued challenges *permanently*.
  // Tests require a monotonic security revision, not only the current role bit.
  await db.prepare(`
    UPDATE synthetic_mfa_users
      SET has_active_role=0,security_revision=security_revision+1 WHERE user_id=?
  `).bind(USER).run();
  currentSecurityRevision += 1;
  check("ROLE_REVOKED_DENIED",
    await consume(fresh,{credRevision:3}) === false && (await row(fresh)).rev === 0);
  await db.prepare("UPDATE synthetic_mfa_users SET has_active_role=1 WHERE user_id=?")
    .bind(USER).run();
  check("ROLE_REGRANTED_OLD_CHALLENGE_STILL_DENIED",
    await consume(fresh,{credRevision:3}) === false && (await row(fresh)).rev === 0);

  const beforeDisable = await seed({credRevision:3});
  await db.prepare(`
    UPDATE synthetic_mfa_users
      SET is_active=0,security_revision=security_revision+1 WHERE user_id=?
  `).bind(USER).run();
  currentSecurityRevision += 1;
  check("ACCOUNT_DISABLED_DENIED",
    await consume(beforeDisable,{credRevision:3}) === false &&
    (await row(beforeDisable)).rev === 0);
  await db.prepare("UPDATE synthetic_mfa_users SET is_active=1 WHERE user_id=?")
    .bind(USER).run();
  check("ACCOUNT_REACTIVATED_OLD_CHALLENGE_STILL_DENIED",
    await consume(beforeDisable,{credRevision:3}) === false &&
    (await row(beforeDisable)).rev === 0);
  // Restore current account/role bits for test-only cases below. This DOES NOT
  // restore the older security revision and cannot revive pre-revocation tokens.

  stage = "NEGATIVE_STATES";
  const staleSecurityRevision = await seed({credRevision:3,securityRevision:1});
  check("STALE_SECURITY_REVISION_DENIED",
    await consume(staleSecurityRevision,{credRevision:3}) === false &&
    (await row(staleSecurityRevision)).rev === 0);
  const wrongPurpose = await seed({purpose:"RESET",credRevision:3});
  check("WRONG_PURPOSE_DENIED", await consume(wrongPurpose,{credRevision:3}) === false);
  const attempts = await seed({failed:MAX_ATTEMPTS,credRevision:3});
  check("EXHAUSTED_ATTEMPTS_DENIED", await consume(attempts,{credRevision:3}) === false);
  const corruptAttempts = await seed({failed:-1,credRevision:3});
  check("NEGATIVE_ATTEMPTS_DENIED", await consume(corruptAttempts,{credRevision:3}) === false);
  const locked = await seed({locked:NOW+1,credRevision:3});
  check("ACTIVE_LOCK_DENIED",
    await consume(locked,{credRevision:3}) === false && (await row(locked)).rev === 0);
  check("LOCK_UNTIL_EXACT_BOUNDARY",
    await consume(locked,{credRevision:3,now:NOW+1}) === true &&
    (await row(locked)).rev === 1);
  const alreadyUsed = await seed({consumed:NOW-1,credRevision:3});
  check("ALREADY_CONSUMED_DENIED", await consume(alreadyUsed,{credRevision:3}) === false);
  const malformed = await seed({credRevision:3});
  check("MALFORMED_CONTEXT_DENIED",
    await consume(malformed,{credRevision:-1}) === false &&
    await consume(malformed,{now:-1,credRevision:3}) === false &&
    await consume(malformed,{userId:"",credRevision:3}) === false &&
    await consume({}, {credRevision:3}) === false &&
    (await row(malformed)).rev === 0);
  check("FAIL_CLOSED_ON_MISSING_D1_METADATA",
    changed({success:true,meta:{}}) === -1 &&
    changed({success:false,meta:{changes:1}}) === -1);
  const valid = await seed({credRevision:3});
  check("FRESH_CHALLENGE_STILL_ACCEPTED",
    await consume(valid,{credRevision:3}) === true && (await row(valid)).rev === 1);
  const separate = await seed({userId:OTHER});
  check("INDEPENDENT_USER_ACCEPTED",
    await consume(separate,{userId:OTHER}) === true && (await row(separate)).rev === 1);
  const all = await db.prepare(`
    SELECT COUNT(*) AS n FROM synthetic_mfa_challenges WHERE consumed_at_ms>=?
  `).bind(NOW).first();
  check("ONLY_ELIGIBLE_CHALLENGES_CHANGED",
    all.n === 4); // original winner, expired lock, fresh, other user
  check("NO_SESSION_OR_FACTOR_TABLE_CREATED",
    (await db.prepare(`
      SELECT COUNT(*) AS n FROM sqlite_master
      WHERE type='table' AND name IN ('iaict_auth_sessions','iam_mfa_factors')
    `).first()).n === 0);

  console.log("[mfa-preauth-d1-cas] OBSERVED " + JSON.stringify({
    case_id:"IAM-FUT-012",environment:"LOCAL_MINIFLARE_D1",
    assertion_groups:checks.length,checks,
    parallel_attempts:outcomes.length,
    same_challenge_accepted:outcomes.filter(Boolean).length,
    synthetic_only:true,real_otp_verified:false,session_issued:false,
    real_d1_migration:false,cloudflare_deployed:false,verdict:"PASS",
  }));
} catch (e) {
  console.error("[mfa-preauth-d1-cas] FAIL " + JSON.stringify({
    stage,
    reason:e instanceof Error && /^CHECK_FAILED_[A-Z_]+$/.test(e.message)
      ? e.message : "ISOLATED_TEST_FAILURE",
  }));
  process.exitCode=1;
} finally {
  if (mf) await mf.dispose();
}
