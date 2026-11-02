# ADR-0002 — Native IAICT MFA, TOTP enrollment and Cloudflare Access transition
**Status:** PROPOSED — not approved for live MFA enablement
**Date:** 2026-10-31 | **Issue:** https://github.com/ntdung-tds/iaict-portal/issues/37
**Scope:** Auth, IAM, session policy, recovery and Cloudflare Workers/D1. No production or Access changes under this ADR draft.

## Context
IAICT uses native password/session backed by D1 and keeps Cloudflare Access protecting all admin paths. To safely reduce sole dependence on Access, TOTP or phishing-resistant WebAuthn passkeys must be added with independent recovery, secure credential storage, throttle, audit, and a tested step-up policy. NIST SP 800-63B-4 (2025 final) requires OTP replay resistance and throttling for short OTPs; OWASP MFA guidance cautions that OTP alone is vulnerable to phishing and cannot be substituted for a phishing-resistant method for high-risk roles.

## Choices considered
1. **Keep Access as the only MFA provider.** Lowest near-term effort but continues vendor/Access login dependence.
2. **Native RFC 6238 TOTP, followed by WebAuthn passkeys (recommended staged design).** Works in Workers with WebCrypto, allows controlled enrollment and independent rate limit/audit and staged testing. Requires careful encrypted secret storage, replay counter, recovery and step-up.
3. **External IdP (Auth0/Clerk/other) for auth, with local permissions.** Outsourced authenticator risk but cost/privacy/vendor evaluation and IAM migration needed.

**Proposed direction:** B, *without removing Access*. The pure TOTP RFC 6238 utility + published test vectors are introduced as **FOUNDATION ONLY**. Its existence is not enrollment/second-factor enforcement.

## Cryptography and policy decisions (proposal)
- 160-bit cryptographically random TOTP secret minimum, standard Base32; 30-second period; 6 digits default for compatibility and configurable 8 digits; SHA-1 HMAC for broad authenticator interoperability, SHA-256/512 validated by vectors. Treat TOTP shared secret as restricted, never log QR/otpauth URIs or expose after binding.
- D1 must store **only AES-256-GCM encrypted** TOTP secret + IV, version/key ID, binding state, attempts, last accepted counter, created/confirmed timestamps, and explicit admin/recovery history. The envelope key MUST be an authenticated Cloudflare secret/KMS binding, never stored in D1, GitHub, R2 screenshots, plain Drive backup or client.
- Enrollment: authenticated **recent password recheck**, CSRF exact-origin, per-user throttling, fresh draft secret (short TTL), show setup key **once over HTTPS**, validate one current 6/8 digit TOTP, then atomically activate and audit; never permit pending/unconfirmed secret to authorize sign-in.
- Verify: only after correct first factor, return a restricted, short-lived **pre-MFA challenge** rather than full admin CMS session. Apply per-user/IP attempt ceilings, UTC clock ±1 period, and **D1 atomic compare-and-set** `last_accepted_counter < accepted_counter` to stop concurrency replay. A stateless code match is insufficient and does not grant authentication.
- Changing/disabling MFA requires recent reauthentication, active MFA or independently reviewed recovery flow, session reissue/revocation and audit. All privileged roles require MFA before native-only admin route access.
- Recovery: one-time cryptographically random recovery codes stored as salted/peppered secure hashes, delivery one-time over HTTPS and clear user warning; lost-device emergency path with verified identity, delayed/dual approval for privileged users. Avoid email-only self-service MFA reset without additional verification and cooldown.
- Disable/handoff gate: actual authenticated multi-device QA, lost device tests, recovery+rate-limit+replay race tests, negative IDOR/CSRF, audit, accessibility, rollbacks, and security review on staging. **Keep Cloudflare Access** until explicit approval of independent cutover.

## Implementation milestones
- **MFA-F1 (this PR):** pure TOTP utility + RFC 6238 vectors; ADR and QA record. No DB schema migration, no UI/API, no operational behavior change.
- **MFA-F2:** encryption key management ADR extension; forward-only D1 schema for pending/authenticated TOTP, replay & rate limits; tests for encryption and key rotation.
- **MFA-F3:** authenticated enrollment + verify + enforce challenge for native login; atomic counter updates, abuse protections and audit.
- **MFA-F4:** recovery, backup codes, passkey path/step-up and real controlled staging QA; explicit owner sign-off before any Access cutover.

## Requirements/tests
- F1 tests: RFC SHA1/SHA256/SHA512 8-digit vectors, zero-pad 6-digit codes, 30-second window, malformed input, generated-secret 160-bit, accepted-step read-only filter.
- Future P0 tests: prove two concurrent same-step submissions yield exactly ONE D1 acceptance, verify expired/reused OTP, wrong password/challenge cannot escalate, throttle per user/IP and lockout-safe recovery.
- QA catalog item `IAM-FUT-007` is a foundation test. `IAM-FUT-001` (full MFA enrollment/verification) remains PLANNED/NOT_RUN.
- Secrets and sample OTP QR must not be stored in GitHub screenshots or published Drive.

## References
- IETF RFC 6238: https://www.rfc-editor.org/rfc/rfc6238
- NIST SP 800-63B-4, final: https://pages.nist.gov/800-63-4/sp800-63b.html
- OWASP Multifactor Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
- RFC 4226 (HOTP): https://www.rfc-editor.org/rfc/rfc4226

## 2026-11-02 — Local workerd KDF evidence (not an approval)

- [QA RUN-IAM-20261102-01](../qa/IAICT_TEST_RUNS.md), [CI run #41384536088](https://github.com/ntdung-tds/iaict-portal/actions/runs/41384536088): synthetic workerd `1.20261012.1`, compatibility `2026-10-12`, **100000 SUCCESS (11 ms)** and **100001 SUCCESS (12 ms)**, both 256 bits.
- This contradicts a strict 100000-iteration limit for the tested **local** runtime only. 600000, live staging and full MFA remain **NOT_RUN**; these timings are not throughput benchmarks.
- Keep current `lib/native-auth.ts` `PBKDF2_ITERATIONS=100000` and its equality guard; no automatic parameter migration. Future KDF changes require distinct security, CPU load, availability, migration and rollback review; ADR-0002 remains **PROPOSED**.

## 2026-11-02 — Proposed MFA-F2 cryptographic foundation

The isolated `lib/mfa-secret-crypto.ts` helper uses AES-256-GCM with a new 96-bit nonce per encryption and authenticated metadata linking the owner, factor and key version. Its tests cover roundtrips, nondeterministic nonces, altered records, mismatched ownership and invalid key material. No production route imports this helper; it does not enroll a factor, mint sessions or store data.

**Next design decisions (not yet approved):** separate Worker-managed key provision and rotation, forward-only D1 factor schema and pending/active lifecycle, replay-safe transaction, recovery and real staging acceptance. Current application authentication remains unchanged; this is not permission to modify Access, staging or production. `IAM-FUT-008` covers only the helper; `IAM-FUT-001` end-to-end MFA remains NOT_RUN. ADR-0002 stays PROPOSED.

## 2026-11-02 — Independent post-merge scope and threat-model review

[PR #43](https://github.com/ntdung-tds/iaict-portal/pull/43) was merged at `2f9cfa37e339af9b01521dc3ae403346f4ac54e9` after full PR CI and public/read-only staging acceptance PASS. The current crypto helper is **not imported by any login or account route added in this PR**; six isolated Node/Vitest unit tests are a bounded *cryptographic-helper* result, not approval of MFA enrollment, authentication, secret storage or Cloudflare runtime compatibility.

**Must be resolved before a live factor migration or endpoint:**
- **Key lifecycle:** define protected binding/KMS retrieval, `keyId` lookup, confidentiality of old keys during rotation, key-loss recovery, separate staging/production keys and safe deployment rollback. A `CryptoKey` marked nonextractable only protects the key after import; source material still needs secret handling and lifecycle.
- **Nonce and records:** 96-bit random AES-GCM IV collision is **extremely unlikely**, not mathematically impossible; bound encryptions per key with a rotation policy. Persist envelope metadata, owner/factor state, key version and audit transactionally and validate lengths/format on reads.
- **Enrollment and replay:** pending/confirmed factor lifecycle and TTL, fresh first-factor reauth, CSRF control, server-side attempt limits, fail-closed challenge flow; TOTP code match alone **does not** create a privileged session. Store/reject accepted step via atomic D1 conditional update to block parallel replay.
- **Recovery:** independent identity verification, one-time recovery codes, dual approval for privileged resets, immediate session/factor invalidation and complete audit; avoid email-only MFA bypass.
- **Verification gap:** `IAM-FUT-008` was tested in Node/Vitest. Workerd AES-GCM compatibility, actual secret binding, D1 migrations, concurrency, multi-role and browser scenarios remain **NOT_RUN**.

**Decision:** continue with an architecture proposal and isolated testing. Do not enlarge the runtime implementation or create a secret/migration until risk, rollback, recovery and Owner/security decision are documented. **ADR status stays PROPOSED.**


## 2026-11-02 — Local workerd AES-GCM result and minimal F2 key/factor design

**Measured compatibility:** [RUN-IAM-20261102-03](../qa/IAICT_TEST_RUNS.md) demonstrates **11/11 checks PASS** for the actual `lib/mfa-secret-crypto.ts` bundled into isolated workerd npm `1.20261012.1`, compatibility date `2026-10-12`. Hosted runtime, live bindings, D1 and authenticated MFA remain **NOT_RUN**. No migration or deployment is authorized by this result.

### Proposed key lifecycle — review before implementation
1. **Provision:** Generate one independent 256-bit symmetric master key per environment using an approved confidential source, expose to the Worker only through a **secret binding/KMS**. Do not use `vars`, GitHub variables, D1, R2, screenshots or a client bundle for key material. Never log/export key, plaintext TOTP seed, QR or backup codes. Cloudflare secret updates can create new Worker versions; treat provisioning and rollback as separate approved operations, not safe side effects of tests.
2. **Key IDs:** Maintain a non-secret key identifier in the envelope. Only an explicit, allowlisted ID maps to an available secret; fail closed for unknown, missing or revoked IDs. The current helper imports nonextractable `CryptoKey` from caller-provided bytes; the call site must safely obtain the key, preserve separation between staging and production and avoid caching raw key bytes in logs or persistent state.
3. **Rotation:** New enrollments use a new `keyId`; temporarily retain approved old decrypt-only material until all encrypted envelopes have been read-back, re-encrypted with a fresh IV under the new key and verified. Rotation must be resumable/idempotent, auditable and bounded; do **not** delete old secrets until encrypted-factor and backup/restore coverage is verified. Define lost-key disaster/recovery decision beforehand; no silent reset of MFA.
4. **Nonce budget:** Random 96-bit GCM IV per record and per re-encryption. Collision probability is small but not impossible; impose a documented maximum encryptions/key and a rotation/monitoring policy before high-scale use. Crypto helper nonextractability is not by itself end-to-end key management.

### Proposed D1 factor contract — NOT a migration

One separate `iam_mfa_factors` table is the minimum useful starting point, *subject to real-schema cross-check and migration review*, with these fields:

| Field group | Proposed semantics |
| --- | --- |
| Ownership | stable `factor_id` primary key, `user_id` FK to actual IAM users table; unique constraint for active TOTP factor per user if that is the approved product policy |
| Encrypted seed | `envelope_version=1`, `algorithm='AES-256-GCM'`, `key_id`, `iv_b64url`, `ciphertext_b64url`; no plaintext or backup seed column |
| Lifecycle | `status` one of `PENDING/ACTIVE/DISABLED`; `pending_expires_at`, `confirmed_at`, `created_at`, `updated_at`, optional `disabled_at` |
| Replay/abuse | `last_accepted_counter` nullable integer, `failed_attempts` and `locked_until`; counter and attempt limits must be checked server-side, not derived from client |
| Concurrency/audit | row `revision` for conditional updates; immutable audit events in existing IAM audit design, not storing raw OTP/key bytes |

Proposed replay verification SQL concept (not runnable migration): `UPDATE iam_mfa_factors SET last_accepted_counter=?, revision=revision+1 WHERE factor_id=? AND user_id=? AND status='ACTIVE' AND (last_accepted_counter IS NULL OR last_accepted_counter < ?)`; issue an MFA-authenticated session **only when the conditional write commits exactly one row and the primary-factor challenge is still valid**. Validate D1 `meta.changes` and concurrency in an isolated D1 test; group audit/session/factor state changes transactionally or design a safe compensation path. Do not issue a full session before MFA verification.

**Recovery and rollback gates:** verified first factor + MFA/recovery code for sensitive changes, separate approved privileged emergency recovery, one-time hashed backup codes, dual control and audits, revocation after reset, test of lost authenticator and key loss. Recoverable backup/restore and no orphaned ACTIVE factors required before any staged migration.

**Decision:** Design proposal only, **ADR-0002 remains PROPOSED**. No real key, D1 schema, MFA factor endpoints, rate limits, Access cutover or production changes in this PR. Next test layers: synthetic D1 CAS/replay race, key rotation/failure cases, key-binding runtime, real authorized staging E2E after Owner/security review.

**References:** [Cloudflare Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [D1 prepared-statement semantics](https://developers.cloudflare.com/d1/worker-api/prepared-statements/), [D1 transactions via batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).


## 2026-11-02 — Synthetic local D1 CAS concurrency observation

[RUN-IAM-20261102-05](../qa/IAICT_TEST_RUNS.md) / `IAM-FUT-010` executed the **proposed counter CAS** against an ephemeral Miniflare v5 D1/SQLite database; 15/15 independent checks PASS with 16 simultaneous identical-counter `UPDATE` statements and **exactly one writer reporting `meta.changes === 1`** at SHA `2bee360c3552e9dcfe60c94e7719b9d8ae7d33a5`, [CI #41393225236](https://github.com/ntdung-tds/iaict-portal/actions/runs/41393225236). The runner also rejects stale/older counters, mismatched user/factor, pending/disabled/locked rows, invalid inputs and missing D1 result metadata; this is a bounded *storage contract test*, not MFA.

**Refinement to proposed future D1 contract:** factor writes must be conditioned on `status='ACTIVE'`, authenticated `user_id` plus `factor_id`, no current lockout and strictly increasing counter; success only if a single conditional D1 write returns `success=true` **and** integer `meta.changes=1`. The current local test adds a test-only `locked_until` check to the previously illustrative SQL. Never trust a preceding SELECT or the fact that the HTTP/SQL request completed; never enable MFA session before committing the CAS **and** checking all primary-authentication/challenge requirements.

**Explicit gaps:** the schema was an isolated minimal test table with synthetic identifiers, *not* a canonical migration or the actual `admin_users` relationship. No real TOTP code was generated/matched for this check, no new/old step-window validation, lockout retry policy, D1 batch session/audit atomicity, hosted replica consistency, cross-region concurrency, first-factor session validation or recovery. `IAM-FUT-001` remains NOT_RUN. These require separate integration/security evidence and Owner approval before provisioning secrets, adding a forward-only migration or exposing MFA APIs. **ADR-0002 remains PROPOSED; SRS remains FROZEN.**


## 2026-11-02 — F2/F3 native MFA integration contract (security design, not approved)

**Basis:** source read at merged [PR #47](https://github.com/ntdung-tds/iaict-portal/pull/47) base `11e3af741ede3e3d0d17c9e6d34034a8bb388876`, code `lib/native-auth.ts`, `app/api/auth/login/route.ts`, `app/api/auth/session/route.ts`, `app/api/account/password/route.ts`, `worker.ts`, `lib/totp.ts`, `lib/mfa-secret-crypto.ts`, `lib/cms-roles.ts`. **This section is design-only**; the existing login/password/session code remains in place until a separately reviewed, tested feature PR. Owner/security acceptance **NOT GIVEN**; ADR remains **PROPOSED**.

### A. Confirmed existing security boundary — primary migration risk

| Existing code | Confirmed behavior | Required change before enforcing native MFA |
| --- | --- | --- |
| `authenticateNativePassword()`, `lib/native-auth.ts` | Immediately inserts an `iaict_auth_sessions` row in D1 on a correct password, then returns a full session token (existing `__Host-iaict_session`); it does not check MFA status | **Split password-verification from full-session issuance**. For an MFA-required account create only a restricted, expiring first-factor challenge; never create the full admin session during password-only authentication |
| `POST /api/auth/login` | Sets the full-session cookie after password success | Under an explicitly enabled per-user/policy MFA gate, return a generic `mfaRequired`/continuation state without full-session cookie; challenge is in a separate secure HttpOnly cookie, not a browser-controlled user ID |
| `nativeActorEmail()` / `nativeSessionPrincipal()` and `GET /api/auth/session` | Resolve an active session against `iaict_auth_sessions`, active user and roles but currently **no assurance-level check** | Require server-side `auth_level='mfa'`/recent step-up when effective policy requires it, including for **previously minted** native sessions. Never trust the client-side page state or `X-IAICT-Verified-Email` |
| `worker.ts` admin checks | Cloudflare Access remains the outer admin gate; native cookie may satisfy Worker identity when enabled, and internal verified header is stripped from incoming requests | Keep Access. Native fallback must only accept a server-verified **MFA-complete** native principal when enforcement is enabled. A pre-MFA challenge can never authorize `/admin*` or `/api/admin*` |
| Password rotation in `setNativePassword()` | Rotates credential and revokes native sessions through D1 conditional writes | Also revoke outstanding pre-MFA challenges and step-up authorizations on any credential reset, user disable or role removal; verify credential snapshot at challenge redemption |

**Explicit hazard:** adding an OTP form to today's login endpoint is **not** MFA, because the current first-factor call has already created a privileged session. Closing only the UI route cannot fix this server-side bypass.

### B. Proposed state machines, TTL and failure rules (not runtime flags)

```text
LOGIN: START
  → PASSWORD_FAILED                   [generic denial, throttle; no session]
  → PRIMARY_VERIFIED                 [server-side credential snapshot, no full session]
      → POLICY_NOT_REQUIRED          [legacy pilot path only while independently approved]
      → MFA_ENROLLMENT_REQUIRED      [restricted enrollment challenge; no CMS session]
      → MFA_CHALLENGE_PENDING        [one-time opaque challenge, expires in ≤5 min]
          → EXPIRED / REVOKED / LOCKED [deny; no full session]
          → TOTP_INVALID / REPLAYED   [deny; bounded attempts; no full session]
          → MFA_VERIFIED              [atomic challenge consumption + replay CAS
                                        + full-session creation + audit]
              → FULL_SESSION          [server-derived assurance, least-privilege roles]
```

- Pending challenge must be generated with ≥256 bits of cryptographic randomness; store **only SHA-256 digest** in D1; optionally present a distinct `__Host-iaict_mfa_pending` Secure/HttpOnly/SameSite=Lax cookie; TTL proposal **5 minutes**, no refresh upon failed OTP. **The pending cookie is never accepted by normal session/auth middleware.** `Cache-Control: no-store` on all auth responses; same-origin POST / CSRF validation; JSON/body bounds; no user enumeration.
- Challenge fields proposed: `challenge_hash, user_id, credential_version/fingerprint, primary_verified_at, created_at, expires_at, consumed_at, failed_attempts, blocked_until, purpose, revision`. Never persist plaintext password, OTP, seed, full token or recovery code. Check active user, current roles and unchanged credential **again when redeeming**; concurrent password reset must invalidate the challenge. Rate-limit per challenge **and** per account/IP at the server; log metadata without identifiers/credentials that could become secrets.
- **Only the server** evaluates effective MFA policy from account/roles/security settings. For a user required to have MFA but without an ACTIVE factor, route to an Access-protected, tightly scoped enrollment/bootstrap flow; do not fail open to CMS. Propose privileged-role pilot first (`admin`, `news_admin`) under Access, then expand policy to other roles after owner sign-off; final enforcement policy for all 7 roles remains an **Owner decision**.
- Never upgrade a pre-MFA token to a full session by changing a JS variable or reusing the same cookie. Rotate to a separate, fresh 256-bit full session token only on confirmed completion, with server-side `auth_level` and `mfa_verified_at`. Any old native session without adequate assurance must be rejected for newly protected admin access when policy flips; revoke/rotate affected old sessions at rollout. Stronger step-up on sensitive account/factor changes may require a separately time-bounded `step_up_verified_at`.
- Bound effective time checks to server-controlled milliseconds; never trust user time/counter, role or factor ID from requests as authority. UI can show setup/verification states but never makes the authorization decision.

### C. Draft persistence contract — no SQL migration is authorized

These are **proposed logical entities**, not finalized table names or DDL. Before building a forward-only migration, read actual applied D1 schema and FK/index/unique policies and record a reversible data plan.

| Logical entity | Key invariant | Proposed fields / consistency |
| --- | --- | --- |
| `iam_mfa_factors` | One owner `user_id` per factor, no unconfirmed factor can authenticate | `factor_id, user_id, status(PENDING/ACTIVE/DISABLED), envelope_version, algorithm, key_id, iv_b64url, ciphertext_b64url, created_at, pending_expires_at, confirmed_at, disabled_at, failed_attempts, locked_until, last_accepted_counter, revision`; FK to actual IAM identity after schema cross-check |
| `iam_mfa_challenges` | One-time first-factor proof, never a session | `challenge_hash` PK, `user_id`, purpose, password-credential fingerprint/revision, expires, consumed/lock fields, attempts/revision; prepared statements and bounded cleanup |
| `iam_mfa_recovery_codes` | One-time redemption, no plaintext in D1 | owner, recovery-code digest derived with secure salt/pepper design, issued/used timestamps, revision; at least 128 bits per random code; never return old codes |
| `iaict_auth_sessions` enhancement | Every privileged native session proves appropriate assurance when policy requires it | Forward-only `auth_level` and `mfa_verified_at`/factor reference, with legacy NULL mapping **NOT_MFA**. All server-side readers and Worker fallback updated together; no default upgrade for old rows |
| Existing `audit_logs` | Security events are immutable metadata without secrets | login challenge created/failed/consumed, factor enroll/disable/rotate, recovery attempts, session revoke, policy changes. No OTP, plaintext seed, full session token/hash, encrypted backup material or raw headers |

**Transaction rule (requires implementation proof):** validating an OTP with `matchTotpCounter()` only yields a candidate step. A single authoritative D1 commit must prove the challenge is active/unused, account/credential policy still valid, factor ACTIVE/unlocked, and `last_accepted_counter` advances strictly, then consume the challenge and issue **one** full session and safe audit event. A successful SELECT, a promise resolution or `UPDATE` affecting zero rows **must not** issue a session. Need `success===true` and `meta.changes===1` for the CAS, and test rollback/partial-write behavior **of the chosen actual D1 transactional pattern**. D1 `batch()` ordering alone is not proof that logical conditional failures abort subsequent inserts: tests must prove no orphaned session under 0-row CAS, mismatched/expired challenge, timeout and concurrent requests. A higher accepted TOTP step must never be accepted solely because it is newer if its code/challenge is wrong.

**Race matrix:** same user/factor/OTP on two requests → **≤1** session; wrong challenge or wrong password → 0; invalid or expired pending → 0; password rotation/role revoke/user disable between primary and OTP → 0; wrong user/factor challenge binding → 0; locked/PENDING/DISABLED → 0; credential/key outage or D1 error → **fail closed**, no secret leakage. Change of roles must affect currently valid sessions immediately as today, plus current MFA policy.

### D. Proposed key lifecycle, recovery, rollout and rollback

1. **Environment key isolation:** distinct staging/production secret binding or KMS; only explicit key IDs accepted. No key bytes in D1, GitHub, logs, QA folders or client. Securely provision/recover before first real factor; do not assume nonextractable `CryptoKey` solves key source/rotation. Key rotation: new enrollments encrypt with active ID, read-only legacy decrypt with retained old key, revision-CAS re-encrypt each factor with new IV and verify readback, retain old key through rollback/backup verification. Unknown/missing/revoked key fails closed; never silently disable MFA to recover.
2. **Enrollment:** only after an approved recent password recheck and valid secure session / restricted enrollment context; create PENDING factor, set short expiry, show otpauth once, confirm one TOTP code, activate with atomic D1 state update, invalidate previous pending drafts, audit. Idempotent retry must not leak or create multiple ACTIVE factors. Administrative roles with no authenticators must have a controlled Access-backed onboarding plan **before** enforcement, not a special permanent MFA bypass.
3. **Recovery:** issue independently random one-time recovery codes shown once to user; persist only keyed/salted verifier. A recovery code must be consumed via atomic CAS, trigger revocation of outstanding challenges and older sessions, require controlled new factor binding and audit/notification. Privileged lost-device/no-code recovery needs independent identity verification + dual human approval and a delay/cooldown (no email-only reset). Disabling MFA requires recent reauth + current active factor or a reviewed recovery process.
4. **Rollout:** (a) no-op schema and local mock tests under inactive gate, (b) staged synthetic identities, no secret in tests, (c) authorized real QA sessions for seven roles and second Admin, (d) privileged-role enrollment pilot under Access, (e) enforce server-side on *all* native session readers, (f) owner security acceptance, (g) consider Access cutover **only as separate decision**. No implicit activation from merge.
5. **Rollback:** roll back enforcement flag without deleting factor rows or removing key bindings; preserve challenge/session audit and encrypted factors for a controlled retry. No rollback may convert an MFA-only user into privileged password-only access unless an explicitly approved emergency policy exists; keep Access as external safety boundary. Restore old Worker/version with old decrypt keys available and known D1 migration compatibility.

### E. Required verification before an implementation PR can be called ready

| ID / source | Required negative proof | Current disposition |
| --- | --- | --- |
| `IAM-FUT-001` existing | Password success without OTP **does not issue** `__Host-iaict_session` for required accounts; pending challenge cannot reach admin; successful OTP + CAS yields one server-recognized MFA session; no old-session bypass | **NOT_RUN** |
| `IAM-FUT-010` existing | Local 16-way CAS single winner; then **hosted** transaction-level session/challenge/CAS success and failure rollback across concurrency | **LOCAL_D1_ONLY_PASS**; hosted/session not run |
| `IAM-FUT-002` existing | Lost device, replayed recovery code, wrong/expired code, two-person privileged recovery, immediate session revocation | **NOT_RUN** |
| `IAM-FUT-004` existing | All 7 roles: Access + native session policy, direct API IDOR/CSRF and no pre-MFA challenge as actor | **NOT_RUN / identity fixtures disabled** |
| `IAM-FUT-008/009` existing | Cross-key decrypt and rotation, tampered metadata, missing/old key, privileged caller boundary | AES-GCM **LOCAL_ONLY_PASS**, hosted binding/rotation not run |
| `IAM-REL-007` existing | Preflight staging Worker version, D1 schema, Access, rollback and production unchanged | **NOT_RUN for MFA deploy** |

**Owner/security decisions required before code/migration:** (i) role-based vs all-user enforcement and onboarding exception policy, (ii) separate challenge TTL and throttle thresholds, (iii) Worker secret/KMS ownership, rotation and recoverable key backups, (iv) how existing sessions are invalidated at enforcement, (v) factor count/recovery-code issuance/privileged reset approval, (vi) exactly which staging identities can perform real E2E. Until then do not deploy, migrate or change Access. Keep **ADR-0002 PROPOSED**, **SRS FROZEN**, `T-IAM-MFA-F2` **IN_PROGRESS / QA PARTIAL**.


## 2026-11-02 — Isolated first-factor challenge and assurance primitives (PR #50)

This is a **source-only foundation**, not a change to active login. New `lib/native-mfa-preauth.ts` supplies:

- `issuePendingMfaChallenge()`: cryptographically random 256-bit opaque token and digest-only D1 record proposal; separate `__Host-iaict_mfa_pending` HttpOnly/Secure/Lax five-minute cookie (must never be treated as the privileged `__Host-iaict_session`).
- `pendingChallengeEligibleForCas()`: read-only **candidate** filter bound to server-derived user/credential fingerprint, active account/role, valid time, unused record, attempts, lock and matching SHA-256 token digest. This filter can return TRUE twice: **it does not consume the challenge and never grants an admin session**.
- `nativeSessionMeetsAssurance()`: separate server-side predicate rejecting expired/revoked/disabled sessions and rejecting password-only/legacy sessions under explicit `MFA_REQUIRED` policy. Unknown policy fails closed. Legacy sessions can be permitted only when a trusted server-side `PASSWORD_ONLY` policy expressly applies.

**Important nuance:** The current `lib/native-auth.ts`, `worker.ts` and login/session API **do not import or call these helpers**. Consequently, all current native login behavior is unchanged. This is not an MFA bypass fix, not a challenge persistence implementation and not enrollment. `IAM-FUT-011` tests only isolated code with synthetic values; real `IAM-FUT-001` remains NOT_RUN.

**Required next stage before a feature toggle:** Implement a forward-only D1 challenge/session assurance model and prove transactional single-redemption semantics under race and failures. Password verification and full-session issuance must be separated; all Worker, API, CMS, account and role session-read paths must evaluate a trusted, centrally derived effective MFA policy including old sessions. A CAS result affecting zero rows must never grant a full session. Rate limiting, Origin/CSRF, factor key binding, actual OTP matching, recovery and authorized seven-role staging acceptance need independent evidence. When no factor/required key is available under a required policy, fail closed or use a specifically approved constrained onboarding/recovery route; never silently downgrade.

**Approval boundary:** owner/security review is needed before deploying a new MFA factor table, provisioning live keys, enforcing MFA on users, changing Access or production. ADR-0002 remains **PROPOSED**, SRS remains **FROZEN**. No Cloudflare resources altered by this test-only PR.


## 2026-11-02 — Two-pass hardening of isolated challenge/session assurance

[PR #51](https://github.com/ntdung-tds/iaict-portal/pull/51) reviews the isolated PR #50 primitives in two independent passes: (1) static analysis of trust boundaries against current native login/Worker/D1, and (2) adversarial runtime-input validation with synthetic objects/values.

**Finding (corrected in isolated source):** previously `!accountActive` and `!hasActiveRole` would treat the string `"false"` and numeric 1 as truthy. Token and digest regular-expression checks also depended on TypeScript string annotations that do not validate values arriving from JavaScript/D1. Both exported checks now require **literal boolean `true`** for account/role authorization flags; token and SHA-256 digests require **primitive strings**. Test-case `IAM-FUT-011` added four negative scenarios (20 total, [RUN-IAM-20261102-09](../qa/IAICT_TEST_RUNS.md)). Prior PASS evidence is retained as historical baseline, not retroactively reinterpreted.

**Future D1 integration rule:** D1 SQLite `is_active` and role flags often arrive as integer `0`/`1`. Call sites must normalize them explicitly from trusted D1 semantics (e.g. `is_active === 1`), **not** cast with TypeScript or rely on `Boolean(raw)`; unknown / ambiguous values fail closed. Never allow a request-provided flag to determine assurance. The read-only candidate result does not consume a challenge or grant a session.

No Worker or login route imports this module; this is not proof of hosted MFA. **ADR still PROPOSED, SRS still FROZEN.** No factor migration, live secrets, staging/production change or Owner authentication-policy approval.


## 2026-11-02 — Disposable D1 first-factor challenge CAS

[PR #53](https://github.com/ntdung-tds/iaict-portal/pull/53) adds a **standalone test** of a synthetic first-factor challenge's one-time SQL `UPDATE` in an ephemeral Miniflare 5 D1 database, with [QA `RUN-IAM-20261102-10`](../qa/IAICT_TEST_RUNS.md) and case `IAM-FUT-012`. On source SHA `15b9b84a072af824eb467f59783f9b73106887a4`, [CI #41424145730](https://github.com/ntdung-tds/iaict-portal/actions/runs/41424145730) observed **26/26 assertion groups PASS**, including **exactly one change among 16 simultaneous attempts** at the same challenge hash. The first CI failed an aggregate test-fixture count, preserved in history and corrected by counting only newly redeemed challenges.

The SQL checks active synthetic user, active role, current credential fingerprint **and revision** in a same-statement `EXISTS` clause, plus challenge owner, purpose, five-minute validity, unused status, attempt count, lock and replay CAS. This is stronger than trusting a prior SELECT; password rotation cannot be bypassed by restoring the previous fingerprint when the monotonic revision changes.

**Do not overgeneralize:** this is **one-row challenge CAS**, not an atomic cross-entity MFA login transaction. It does *not* prove all-or-nothing semantics for (challenge consume, verified TOTP counter advance, session issue, audit). In particular, a D1 `batch()` call is not automatically evidence that conditional zero-row writes prevent later session INSERT statements. Before approving actual MFA, implement/test a transaction pattern that makes success depend on BOTH verified factor step and challenge consumption and prevents session issuance under any lost race, mismatch, disabled user or D1 failure. If full atomicity cannot be established in the selected platform, stop and seek a reviewed design instead of best-effort separate writes.

Test-only tables are `synthetic_mfa_users` and `synthetic_mfa_challenges`; **no actual schema migration, OTP verification, session, secret, binding, Worker route, Access or production change**. ADR-0002 **PROPOSED**, SRS **FROZEN**, Owner/security approval not granted; `IAM-FUT-001` hosted MFA still NOT_RUN.


## 2026-11-02 — Pre-MFA revocation-and-restore security epoch review

A two-pass review of the **synthetic, isolated PR #53** test found a state-transition gap: checking only whether the account is currently active and has a role does not invalidate an already issued challenge after an access-revocation event if that access is restored within the five-minute TTL. Credential revision alone covers password rotation, **not** role removal or account deactivation.

The next synthetic Miniflare D1 test adds a monotonically increasing `security_revision` to the user and challenge table and validates equality in the *same* conditional challenge UPDATE. The revision is bumped on the test's role-revocation/disable events, and positive restored states **do not decrement it**. New assertions require previously issued challenges remain unusable after subsequent regrant/reactivation, with fresh current-revision challenges and unrelated users unaffected. This is **not** a production migration or a proof of real API enforcement.

**Future backend rule:** a reliable security epoch (or atomic deletion/revocation of outstanding challenges) must cover any security-relevant change, including account disable, role revoke, permission/policy change, administrative credential reset and factor rebind. The epoch increment must be coupled to the change under the authoritative D1 transaction semantics, not maintained only by a non-atomic application callback. The final OTP + factor replay counter + challenge + full-session transaction remains separately unproved.

This review **does not enable native MFA**, migrate real D1, modify login/Worker, change Access or grant Owner approval. ADR-0002 PROPOSED; SRS FROZEN.


## 2026-11-02 — Iterative synthetic D1 challenge CAS review

Continue a **bounded inspect → negative test → minimal correction → CI → independent re-review** loop on `IAM-FUT-012`, without turning it into an unbounded requirement or a runtime orchestrator. After prior PR #54, additional in-scope transitions still need synthetic tests: a **change in role scope despite the active-role bit remaining set**, and MFA factor reset/rebinding despite no password or coarse access-state change. The synthetic test now reads authoritative account security revision from D1 when issuing challenges rather than mirroring it in a JavaScript counter, and verifies old challenge invalidation across these changes.

The security epoch must advance on **all future real security-relevant changes**, be part of the authoritative transaction and be checked when consuming a challenge. A synthetic unit cannot prove real event coverage. Iteration ends when documented distinct checks find no further actionable issue *within the local challenge CAS scope*, all final-head gates pass, and real MFA remains not run. Never characterize a passing unit or this loop as proof of full OTP/session atomicity, remote D1 correctness or perfect security.

No real IAM user, Worker, Access, D1 binding/migration, MFA secret or production deployment changed. ADR PROPOSED; SRS FROZEN.
