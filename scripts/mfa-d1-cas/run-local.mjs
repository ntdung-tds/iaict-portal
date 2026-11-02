#!/usr/bin/env node
/**
 * IAM-FUT-010 — isolated Miniflare D1 CAS proof, NOT an MFA implementation.
 *
 * This tests the SQL atomicity contract proposed by ADR-0002, with a MINIMAL
 * synthetic factor table. It does not implement a Worker MFA route, OTP code
 * verification, a session, or a migration. Never points to a real D1 database.
 */
import { randomUUID } from "node:crypto";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const SQL = `
  UPDATE iam_mfa_factors
  SET last_accepted_counter=?, revision=revision+1
  WHERE factor_id=? AND user_id=? AND status='ACTIVE'
    AND (locked_until IS NULL OR locked_until<=?)
    AND (last_accepted_counter IS NULL OR last_accepted_counter<?)
`;
const testUser = "synthetic-qa-user-a";
const testFactor = "synthetic-qa-factor-a";
const NOW = 1_800_000_000_000; // synthetic millisecond time, not wall-clock
const checks = [];
const check = (id, condition) => {
  if (!condition) throw Error("CHECK_FAILED_" + id);
  checks.push(id);
};
const resultChanges = result => result?.success === true &&
  Number.isInteger(result?.meta?.changes) ? result.meta.changes : -1;

let mf;
let stage = "BOOT";
try {
  // Brand-new randomized D1 ID; never uses configured Cloudflare D1 bindings.
  // No persistence option or remote execution: Miniflare's in-memory D1 only.
  // Pinned Miniflare 5 exposes a supported v4-to-v5 options adapter,
  // avoiding direct use of obsolete Worker option fields. No persistence or
  // remote binding: this database exists only in a temporary local test.
  mf = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: "export default { fetch() { return new Response('synthetic only'); } };",
    compatibilityDate: "2026-10-12",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: randomUUID() },
  }));
  stage = "GET_LOCAL_D1";
  const db = await mf.getD1Database("DB");
  stage = "CREATE_SYNTHETIC_SCHEMA";
  await db.prepare(`
    CREATE TABLE iam_mfa_factors (
      factor_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING','ACTIVE','DISABLED')),
      last_accepted_counter INTEGER,
      locked_until INTEGER,
      revision INTEGER NOT NULL DEFAULT 0,
      CHECK(last_accepted_counter IS NULL OR last_accepted_counter>=0)
    )
  `).run();
  // Minimal ephemeral schema is intentionally NOT the full proposed migration.
  check("FRESH_ISOLATED_DB", (await db.prepare(
    "SELECT COUNT(*) AS c FROM iam_mfa_factors").first()).c === 0);
  await db.prepare(
    "INSERT INTO iam_mfa_factors(factor_id,user_id,status) VALUES(?,?,'ACTIVE')"
  ).bind(testFactor, testUser).run();
  const row = async factorId => await db.prepare(
    "SELECT last_accepted_counter AS last, revision, status, locked_until AS locked FROM iam_mfa_factors WHERE factor_id=?"
  ).bind(factorId).first();
  const tryConsume = async (counter, user=testUser, factor=testFactor, now=NOW) => {
    if (!Number.isSafeInteger(counter) || counter < 0 ||
        !Number.isSafeInteger(now) || now < 0) return false;
    const result = await db.prepare(SQL).bind(counter, factor, user, now, counter).run();
    // D1 success is NOT enough; only one changed row grants consumption.
    return resultChanges(result) === 1;
  };

  // Parallel operations race on the *same local D1 database*, not a JS lock.
  stage = "PARALLEL_CAS";
  const racing = await Promise.all(
    Array.from({length:16}, () => tryConsume(700))
  );
  stage = "ASSERT_CONCURRENT_ROW";
  const afterRace = await row(testFactor);
  check("PARALLEL_SAME_COUNTER_SINGLE_WINNER",
    racing.filter(Boolean).length === 1 && afterRace.last === 700 &&
    afterRace.revision === 1);
  stage = "SEQUENTIAL_NEGATIVE_CASES";
  check("REPLAY_SAME_COUNTER_DENIED",
    await tryConsume(700) === false && (await row(testFactor)).revision === 1);
  check("EARLIER_COUNTER_DENIED",
    await tryConsume(699) === false && (await row(testFactor)).last === 700);
  check("NEXT_COUNTER_ACCEPTED",
    await tryConsume(701) === true && (await row(testFactor)).revision === 2);
  check("COUNTER_MUST_BE_MONOTONIC",
    await tryConsume(703) === true && await tryConsume(702) === false &&
    (await row(testFactor)).last === 703 && (await row(testFactor)).revision === 3);
  check("OWNER_AND_FACTOR_SCOPE",
    await tryConsume(704, "synthetic-qa-user-other") === false &&
    await tryConsume(704, testUser, "synthetic-qa-factor-other") === false &&
    (await row(testFactor)).last === 703);

  // Both factor states and lockouts must block consume even on a new step.
  await db.prepare("UPDATE iam_mfa_factors SET status='PENDING' WHERE factor_id=?")
    .bind(testFactor).run();
  check("PENDING_BLOCKED",
    await tryConsume(704) === false && (await row(testFactor)).revision === 3);
  await db.prepare("UPDATE iam_mfa_factors SET status='DISABLED' WHERE factor_id=?")
    .bind(testFactor).run();
  check("DISABLED_BLOCKED",
    await tryConsume(704) === false && (await row(testFactor)).revision === 3);
  await db.prepare(
    "UPDATE iam_mfa_factors SET status='ACTIVE', locked_until=? WHERE factor_id=?"
  ).bind(NOW + 60_000, testFactor).run();
  check("LOCKED_FACTOR_BLOCKED",
    await tryConsume(704) === false && (await row(testFactor)).last === 703);
  check("EXPIRED_LOCK_ACCEPTED",
    await tryConsume(704, testUser, testFactor, NOW + 60_000) === true &&
    (await row(testFactor)).last === 704);
  check("INVALID_COUNTER_DENIED",
    await tryConsume(-1) === false &&
    await tryConsume(Number.MAX_SAFE_INTEGER+1) === false &&
    (await row(testFactor)).last === 704);
  // Separate factors must not share the first factor's replay state.
  await db.prepare(
    "INSERT INTO iam_mfa_factors(factor_id,user_id,status) VALUES(?,?,'ACTIVE')"
  ).bind("synthetic-qa-factor-b", testUser).run();
  check("SEPARATE_FACTOR_STATE",
    await tryConsume(700, testUser, "synthetic-qa-factor-b") === true &&
    (await row("synthetic-qa-factor-b")).last === 700 &&
    (await row(testFactor)).last === 704);

  const meta = await db.prepare(
    "UPDATE iam_mfa_factors SET revision=revision WHERE factor_id=? AND user_id=?"
  ).bind("missing-factor", testUser).run();
  check("D1_CHANGES_ZERO_NOT_SUCCESS", resultChanges(meta) === 0);
  check("FAIL_CLOSED_MISSING_METADATA", resultChanges({success:true, meta:{}}) === -1);

  console.log("[mfa-d1-cas] OBSERVED " + JSON.stringify({
    test_id:"IAM-FUT-010", environment:"LOCAL_MINIFLARE_D1",
    d1_engine:"SQLite via Miniflare workerd",
    check_count:checks.length, checks, parallel_attempts:racing.length,
    concurrent_success_count:racing.filter(Boolean).length,
    local_only:true, uses_real_otp:false, factors_deployed:false,
    production_modified:false, d1_remote_used:false,
    real_sessions_issued:false,
    verdict:"PASS",
  }));
} catch (error) {
  // Do not echo database internals or input data in CI logs.
  // Synthetic-only DB/inputs. Emit bounded error type and stage for diagnosis,
  // never a raw stack trace, arbitrary SQL result or stored values.
  const safeName = error instanceof Error ? error.name.replace(/[^A-Za-z]/g, "").slice(0,40) : "UNKNOWN";
  const safeMessage = error instanceof Error ?
    error.message.replace(/[^A-Za-z0-9 _.:,-]/g, "").slice(0,180) : "UNKNOWN";
  console.error("[mfa-d1-cas] FAIL " + JSON.stringify({
    stage, type:safeName, reason:safeMessage,
  }));
  process.exitCode = 1;
} finally {
  if (mf) await mf.dispose();
}
