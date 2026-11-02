#!/usr/bin/env node
/**
 * IAM-FUT-013: ephemeral local D1 multi-entity MFA transaction contract.
 * Synthetic HMAC-SHA1 TOTP only. NEVER a real session, live secret, migration,
 * real Cloudflare D1 binding, Worker login route or authorized MFA user.
 *
 * D1 batch rollback must happen on zero-row CAS: each UPDATE is immediately
 * followed by an INSERT guard with CHECK(observed=1) and SQL changes().
 * A guard failure MUST abort the whole batch, including prior writes.
 */
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const NOW=1_800_000_000_000, PERIOD=30_000, TTL=300_000;
const USER="synthetic-qa-user", FACTOR="synthetic-factor", SECRET=randomBytes(20);
const digest=x=>createHash("sha256").update(x).digest("hex");
const isToken=x=>typeof x==="string"&&/^[a-f0-9]{64}$/.test(x);
const checks=[],assert=(name,ok)=>{if(ok!==true)throw Error("CHECK_FAILED_"+name);checks.push(name)};
const changed=x=>x?.success===true&&Number.isInteger(x?.meta?.changes)?x.meta.changes:-1;
const codeFor=(secret,now)=>{
  const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(Math.floor(now/PERIOD)));
  const h=createHmac("sha1",secret).update(b).digest();
  const off=h[h.length-1]&15;
  return String((h.readUInt32BE(off)&0x7fffffff)%1_000_000).padStart(6,"0");
};
const candidate=(secret,code,now)=>{
  if(typeof code!=="string"||!/^[0-9]{6}$/.test(code)||
     !Number.isSafeInteger(now)||now<0)return null;
  const expected=codeFor(secret,now);let difference=0;
  for(let i=0;i<6;i++)difference|=expected.charCodeAt(i)^code.charCodeAt(i);
  return difference===0?Math.floor(now/PERIOD):null;
};
const UPDATE_CHALLENGE="UPDATE synthetic_challenges SET consumed_at_ms=?,revision=revision+1 WHERE challenge_hash=? AND user_id=? AND factor_id=? AND purpose='LOGIN' AND credential_revision=? AND security_revision=? AND consumed_at_ms IS NULL AND revision>=0 AND created_at_ms>=0 AND created_at_ms<=? AND expires_at_ms>? AND expires_at_ms>created_at_ms AND expires_at_ms-created_at_ms<=? AND failed_attempts BETWEEN 0 AND 4 AND (locked_until_ms IS NULL OR locked_until_ms<=?) AND EXISTS(SELECT 1 FROM synthetic_users u WHERE u.user_id=synthetic_challenges.user_id AND u.is_active=1 AND u.has_active_role=1 AND u.credential_revision=synthetic_challenges.credential_revision AND u.security_revision=synthetic_challenges.security_revision)";
const UPDATE_FACTOR="UPDATE synthetic_factors SET last_accepted_step=?,revision=revision+1 WHERE factor_id=? AND user_id=? AND status='ACTIVE' AND secret_version=? AND (locked_until_ms IS NULL OR locked_until_ms<=?) AND (last_accepted_step IS NULL OR last_accepted_step<?) AND EXISTS(SELECT 1 FROM synthetic_challenges c WHERE c.challenge_hash=? AND c.factor_id=synthetic_factors.factor_id AND c.user_id=synthetic_factors.user_id AND c.consumed_at_ms=?)";
const GUARD="INSERT INTO synthetic_changes_guard(observed) VALUES(changes())";
const INSERT_SESSION="INSERT INTO synthetic_sessions(session_id,user_id,challenge_hash,auth_level,accepted_step,created_at_ms) VALUES(?,?,?,'mfa',?,?)";
const INSERT_AUDIT="INSERT INTO synthetic_audit(event_id,session_id,user_id,event_type,created_at_ms) VALUES(?,?,?,'MFA_LOGIN_SUCCESS',?)";
let mf,stage="BOOT";
try {
  mf=new Miniflare(convertV4MiniflareOptions({
    modules:true,script:"export default { fetch(){return new Response('synthetic only')} }",
    compatibilityDate:"2026-10-12",compatibilityFlags:["nodejs_compat"],
    d1Databases:{DB:randomUUID()},
  }));
  const db=await mf.getD1Database("DB");
  stage="SCHEMA";
  for(const ddl of [
    "CREATE TABLE synthetic_users(user_id TEXT PRIMARY KEY,is_active INTEGER NOT NULL CHECK(is_active IN(0,1)),has_active_role INTEGER NOT NULL CHECK(has_active_role IN(0,1)),credential_revision INTEGER NOT NULL,security_revision INTEGER NOT NULL)",
    "CREATE TABLE synthetic_factors(factor_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,secret_hex TEXT NOT NULL,secret_version INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN('ACTIVE','PENDING','DISABLED')),last_accepted_step INTEGER,revision INTEGER NOT NULL,locked_until_ms INTEGER)",
    "CREATE TABLE synthetic_challenges(challenge_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,factor_id TEXT NOT NULL,purpose TEXT NOT NULL,credential_revision INTEGER NOT NULL,security_revision INTEGER NOT NULL,created_at_ms INTEGER NOT NULL,expires_at_ms INTEGER NOT NULL,consumed_at_ms INTEGER,failed_attempts INTEGER NOT NULL,locked_until_ms INTEGER,revision INTEGER NOT NULL)",
    "CREATE TABLE synthetic_sessions(session_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,challenge_hash TEXT NOT NULL UNIQUE,auth_level TEXT NOT NULL CHECK(auth_level='mfa'),accepted_step INTEGER NOT NULL,created_at_ms INTEGER NOT NULL)",
    "CREATE TABLE synthetic_audit(event_id TEXT PRIMARY KEY,session_id TEXT NOT NULL UNIQUE,user_id TEXT NOT NULL,event_type TEXT NOT NULL,created_at_ms INTEGER NOT NULL)",
    "CREATE TABLE synthetic_changes_guard(observed INTEGER NOT NULL CHECK(observed=1))",
  ])await db.prepare(ddl).run();
  await db.prepare("INSERT INTO synthetic_users VALUES(?,1,1,1,1)").bind(USER).run();
  await db.prepare("INSERT INTO synthetic_factors(factor_id,user_id,secret_hex,secret_version,status,revision) VALUES(?,?,?,1,'ACTIVE',0)").bind(FACTOR,USER,SECRET.toString("hex")).run();

  const userRow=()=>db.prepare("SELECT * FROM synthetic_users WHERE user_id=?").bind(USER).first();
  const factorRow=()=>db.prepare("SELECT * FROM synthetic_factors WHERE factor_id=?").bind(FACTOR).first();
  const challengeRow=token=>db.prepare("SELECT consumed_at_ms AS used,revision AS rev FROM synthetic_challenges WHERE challenge_hash=?").bind(digest(token)).first();
  const number=table=>db.prepare("SELECT COUNT(*) AS n FROM "+table).first("n");
  const totals=async()=>({
    sessions:await number("synthetic_sessions"),
    audits:await number("synthetic_audit"),
    guards:await number("synthetic_changes_guard"),
  });
  const snapshot=async token=>({
    challenge:await challengeRow(token),factor:await factorRow(),totals:await totals(),
  });
  const unchanged=(a,b)=>a.challenge.rev===b.challenge.rev &&
    a.challenge.used===b.challenge.used &&
    a.factor.last_accepted_step===b.factor.last_accepted_step &&
    a.factor.revision===b.factor.revision &&
    a.totals.sessions===b.totals.sessions &&
    a.totals.audits===b.totals.audits &&
    a.totals.guards===b.totals.guards;
  const seed=async({now=NOW,purpose="LOGIN",expires,credentialRevision,securityRevision}={})=>{
    const token=randomBytes(32).toString("hex"),user=await userRow();
    await db.prepare("INSERT INTO synthetic_challenges(challenge_hash,user_id,factor_id,purpose,credential_revision,security_revision,created_at_ms,expires_at_ms,failed_attempts,revision) VALUES(?,?,?,?,?,?,?,?,0,0)")
      .bind(digest(token),USER,FACTOR,purpose,
        credentialRevision??user.credential_revision,securityRevision??user.security_revision,
        now-1000,expires??now+TTL-1000).run();
    return token;
  };
  const attempt=async({token,code,now=NOW,sessionId=randomUUID(),
    eventId=randomUUID(),afterVerify}={})=>{
    if(!isToken(token))return false;
    // Synthetic verifier uses a server-side secret read from local D1. No
    // request-supplied counter/secret can enter the transaction.
    const factor=await factorRow(),user=await userRow();
    if(factor?.status!=="ACTIVE"||typeof factor.secret_hex!=="string"||
       !/^[a-f0-9]{40}$/.test(factor.secret_hex)||!user)return false;
    const step=candidate(Buffer.from(factor.secret_hex,"hex"),code,now);
    if(step===null)return false;
    if(afterVerify)await afterVerify();
    try {
      const statements=[
        db.prepare(UPDATE_CHALLENGE).bind(now,digest(token),USER,FACTOR,
          user.credential_revision,user.security_revision,now,now,TTL,now),
        db.prepare(GUARD),
        db.prepare(UPDATE_FACTOR).bind(step,FACTOR,USER,factor.secret_version,
          now,step,digest(token),now),
        db.prepare(GUARD),
        db.prepare(INSERT_SESSION).bind(sessionId,USER,digest(token),step,now),
        db.prepare(INSERT_AUDIT).bind(eventId,sessionId,USER,now),
      ];
      const outcome=await db.batch(statements);
      if(!Array.isArray(outcome)||outcome.length!==6||
         outcome.some(x=>x?.success!==true)||
         [0,2,4,5].some(i=>changed(outcome[i])!==1))
        throw Error("UNEXPECTED_BATCH_RESULT");
      return true;
    }catch(error){
      // A failed SQL guard/unique index is a DENIAL. Other D1 errors must not
      // become successful authentication or be hidden as expected test data.
      if(/constraint/i.test(String(error)))return false;
      throw error;
    }
  };
  const step1=NOW,step2=NOW+PERIOD,step3=NOW+2*PERIOD,
    step4=NOW+3*PERIOD,step5=NOW+4*PERIOD;
  stage="HAPPY_PATH";
  const original=await seed(),wrong=codeFor(SECRET,NOW)==="999999"?"000000":"999999";
  const before=await snapshot(original);
  assert("WRONG_TOTP_DENIED_NO_WRITES",
    await attempt({token:original,code:wrong})===false&&
    unchanged(before,await snapshot(original)));
  assert("MALFORMED_TOTP_DENIED",
    await attempt({token:original,code:"12"})===false&&
    unchanged(before,await snapshot(original)));
  assert("GOOD_OTP_ALL_FOUR_ENTITIES_COMMIT",
    await attempt({token:original,code:codeFor(SECRET,NOW)})===true &&
    (await challengeRow(original)).rev===1 &&
    (await factorRow()).last_accepted_step===Math.floor(NOW/PERIOD) &&
    (await totals()).sessions===1&&(await totals()).audits===1&&
    (await totals()).guards===2);
  const preReplay=await snapshot(original);
  assert("SAME_CHALLENGE_REPLAY_ROLLS_BACK",
    await attempt({token:original,code:codeFor(SECRET,NOW)})===false &&
    unchanged(preReplay,await snapshot(original)));

  stage="CONCURRENCY";
  const same=await seed({now:step2});
  const race=await Promise.all(Array.from({length:16},()=>attempt({
    token:same,code:codeFor(SECRET,step2),now:step2,
  })));
  assert("SAME_TOKEN_16_WAY_ONE_FULL_TRANSACTION",
    race.filter(Boolean).length===1&&(await challengeRow(same)).rev===1&&
    (await totals()).sessions===2&&(await totals()).audits===2);
  const a=await seed({now:step3}),b=await seed({now:step3});
  const competitor=await Promise.all([a,b].map(token=>attempt({
    token,code:codeFor(SECRET,step3),now:step3,
  })));
  const losing=competitor[0]?b:a,preLosing=await snapshot(losing);
  assert("TWO_CHALLENGES_ONE_FACTOR_COUNTER_ONE_SESSION",
    competitor.filter(Boolean).length===1&&
    (await totals()).sessions===3&&(await totals()).audits===3&&
    (await challengeRow(losing)).rev===0);
  assert("FACTOR_CAS_LOSER_CHALLENGE_NOT_CONSUMED",
    await attempt({token:losing,code:codeFor(SECRET,step3),now:step3})===false&&
    unchanged(preLosing,await snapshot(losing)));

  stage="INJECTED_BATCH_FAILURE";
  const duplicateSession=randomUUID(),collisionToken=await seed({now:step4});
  await db.prepare("INSERT INTO synthetic_sessions VALUES(?,?,?,'mfa',-1,?)")
    .bind(duplicateSession,USER,digest(randomBytes(32).toString("hex")),NOW).run();
  const beforeSession=await snapshot(collisionToken);
  assert("SESSION_UNIQUE_CONSTRAINT_ROLLS_BACK_BOTH_CAS",
    await attempt({token:collisionToken,code:codeFor(SECRET,step4),now:step4,
      sessionId:duplicateSession})===false&&
    unchanged(beforeSession,await snapshot(collisionToken)));
  const duplicateAudit=randomUUID(),auditToken=await seed({now:step4});
  await db.prepare("INSERT INTO synthetic_audit VALUES(?,?,?,'SYNTHETIC_PREEXISTING',?)")
    .bind(duplicateAudit,randomUUID(),USER,NOW).run();
  const beforeAudit=await snapshot(auditToken);
  assert("AUDIT_UNIQUE_CONSTRAINT_ROLLS_BACK_SESSION_FACTOR_AND_CHALLENGE",
    await attempt({token:auditToken,code:codeFor(SECRET,step4),now:step4,
      eventId:duplicateAudit})===false&&
    unchanged(beforeAudit,await snapshot(auditToken)));
  assert("ABORTED_CHALLENGE_CAN_RETRY_AFTER_ERROR_CLEARED",
    await attempt({token:auditToken,code:codeFor(SECRET,step4),now:step4})===true&&
    (await challengeRow(auditToken)).rev===1);

  stage="TOCTOU";
  const expired=await seed({now:step5,expires:step5});
  const preExpired=await snapshot(expired);
  assert("EXPIRED_VERIFIED_OTP_NEVER_ADVANCES_FACTOR",
    await attempt({token:expired,code:codeFor(SECRET,step5),now:step5})===false&&
    unchanged(preExpired,await snapshot(expired)));
  const epoch=await seed({now:step5}),preEpoch=await snapshot(epoch);
  assert("SECURITY_EPOCH_CHANGED_AFTER_OTP_VERIFIED_ROLLBACK",
    await attempt({token:epoch,code:codeFor(SECRET,step5),now:step5,
      afterVerify:()=>db.prepare("UPDATE synthetic_users SET security_revision=security_revision+1 WHERE user_id=?")
        .bind(USER).run()})===false&&
    unchanged(preEpoch,await snapshot(epoch)));
  const pwd=await seed({now:step5}),prePwd=await snapshot(pwd);
  assert("CREDENTIAL_CHANGED_AFTER_OTP_VERIFIED_ROLLBACK",
    await attempt({token:pwd,code:codeFor(SECRET,step5),now:step5,
      afterVerify:()=>db.prepare("UPDATE synthetic_users SET credential_revision=credential_revision+1 WHERE user_id=?")
        .bind(USER).run()})===false&&
    unchanged(prePwd,await snapshot(pwd)));
  const disabled=await seed({now:step5}),preDisabled=await snapshot(disabled);
  assert("USER_DISABLED_AFTER_OTP_VERIFIED_ROLLBACK",
    await attempt({token:disabled,code:codeFor(SECRET,step5),now:step5,
      afterVerify:()=>db.prepare("UPDATE synthetic_users SET is_active=0 WHERE user_id=?")
        .bind(USER).run()})===false&&
    unchanged(preDisabled,await snapshot(disabled)));
  await db.prepare("UPDATE synthetic_users SET is_active=1 WHERE user_id=?").bind(USER).run();
  const inactiveFactor=await seed({now:step5}),preFactor=await snapshot(inactiveFactor);
  assert("FACTOR_DISABLED_AFTER_OTP_VERIFIED_ROLLBACK",
    await attempt({token:inactiveFactor,code:codeFor(SECRET,step5),now:step5,
      afterVerify:()=>db.prepare("UPDATE synthetic_factors SET status='DISABLED' WHERE factor_id=?")
        .bind(FACTOR).run()})===false&&
    unchanged(preFactor,await snapshot(inactiveFactor)));
  await db.prepare("UPDATE synthetic_factors SET status='ACTIVE' WHERE factor_id=?").bind(FACTOR).run();
  const rotated=await seed({now:step5}),preRotated=await snapshot(rotated);
  assert("FACTOR_VERSION_CHANGED_AFTER_OTP_VERIFIED_ROLLBACK",
    await attempt({token:rotated,code:codeFor(SECRET,step5),now:step5,
      afterVerify:()=>db.prepare("UPDATE synthetic_factors SET secret_version=secret_version+1 WHERE factor_id=?")
        .bind(FACTOR).run()})===false&&
    unchanged(preRotated,await snapshot(rotated)));

  stage="CROSS_ENTITY_INVARIANTS";
  const sessionCount=(await db.prepare("SELECT COUNT(*) AS n FROM synthetic_sessions WHERE accepted_step>=0").first()).n;
  const audited=(await db.prepare("SELECT COUNT(*) AS n FROM synthetic_sessions s JOIN synthetic_audit a ON a.session_id=s.session_id WHERE a.event_type='MFA_LOGIN_SUCCESS'").first()).n;
  assert("EVERY_SYNTHETIC_SUCCESS_SESSION_HAS_AUDIT",sessionCount===4&&audited===sessionCount);
  assert("NO_SUCCESS_AUDIT_WITHOUT_SESSION",
    (await db.prepare("SELECT COUNT(*) AS n FROM synthetic_audit a WHERE a.event_type='MFA_LOGIN_SUCCESS' AND NOT EXISTS(SELECT 1 FROM synthetic_sessions s WHERE s.session_id=a.session_id)").first()).n===0);
  assert("BOTH_SQL_CAS_GUARDS_COMMITTED_ONCE_PER_SUCCESS",
    (await totals()).guards===sessionCount*2);
  assert("NO_PASSWORD_ONLY_SESSION",
    (await db.prepare("SELECT COUNT(*) AS n FROM synthetic_sessions WHERE auth_level<>'mfa'").first()).n===0);

  console.log("[mfa-atomic-d1] OBSERVED "+JSON.stringify({
    case_id:"IAM-FUT-013",environment:"LOCAL_MINIFLARE_D1",
    assertion_groups:checks.length,checks,
    same_token_parallel:16,same_token_winners:race.filter(Boolean).length,
    same_counter_distinct_challenge_winners:competitor.filter(Boolean).length,
    committed_synthetic_mfa_sessions:sessionCount,
    committed_synthetic_audits:audited,synthetic_hmac_sha1_checked:true,
    actual_mfa_implemented:false,hosted_d1:false,real_session:false,
    verdict:"PASS",
  }));
}catch(error){
  console.error("[mfa-atomic-d1] FAIL "+JSON.stringify({
    stage,reason:error instanceof Error&&/^CHECK_FAILED_[A-Z_]+$/.test(error.message)
      ?error.message:"ISOLATED_TRANSACTION_TEST_FAILURE",
  }));
  process.exitCode=1;
}finally{if(mf)await mf.dispose();}
