# CMS-08 / MFA-F2-F3 — Review of REAL IAM schema, security epoch, session assurance and recovery
**2026-11-02 · Design/review ONLY · CHG-IAM-ACCESS-20261102-14 · Issue #37**
**Decision:** PROPOSED / OWNER SECURITY ACCEPTANCE PENDING. **SRS FROZEN.**
Scope: inspect exact committed source at `caab71d0fd54edabacf5a59296440b7d88aea2e3` (merged PR #60) and formulate an approval-ready, minimum-change contract. **No D1 migration, Worker/session/login code, secret, user or Cloudflare Access modification is authorized by this review.**

## 1. Proven baseline vs missing guarantees

| Real source (existing) | Observed contract | MFA integration gap |
| --- | --- | --- |
| [0001_core.sql](../../cloudflare/migrations/0001_core.sql) | `admin_users(id,is_active,updated_at)`, `admin_user_roles(user_id,role_id)`, `roles`, `audit_logs` | No authoritative monotonic **security revision**; updated_at is a content version, not a cryptographic revocation epoch |
| [0023_iaict_auth_pbkdf2_workers.sql](../../cloudflare/migrations/0023_iaict_auth_pbkdf2_workers.sql) | `iaict_password_credentials_v2(user_id,salt,password_hash,iterations,updated_at)`; exact 100000 PBKDF2 iterations | No credential revision field; do **not** derive security epoch solely from timestamp, salt/hash or application memory |
| [0022_iaict_native_auth.sql](../../cloudflare/migrations/0022_iaict_native_auth.sql) | `iaict_auth_sessions(token_hash,user_id,created_at,expires_at,revoked_at)`; login attempts table | No `auth_level`, `mfa_verified_at`, or issue-time security revision; currently password-only success can mint full session |
| [native-auth.ts](../../lib/native-auth.ts), [login](../../app/api/auth/login/route.ts) | `authenticateNativePassword` verifies credential then inserts full session; route sets `__Host-iaict_session` | Must split password verification from session issuance **for an MFA-required account**; challenge is never a session |
| [worker.ts](../../worker.ts), [session route](../../app/api/auth/session/route.ts) | Protected path accepts Access JWT or valid native-cookie fallback; `nativeActorEmail` validates D1 token; session GET derives roles | Native fallback and **every** session reader need centrally enforced server-derived assurance. Do not remove/relax Access |
| [CMS user mutations](../../app/api/admin/cms/users/route.ts), [password rotation](../../app/api/account/password/route.ts), [activation](../../lib/native-activation.ts), [self sessions](../../app/api/account/sessions/route.ts) | Role/status changes and password rotation already revoke native sessions; activation uses an atomic invite/credential path | Future pending challenges, factor state and policy must invalidate in **same transaction** where relevant; revoking sessions alone is insufficient after revocation/regrant |
| [native-mfa-preauth.ts](../../lib/native-mfa-preauth.ts), [totp.ts](../../lib/totp.ts), [isolated D1 proof](../../scripts/mfa-atomic-d1/run-local.mjs) | Unimported preauth/session predicates, actual TOTP matcher, synthetic challenge+factor+session+audit CAS | 27/27 local D1 assertions (RUN-IAM-20261102-14) do **not** prove real schema, hosted D1, security epoch, encrypted keys, recovery or live login |

**Classification:** these are **design gaps before future MFA enforcement**, not claims that a currently deployed MFA implementation has been bypassed. Existing Access protection and native-login design are distinct security boundaries.

## 2. Minimal proposed additive storage model — **NOT executable SQL or migration**

| Proposed entity/extension | Minimum fields/invariants | Purpose |
| --- | --- | --- |
| `iaict_auth_security_state` | `user_id` PK/FK, integer `security_revision>=0`, `credential_revision>=0`, `policy_version>=0`; unique per user | Central authoritative, monotonic epoch, updated atomically with changes affecting authentication |
| `iaict_mfa_factors` | `factor_id` PK, `user_id` FK, `status` PENDING/ACTIVE/DISABLED, encrypted AES-GCM envelope+IV+`key_id`+AAD metadata, `secret_version`, `last_accepted_step`, revision, lock/attempt fields and timestamps | Only ACTIVE, correctly bound factor can satisfy TOTP; unique ACTIVE factor per user if policy chooses single TOTP |
| `iaict_mfa_challenges` | SHA-256 token digest PK, `user_id`, factor identifier, purpose, credential+security revisions, created/expiry/consumed, attempts, lock and CAS revision | 5-minute maximum, one use, invalid after any relevant epoch change; raw token only in HttpOnly secure pending cookie |
| Extension of `iaict_auth_sessions` | Server-only `auth_level` PASSWORD/MFA, `mfa_verified_at`, `security_revision_at_issue`, immutable policy snapshot ID or derivation guard | Old password-only sessions cannot silently become MFA-assured; no browser-controlled assurance flag |
| Recovery verifier rows | One-use verifier digest with strong secret hashing and individual identifiers/status, emergency reset approvals/audit, epoch bump | Recovery must not be email-only MFA bypass; use independent identity checks and dual control for privileged cases |

**Design review requirements:** decide whether the epoch and policy belong in one new table or an additive column on `admin_users`; avoid parallel authoritative copies. Define migrations/backfill, CHECK/UNIQUE/FK constraints, indexes, retention, bounded counter size and SQLite D1 column evolution in a later reviewed PR. No plaintext TOTP seed, raw recovery token, OTP, cookie, QR, pepper or master key in D1, GitHub, R2, Drive or logs. Staging and production keys must be independent. The existing synthetic `secret_hex` field is intentionally **test-only**, never production schema.

## 3. Required atomic invalidation points

| Event/entry point | Required effect before MFA enforcement |
| --- | --- |
| Password rotate/reset or first credential creation; activation redeem | Increment credential/security revision with credential write; revoke existing sessions and pending MFA challenges where applicable; immutable audit. Do not rely only on hash comparison |
| Admin deactivate/reactivate, role removal/regrant, **role scope elevation/reduction**, identity/email change | Increment security revision on every auth-relevant transition (including restoration), revoke old sessions/challenges, maintain existing last-admin protection and existing write CAS |
| Factor enroll/confirm, disable, reset, rebind/rotation, recovery consume | Increment security revision and factor version, invalidate pending challenges/sessions as policy requires, audit; one-time recovery consumption must be atomic |
| Policy change PASSWORD_ONLY → MFA_REQUIRED (and the reverse under controlled rollback) | Version policy and invalidate any conflicting sessions/challenges atomically; never treat missing policy as PASSWORD_ONLY by default for protected users |
| Session revoke-others/logout/admin revoke | Preserve current revocation semantics and audit; no requirement to increment a *global* epoch for ordinary single-session logout, but every MFA-sensitive reset must invalidate relevant challenges |

**Critical race invariant:** a challenge created before revoke/regrant or disable/reactivate must never be redeemed after restoration, even if account and roles are once again active. In the final transaction check **the authoritative** security revision and credential revision on current user plus bound challenge, not only their earlier application-side snapshots. A factor CAS must reject changed key version, inactive/locked factor, stale counter and mismatched owner. SQL affected-row guards must raise a failing statement *inside* the D1 batch before inserting a session; session+audit+factor+challenge commit all-or-nothing.

## 4. Runtime split and fail-closed assurance

1. Parse validated native password, throttle, check active account and effective role/policy **from the server**. For `MFA_REQUIRED`, **do not invoke the existing full-session issuer**. Create only a restricted pending challenge with a separate HttpOnly Secure cookie and generic continuation response. For an explicitly approved `PASSWORD_ONLY` policy preserve the reviewed behavior; no blanket exemption for privileged users.
2. On MFA completion, recheck challenge, account, current role, effective policy, credential revision, security epoch, factor version and attempts against current D1 state; verify TOTP via actual `matchTotpCounter` (or independently approved recovery). Use one transactional challenge CAS + checked factor CAS + **full session insert** + audit. If any guard fails, **no full-session cookie**.
3. A single server-owned assurance resolver used by Worker native fallback, `nativeActorEmail`, `nativeSessionPrincipal`, `GET /api/auth/session` and protected CMS/CRM APIs must demand `MFA` when effective current policy requires it. Legacy sessions with missing `auth_level` remain **not MFA**. Verify issue-time epoch against current value to reject pre-transition sessions. Access JWT handling must remain independently protected (no weakening).
4. On schema/key missing, unknown policy, malformed D1 booleans, stale epoch, revoked session or verification outage **deny MFA-protected native access**; don't silently downgrade to password-only. Preserve safe generic errors and log only redacted diagnostic IDs.

## 5. Migration, rollout and rollback decision gates

**Phase A (proposal, no execution):** decide policy/role coverage, update security ADR, approve key custody/rotation and independent recovery; design forward-only schema with backup/restore and safe idempotent backfill; dry-run on disposable data. Do not update frozen SRS without explicit “chốt SRS”.

**Phase B (requires explicit Owner/security authorization):** schema/backfill in isolated/approved staging, deploy fail-closed readers **before** enabling MFA requirements, instrument legacy/unknown-session rejection, test data recovery and additive rollback. Never disable Cloudflare Access to facilitate testing.

**Phase C (separate authorization):** account enrollment and recovery with protected staging inbox/vault, controlled migration to MFA_REQUIRED, negative race/replay/CSRF/IDOR/lockout verification and second-Admin + seven-role authenticated E2E. Production/cutover needs additional explicit approval.

**Rollback:** keep Access in place; reversible **configuration** may stop new native MFA activation, but must not silently reclassify MFA_REQUIRED accounts as PASSWORD_ONLY or restore old sessions. When policy or database is inconsistent, disable native fallback (fail closed), preserve audit and encrypted-factor records, roll forward with repair/restore plan and dual-control emergency recovery. Do not drop tables, discard keys or force account reset automatically. Migration rollback SQL is **not approved** by this document.

## 6. Review rounds, residual risks and planned test evidence

- **Round 1 — source/schema cross-check:** mapped actual tables 0001/0022/0023/0024, native session and admin mutation routes. Finding: no authoritative epoch, no MFA-assured session schema, session minted after password. Proposed minimal additive controls above.
- **Round 2 — adversarial state changes:** revoke/regrant; disable/reactivate; factor rotate while challenge pending; password rotate during verification; role scope change, old sessions, audit insert failure. Each demands an in-transaction revision/guard or fail-closed predicate.
- **Round 3 — deployment/rollback/custody:** no key binding, no approved recovery, no hosted D1 race proof and no authenticated role tests. Conclude **DESIGN ONLY**; do not close P0 MFA until separate proofs.

**Future P0 tests (all NOT_RUN on real IAM):** (a) 16 same-challenge and two cross-challenge OTP races on real schema; (b) account/role revoke then restore with stale challenge; (c) password and factor rotation after OTP verify; (d) duplicate session/audit failure atomic rollback; (e) old `auth_level=NULL` session denied under MFA_REQUIRED; (f) pending/unknown policy denial; (g) recovery-code one-time race, emergency reset and key-loss drill; (h) actual encrypted key binding and hosted Worker/D1; (i) real 7-role plus second-Admin E2E with Access kept enabled. Add QA IDs before execution and never mark them PASS based on synthetic proof.

**Owner decisions outstanding:** MFA-required role matrix, password-only transition exceptions, factor/recovery policy, security epoch storage, key rotation/KMS binding, hosted D1 migration and staging release gates. ADR-0002 remains PROPOSED; acceptance NOT GIVEN.
