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
