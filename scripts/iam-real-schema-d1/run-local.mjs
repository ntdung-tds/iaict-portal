#!/usr/bin/env node
/**
 * IAM-FUT-014 — local disposable D1, actual IAM migration baseline + test-only
 * security-epoch, policy, factor and assurance extensions. Not a deployable
 * schema, authenticated login, hosted migration, or MFA verification.
 * The pre-verified password/OTP inputs are SYNTHETIC; proof concerns D1 CAS.
 */
import { readFile } from "node:fs/promises";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const NOW = 1_800_000_000_000;
const USER = "qa-local-primary", OTHER = "qa-local-other", ROLE = "qa-local-editor";
const CRED = "synthetic-credential-fingerprint-v1", CRED2 = "synthetic-credential-fingerprint-v2";
const sha = value => createHash("sha256").update(value).digest("hex");
const checks = [];
const assert = (id, condition) => {
  if (condition !== true) throw Error("CHECK_FAILED_" + id);
  checks.push(id);
};
const changed = result => result?.success === true &&
  Number.isInteger(result?.meta?.changes) ? result.meta.changes : -1;
const GUARD = "INSERT INTO qa_one_change_guard(observed) VALUES(changes())";
const TABLES = ["admin_users", "roles", "admin_user_roles", "audit_logs",
  "iaict_auth_sessions", "iaict_login_attempts",
  "iaict_password_credentials_v2", "iaict_activation_invites"];

let mf, stage = "BOOT";
try {
  // Random binding, no persistent directory, no environment secrets, no remote D1.
  mf = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: "export default {fetch(){return new Response('qa-only')}}",
    compatibilityDate: "2026-10-12", compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: randomUUID() },
  }));
  const db = await mf.getD1Database("DB");
  stage = "APPLY_UNMODIFIED_MIGRATIONS";
  for (const name of [
    "0001_core.sql", "0022_iaict_native_auth.sql",
    "0023_iaict_auth_pbkdf2_workers.sql", "0024_iaict_activation_invites.sql",
  ]) {
    const original = await readFile(new URL("../../cloudflare/migrations/" + name, import.meta.url), "utf8");
    // Miniflare D1 exec() parses line-by-line; multi-line CREATE statements
    // must instead be issued as individual complete SQL statements. The actual
    // migration source remains byte-for-byte unchanged on disk.
    const statements = original.split(/;\s*(?:\r?\n|$)/).map(s => s.trim()).filter(Boolean);
    for (const statement of statements) await db.prepare(statement).run();
  }
  const hasTable = async name => !!await db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).bind(name).first();
  assert("ALL_EIGHT_REAL_BASELINE_TABLES", (await Promise.all(TABLES.map(hasTable))).every(Boolean));
  const realSessionColumns = (await db.prepare("PRAGMA table_info(iaict_auth_sessions)").all()).results.map(x => x.name);
  assert("REAL_SESSION_BASELINE_HAS_NO_MFA_ASSURANCE", !realSessionColumns.includes("auth_level") &&
    ["token_hash","user_id","created_at","expires_at","revoked_at"].every(x=>realSessionColumns.includes(x)));
  const realCredColumns = (await db.prepare("PRAGMA table_info(iaict_password_credentials_v2)").all()).results.map(x => x.name);
  assert("REAL_WORKERS_CREDENTIAL_BASELINE_NO_EPOCH", realCredColumns.includes("password_hash") &&
    !realCredColumns.includes("credential_revision"));

  stage = "LOCAL_ONLY_PROPOSED_EXTENSIONS";
  for (const ddl of [
    "CREATE TABLE qa_security_state(user_id TEXT PRIMARY KEY REFERENCES admin_users(id),security_revision INTEGER NOT NULL CHECK(security_revision>=0),credential_revision INTEGER NOT NULL CHECK(credential_revision>=0),policy_version INTEGER NOT NULL CHECK(policy_version>=0),policy TEXT NOT NULL CHECK(policy IN('PASSWORD_ONLY','MFA_REQUIRED')))",
    "CREATE TABLE qa_factors(user_id TEXT PRIMARY KEY REFERENCES admin_users(id),status TEXT NOT NULL CHECK(status IN('ACTIVE','DISABLED')),secret_version INTEGER NOT NULL CHECK(secret_version>0))",
    "CREATE TABLE qa_challenges(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES admin_users(id),security_revision INTEGER NOT NULL,credential_revision INTEGER NOT NULL,policy_version INTEGER NOT NULL,factor_version INTEGER NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,consumed_at INTEGER)",
    "CREATE TABLE qa_one_change_guard(observed INTEGER NOT NULL CHECK(observed=1))",
    "ALTER TABLE iaict_auth_sessions ADD COLUMN auth_level TEXT CHECK(auth_level IN('password','mfa'))",
    "ALTER TABLE iaict_auth_sessions ADD COLUMN mfa_verified_at INTEGER",
    "ALTER TABLE iaict_auth_sessions ADD COLUMN security_revision_at_issue INTEGER",
    "ALTER TABLE iaict_auth_sessions ADD COLUMN policy_version_at_issue INTEGER",
  ]) await db.prepare(ddl).run();
  assert("EXTENSIONS_ONLY_INSIDE_RANDOM_LOCAL_D1", await hasTable("qa_security_state") &&
    (await db.prepare("PRAGMA table_info(iaict_auth_sessions)").all()).results.some(x=>x.name==="auth_level"));

  stage = "SEED_SYNTHETIC_ACCOUNTS";
  for (const id of [USER, OTHER]) {
    await db.prepare("INSERT INTO admin_users(id,email,is_active,created_at,updated_at) VALUES(?,?,1,'qa','qa')")
      .bind(id,id+"@example.test").run();
    await db.prepare("INSERT INTO qa_security_state VALUES(?,1,1,1,'PASSWORD_ONLY')").bind(id).run();
    await db.prepare("INSERT INTO qa_factors VALUES(?,'ACTIVE',1)").bind(id).run();
    await db.prepare("INSERT INTO iaict_password_credentials_v2 VALUES(?,?,?,100000,'qa')")
      .bind(id,"synthetic-salt",CRED).run();
  }
  await db.prepare("INSERT INTO roles(id,code,name) VALUES(?,?,?)").bind(ROLE,"editor","QA Editor").run();
  await db.prepare("INSERT INTO admin_user_roles VALUES(?,?)").bind(USER,ROLE).run();
  await db.prepare("INSERT INTO admin_user_roles VALUES(?,?)").bind(OTHER,ROLE).run();
  const state = id => db.prepare("SELECT * FROM qa_security_state WHERE user_id=?").bind(id).first();
  const number = table => db.prepare("SELECT COUNT(*) AS n FROM "+table).first("n");
  const totals = async () => ({
    sessions:await number("iaict_auth_sessions"),audits:await number("audit_logs"),
    guards:await number("qa_one_change_guard"),
  });
  const legacyToken = randomBytes(32).toString("hex");
  await db.prepare("INSERT INTO iaict_auth_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)")
    .bind(sha(legacyToken),USER,NOW-1000,NOW+100000).run();

  // A future *server-side* reader must enforce BOTH current effective policy
  // and epoch. There is no Worker/route integration in this test.
  const authorized = async (token,at=NOW) => !!await db.prepare(
    "SELECT s.token_hash FROM iaict_auth_sessions s " +
    "JOIN admin_users u ON u.id=s.user_id JOIN qa_security_state p ON p.user_id=u.id " +
    "WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.is_active=1 " +
    "AND EXISTS(SELECT 1 FROM admin_user_roles r WHERE r.user_id=u.id) " +
    "AND (s.security_revision_at_issue IS NULL OR s.security_revision_at_issue=p.security_revision) " +
    "AND (s.policy_version_at_issue IS NULL OR s.policy_version_at_issue=p.policy_version) " +
    "AND ((p.policy='PASSWORD_ONLY' AND (s.auth_level IN('password','mfa') OR s.auth_level IS NULL)) " +
    "OR (p.policy='MFA_REQUIRED' AND s.auth_level='mfa' AND s.security_revision_at_issue=p.security_revision " +
    "AND s.policy_version_at_issue=p.policy_version AND s.mfa_verified_at BETWEEN s.created_at AND ?)) LIMIT 1"
  ).bind(sha(token),at,at).first();
  assert("LEGACY_SESSION_ONLY_UNDER_EXPLICIT_PASSWORD_ONLY", await authorized(legacyToken));
  assert("UNKNOWN_SESSION_NEVER_AUTHORIZES", !(await authorized(randomBytes(32).toString("hex"))));

  // The candidate credential and epochs were read before expensive PBKDF2.
  // All policy/epoch/credential predicates MUST be checked again in D1 at INSERT.
  const issuePassword = async ({expected, beforeInsert, sessionId=randomUUID()}={}) => {
    const token = randomBytes(32).toString("hex");
    const candidate = expected ?? await state(USER);
    if (beforeInsert) await beforeInsert();
    try {
      const result = await db.batch([
        db.prepare(
          "INSERT INTO iaict_auth_sessions(token_hash,user_id,created_at,expires_at,auth_level," +
          "security_revision_at_issue,policy_version_at_issue) " +
          "SELECT ?,u.id,?,?,'password',p.security_revision,p.policy_version " +
          "FROM admin_users u JOIN qa_security_state p ON p.user_id=u.id " +
          "WHERE u.id=? AND u.is_active=1 AND p.policy='PASSWORD_ONLY' " +
          "AND p.security_revision=? AND p.credential_revision=? AND p.policy_version=? " +
          "AND EXISTS(SELECT 1 FROM admin_user_roles r WHERE r.user_id=u.id) " +
          "AND EXISTS(SELECT 1 FROM iaict_password_credentials_v2 c " +
          "WHERE c.user_id=u.id AND c.password_hash=?)"
        ).bind(sha(token),NOW,NOW+100000,USER,
          candidate.security_revision,candidate.credential_revision,candidate.policy_version,
          candidate.credential_hash ?? CRED),
        db.prepare(GUARD),
        db.prepare("INSERT INTO audit_logs(id,action,entity_type,entity_id,created_at) VALUES(?,'qa.password.issued','user',?,'qa')")
          .bind(sessionId,USER),
      ]);
      if (result.length!==3||result.some(x=>x?.success!==true)||
          changed(result[0])!==1||changed(result[1])!==1||changed(result[2])!==1)
        throw Error("UNEXPECTED_PASSWORD_BATCH");
      return token;
    } catch (e) {
      if (/constraint/i.test(String(e))) return null;
      throw e;
    }
  };
  const changePolicy = async policy => {
    const r=await db.prepare(
      "UPDATE qa_security_state SET policy=?,security_revision=security_revision+1,policy_version=policy_version+1 WHERE user_id=?"
    ).bind(policy,USER).run();
    assert("POLICY_TRANSITION_WRITES_EXACT_ONE",changed(r)===1);
  };
  const password = await issuePassword();
  assert("PASSWORD_ONLY_ISSUES_REAL_BASELINE_TABLE_SESSION",typeof password==="string"&&await authorized(password));
  const oldEpoch=await state(USER),beforeFlip=await totals();
  assert("POLICY_FLIP_DURING_PBKDF2_FAILS_AT_FINAL_INSERT",
    (await issuePassword({expected:oldEpoch,beforeInsert:()=>changePolicy("MFA_REQUIRED")}))===null);
  const afterFlip=await totals();
  assert("DENIED_PASSWORD_BATCH_INSERTS_NO_SESSION_OR_AUDIT",
    afterFlip.sessions===beforeFlip.sessions&&afterFlip.audits===beforeFlip.audits&&
    afterFlip.guards===beforeFlip.guards);
  assert("PASSWORD_SESSION_DENIED_AFTER_MFA_POLICY_CHANGE",!(await authorized(password)));
  assert("LEGACY_NULL_ASSURANCE_DENIED_UNDER_MFA",!(await authorized(legacyToken)));
  assert("FRESH_PASSWORD_SESSION_DENIED_UNDER_MFA",
    (await issuePassword({expected:await state(USER)}))===null);

  const issueChallenge = async () => {
    const token=randomBytes(32).toString("hex");
    const p=await state(USER),f=await db.prepare("SELECT * FROM qa_factors WHERE user_id=?").bind(USER).first();
    await db.prepare("INSERT INTO qa_challenges VALUES(?,?,?,?,?,?,?,?,NULL)")
      .bind(sha(token),USER,p.security_revision,p.credential_revision,p.policy_version,
        f.secret_version,NOW-1000,NOW+299000).run();
    return token;
  };
  const consumed=token=>db.prepare("SELECT consumed_at FROM qa_challenges WHERE token_hash=?").bind(sha(token)).first("consumed_at");
  // This test assumes the OTP has already been verified by a separate layer.
  // It proves local D1 epoch/factor/policy transaction invariants ONLY.
  const redeem = async (token,{beforeBatch,auditId=randomUUID()}={}) => {
    const hash=sha(token),sessionToken=randomBytes(32).toString("hex"),fullSession=sha(sessionToken);
    if(beforeBatch) await beforeBatch();
    try {
      const result=await db.batch([
        db.prepare(
          "UPDATE qa_challenges SET consumed_at=? WHERE token_hash=? AND user_id=? " +
          "AND consumed_at IS NULL AND created_at<=? AND expires_at>? " +
          "AND EXISTS(SELECT 1 FROM qa_security_state p JOIN admin_users u ON u.id=p.user_id " +
          "JOIN qa_factors f ON f.user_id=p.user_id WHERE p.user_id=qa_challenges.user_id " +
          "AND p.security_revision=qa_challenges.security_revision " +
          "AND p.credential_revision=qa_challenges.credential_revision " +
          "AND p.policy_version=qa_challenges.policy_version AND p.policy='MFA_REQUIRED' " +
          "AND u.is_active=1 AND f.status='ACTIVE' " +
          "AND f.secret_version=qa_challenges.factor_version " +
          "AND EXISTS(SELECT 1 FROM admin_user_roles r WHERE r.user_id=u.id))"
        ).bind(NOW,hash,USER,NOW,NOW),
        db.prepare(GUARD),
        db.prepare(
          "INSERT INTO iaict_auth_sessions(token_hash,user_id,created_at,expires_at," +
          "auth_level,mfa_verified_at,security_revision_at_issue,policy_version_at_issue) " +
          "SELECT ?,user_id,?,?,'mfa',?,security_revision,policy_version " +
          "FROM qa_security_state WHERE user_id=? AND policy='MFA_REQUIRED'"
        ).bind(fullSession,NOW,NOW+100000,NOW,USER),
        db.prepare(GUARD),
        db.prepare("INSERT INTO audit_logs(id,action,entity_type,entity_id,created_at) VALUES(?,'qa.mfa.issued','user',?,'qa')")
          .bind(auditId,USER),
      ]);
      if(result.length!==5||result.some(x=>x?.success!==true)||
        [0,1,2,3,4].some(i=>changed(result[i])!==1))throw Error("UNEXPECTED_REDEMPTION_BATCH");
      return sessionToken;
    }catch(e){
      if(/constraint/i.test(String(e)))return null;
      throw e;
    }
  };
  const testStale=async(name,mutate)=>{
    const token=await issueChallenge(),before=await totals();
    await mutate();
    const epoch=await state(USER);
    assert(name+"_EPOCH_MONOTONIC",Number.isSafeInteger(epoch.security_revision)&&epoch.security_revision>0);
    assert(name+"_STALE_CHALLENGE_REJECTED",await redeem(token)===null);
    const after=await totals();
    assert(name+"_BATCH_ROLLBACK",after.sessions===before.sessions&&
      after.audits===before.audits&&after.guards===before.guards&&
      (await consumed(token))===null);
  };
  stage="REVOKE_REGRANT_ACCOUNT_AND_FACTOR";
  await testStale("ROLE_REVOKE_REGRANT",async()=>{
    const before=(await state(USER)).security_revision;
    await db.batch([
      db.prepare("DELETE FROM admin_user_roles WHERE user_id=?").bind(USER),
      db.prepare("UPDATE qa_security_state SET security_revision=security_revision+1 WHERE user_id=?").bind(USER),
    ]);
    assert("REVOKE_REMOVES_ROLE",!(await db.prepare("SELECT 1 FROM admin_user_roles WHERE user_id=?").bind(USER).first()));
    await db.batch([
      db.prepare("INSERT INTO admin_user_roles VALUES(?,?)").bind(USER,ROLE),
      db.prepare("UPDATE qa_security_state SET security_revision=security_revision+1 WHERE user_id=?").bind(USER),
    ]);
    assert("REGRANT_ADVANCES_TWO_EPOCHS",(await state(USER)).security_revision===before+2);
  });
  await testStale("ACCOUNT_DISABLE_REENABLE",async()=>{
    const before=(await state(USER)).security_revision;
    await db.batch([db.prepare("UPDATE admin_users SET is_active=0 WHERE id=?").bind(USER),
      db.prepare("UPDATE qa_security_state SET security_revision=security_revision+1 WHERE user_id=?").bind(USER)]);
    await db.batch([db.prepare("UPDATE admin_users SET is_active=1 WHERE id=?").bind(USER),
      db.prepare("UPDATE qa_security_state SET security_revision=security_revision+1 WHERE user_id=?").bind(USER)]);
    assert("ACCOUNT_REENABLE_BUMPS_TWICE",(await state(USER)).security_revision===before+2);
  });
  await testStale("PASSWORD_ROTATION",async()=>{
    await db.batch([
      db.prepare("UPDATE iaict_password_credentials_v2 SET password_hash=? WHERE user_id=?").bind(CRED2,USER),
      db.prepare("UPDATE qa_security_state SET credential_revision=credential_revision+1,security_revision=security_revision+1 WHERE user_id=?").bind(USER),
    ]);
  });
  await testStale("FACTOR_ROTATION",async()=>{
    await db.batch([
      db.prepare("UPDATE qa_factors SET secret_version=secret_version+1 WHERE user_id=?").bind(USER),
      db.prepare("UPDATE qa_security_state SET security_revision=security_revision+1 WHERE user_id=?").bind(USER),
    ]);
  });
  await testStale("FACTOR_DISABLE",async()=>{
    await db.batch([db.prepare("UPDATE qa_factors SET status='DISABLED' WHERE user_id=?").bind(USER),
      db.prepare("UPDATE qa_security_state SET security_revision=security_revision+1 WHERE user_id=?").bind(USER)]);
  });
  await db.batch([db.prepare("UPDATE qa_factors SET status='ACTIVE' WHERE user_id=?").bind(USER),
    db.prepare("UPDATE qa_security_state SET security_revision=security_revision+1 WHERE user_id=?").bind(USER)]);
  const otherBefore=(await state(OTHER)).security_revision;
  assert("INDEPENDENT_USER_EPOCH_UNCHANGED",otherBefore===1);
  stage="SESSION_ASSURANCE_AND_ROLLBACK";
  const freshChallenge=await issueChallenge();
  const accepted=await redeem(freshChallenge);
  assert("FRESH_MFA_CHALLENGE_ISSUES_ASSURED_SESSION",typeof accepted==="string"&&await authorized(accepted));
  const replayBefore=await totals();
  assert("ONE_TIME_CHALLENGE_REPLAY_DENIED",await redeem(freshChallenge)===null);
  const replayAfter=await totals();
  assert("ONE_TIME_REPLAY_ROLLS_BACK",replayBefore.sessions===replayAfter.sessions&&
    replayBefore.audits===replayAfter.audits&&replayBefore.guards===replayAfter.guards);
  const clash=await issueChallenge(),clashBefore=await totals();
  const existingAuditId=randomUUID();
  await db.prepare("INSERT INTO audit_logs(id,action,created_at) VALUES(?,'qa.collision','qa')").bind(existingAuditId).run();
  assert("AUDIT_UNIQUE_FAILURE_DENIED",await redeem(clash,{auditId:existingAuditId})===null);
  const clashAfter=await totals();
  assert("AUDIT_FAILURE_ROLLS_BACK_CHALLENGE_AND_SESSION",
    clashAfter.sessions===clashBefore.sessions&&clashAfter.audits===clashBefore.audits+1&&
    clashAfter.guards===clashBefore.guards&&(await consumed(clash))===null);
  const sessionEpochBefore=(await state(USER)).security_revision;
  await changePolicy("PASSWORD_ONLY");
  assert("OLD_ASSURED_SESSION_DENIED_ON_POLICY_DOWNGRADE_EPOCH",!(await authorized(accepted))&&
    (await state(USER)).security_revision===sessionEpochBefore+1);
  await changePolicy("MFA_REQUIRED");
  assert("POLICY_TOGGLE_CANNOT_REVIVE_OLD_MFA_SESSION",!(await authorized(accepted)));
  assert("OLD_PASSWORD_AND_LEGACY_NEVER_REVIVE",!(await authorized(password))&&!(await authorized(legacyToken)));
  const foreign=await db.prepare("PRAGMA foreign_key_check").all();
  assert("REAL_FOREIGN_KEYS_INTACT",foreign.results.length===0);
  console.log("[iam-real-schema-d1] PASS "+checks.length+"/"+checks.length+
    " groups: actual 0001/0022/0023/0024 source, ephemeral extensions, "+
    "atomic policy/epoch checks; no hosted D1, Worker MFA or authorized E2E.");
} catch(e) {
  console.error("[iam-real-schema-d1] FAIL stage="+stage+" "+String(e?.message ?? e));
  process.exitCode=1;
} finally {
  if(mf) await mf.dispose();
}
