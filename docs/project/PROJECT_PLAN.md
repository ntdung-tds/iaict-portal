# IAICT Portal — PROJECT PLAN (WORKING / NOT OWNER-APPROVED)
**Plan ID:** `PLAN-IAICT-20261031-01` · **Date:** 2026-10-31T19:46:47+07:00 · **Baseline for planning:** source HEAD `a6afff7e`; [Checklist Moment](CHECKLIST_MOMENT.md) is the live execution pointer. **Scope proposals in uploaded IAM v1.2 are not approved SRS.**

## Goal and order
Safely complete IAICT-developed CMS/IAM foundations on staging, prove real-role authorization, then extend R2 media and CRM permission scopes. Keep production and Access untouched absent explicit approvals. No fabricated deadlines; dependencies govern sequence.

| Phase | Scope | Priority / dependencies | Definition of Done / evidence | Current |
|---|---|---|---|---|
| P0-A | Preserve current secure staging release, rollback, QA docs and requirement logs | NOW; read-only first | exact Worker SHA/version, CI, 24 migrations/quick_check, Access, QA run, private evidence URLs | Foundation documented; current release not final IAM |
| P0-B | KDF compatibility and Auth architecture ADR | before modifying password hash design | controlled 100k/100001/600k worker test with synthetic inputs; measured results; reviewed migration-compatible ADR | IN_PROGRESS (local workerd 100000/100001 PASS at observed SHA; 600000 and live stage NOT_RUN, ADR review pending) |
| P0-C | MFA enrollment/challenge/replay/recovery, Admin step-up | after P0-B/ADR | encrypted secret, atomic replay guard, recovery controls, threat model, negative tests, real E2E | IN_PROGRESS (isolated AES-GCM unit + local workerd 11/11 PASS only; D1 factor and MFA full flow NOT_RUN) |
| P0-D | Fine-grained permissions and resource/tenant/CRM scopes | design independently; before Access cutover | shared policy at API/DB, no IDOR/privilege escalation, revoke immediacy, role × action × scope × state tests | NOT_STARTED |
| P0-E | Genuine 7-role staging QA and 2-admin race test | verified IAICT QA mailboxes+Access+password vault; no counterfeit | live authorized Chromium role matrix, 409 races, actual QA runs/Drive evidence | BLOCKED [#34](https://github.com/ntdung-tds/iaict-portal/issues/34) |
| P0-F | Trusted email verification/invite, forgot password, security audit, break-glass, privacy/backup controls | independent P0 gates before cutover | email delivery verification, secure recovery, approved runbooks/DSAR, backup restore | PARTIAL/NOT_STARTED |
| CMS-MEDIA | Secure CMS media in R2 staging | after threat model/permission contract | upload + MIME/magic-byte + malware policy + auth/ownership + cleanup/negative QA | IN_PROGRESS — B3.4 source-only bounded stream guard merged PR #93 / 650 local Vitest PASS; security policies PROPOSED, hosted upload NOT_STARTED [#39](https://github.com/ntdung-tds/iaict-portal/issues/39) |
| P1 | IAM groups/org, session console, access review, user CSV, CRM workflows | after core security/permissions | functional+security tests with owner acceptance | NOT_STARTED |
| P2 | SSO/SCIM/multi-tenant scaled features | needs approved business need | ADR+integration tests | DEFERRED |
| RELEASE | Production & Cloudflare Access cutover | **separate owner approval + P0 security gate** | staging real E2E / rollback / signed decision, production preflight | DEFERRED |
| HANDOFF | Final source Drive archive | **only exact “bàn giao”** | pinned full archive, checksum, clean restore, signoff | DEFERRED [#38](https://github.com/ntdung-tds/iaict-portal/issues/38) |

## Planning rules
1. Real work moves through GitHub Issue/PR (source of truth); this plan is priority/dependency projection, not duplicate task authority.
2. Every batch: explicit scope, affected `thaydoi.md`, impacted QA case IDs/Drive, risks, rollback and SHA.
3. `CHECKLIST_MOMENT.md` tracks last substep and pause/resume; `PROJECT_PROGRESS.md` records delivered/blocked evidence and current checkpoint. Both updated with each significant state change.
4. Uploaded `IAICT_IAM_v1_2_FRESH_DOWNLOAD.docx` provides 20 IAM proposals, KDF hard-cap risks and KDF-01–06 / IAM-T33–43 proposed tests. They must be reviewed, mapped and approved separately; not all are implementation requirements.
5. No scheduled completion date or % total project done asserted without defined scope and owner acceptance.

### CMS-08/S3 local D1 CAS proof (2026-11-02, QA-only)
- `IAM-FUT-010` / `RUN-IAM-20261102-05`: isolated Miniflare D1 SQL CAS, 15 check groups PASS; among 16 concurrent writes of the same synthetic TOTP counter, only one was accepted (source SHA `2bee360c`, [CI #41393225236](https://github.com/ntdung-tds/iaict-portal/actions/runs/41393225236)).
- **Nothing deployed**: schema only in disposable test D1; actual D1 factor table, validated TOTP candidate, real login, key provisioning, concurrency in hosted D1 and recovery still NOT_RUN.
- Continue risk-proportionate security review, not additional PCS infrastructure. ADR-0002 PROPOSED, no SRS freeze lift or Owner sign-off.

### CMS-08/S4 planned native MFA integration boundary (2026-11-02; design only)
- Source inspection exposed a future enforcement bypass risk: `authenticateNativePassword()` issues `iaict_auth_sessions` immediately on password success and the existing session readers have no MFA assurance. **Do not add an OTP UI on top of the current full-session issuance**.
- The [ADR-0002](../adr/0002-iaict-native-mfa-totp-staged.md) integration contract specifies restricted pre-MFA challenge, server-side MFA policy, challenge/credential binding and expiration, verified D1 CAS + session creation, rotation/recovery and revoke-on-policy-change. Link [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) and `CHG-IAM-ACCESS-20261102-06`.
- Prioritize challenge/session gate and tests before factor D1 migration/secret provisioning. Pending Owner/security decisions: which of seven roles must enforce, key/KMS provider/rotation, privileged recovery controls, existing-session cutover, test identities. Continue Access protection and SRS freeze; no production deployment or source Drive handoff.

### CMS-08/S5 — isolated pre-MFA challenge/assurance foundation (2026-11-02)

- [PR #50](https://github.com/ntdung-tds/iaict-portal/pull/50): add **unimported** `lib/native-mfa-preauth.ts`, 256-bit token + digest-only record, separate five-minute HttpOnly/Secure pending cookie, candidate-only expiration/account/credential validation and explicit server-side session-assurance predicate.
- QA `IAM-FUT-011`, `RUN-IAM-20261102-08`: local Vitest 16/16 PASS on SHA `aee43667`, full 555/555 PASS. 84 cases; real MFA login/recovery remains NOT_RUN.
- **No live integration** to `authenticateNativePassword`, `nativeActorEmail`, Worker, route, D1 or Access. Before any real activation: owner/security-controlled schema/keys, atomic first-factor challenge+OTP CAS+session transaction, old session policy, approved 7-role staging QA and rollback. SRS FROZEN, ADR PROPOSED.

### CMS-08/S5 — two-pass security correction, PR #51 (02/11/2026)
- Static pass: PR #50 helper remains unused by login/Worker, so no change to real authentication; identified runtime type coercion risk.
- Adversarial pass: strict literal boolean checks for account/role in challenge and session predicates; strict primitive strings for token/digest. D1 integer `0`/`1` needs trusted explicit normalization at integration.
- `IAM-FUT-011` extends existing case (no new case): 20/20 local Node tests PASS at SHA `828d1060`, full 559/559 Vitest; `RUN-IAM-20261102-09`. Still 84 cases, ADR PROPOSED, SRS FROZEN, real MFA NOT_RUN.

### CMS-08/S5 — isolated D1 challenge one-time redemption (2026-11-02)

- [PR #53](https://github.com/ntdung-tds/iaict-portal/pull/53): `IAM-FUT-012` synthetic Miniflare v5 D1 user/challenge tables, no hosted migration. SQL-only conditional challenge UPDATE checks owner, purpose, TTL, lock/attempts, active account/role and current credential fingerprint **plus revision** in one statement. 16 concurrent attempts yielded one change; 26 checks PASS at SHA `15b9b84a`, [CI #41424145730](https://github.com/ntdung-tds/iaict-portal/actions/runs/41424145730).
- Scope **LOCAL_D1_CAS_ONLY**: no actual factor or session, OTP check, audit, or all-or-nothing cross-table transaction. Prior initial aggregate fixture-count CI fail preserved. QA registry **85 cases**; ADR PROPOSED, SRS FROZEN.
- Before real MFA route: select and prove a transaction design preventing any session issuance on a lost challenge or TOTP CAS race. Owner/security policy, key management and forward-only migration approval required.

### CMS-08/S5 — two-pass challenge revival audit (2026-11-02)

- [PR #54](https://github.com/ntdung-tds/iaict-portal/pull/54) review found a synthetic D1 state-transition issue: challenge minted before role/account revocation may become eligible again when current role/active bit is restored before expiry.
- Synthetic monotonic `security_revision` incremented by revoke/disable events and checked inside the challenge CAS UPDATE prevents revival. `IAM-FUT-012` extends existing case with regrant/reactivation/stale-revision negatives: 29/29 local groups PASS, 1/16 same-token writes accepted. **85 QA cases unchanged**.
- This revision **does not exist in actual IAM/D1**. Before implementation, authoritative role/account/policy revocation must atomically invalidate outstanding challenges; independently prove factor counter + OTP + session transaction. ADR PROPOSED, SRS FROZEN.

### CMS-08/S5 — bounded iterative local D1 challenge CAS review (2026-11-02)
- [PR #55](https://github.com/ntdung-tds/iaict-portal/pull/55) continues a **review → negative-test → fix → re-review** loop of `IAM-FUT-012` until no new **in-scope** issue in independent checks. Added role-scope changes with active role bit still true and factor-reset without password change; challenge seed now reads current user security revision from D1 rather than duplicated JS state.
- Local D1 CI first source SHA `b80fb136`: 31/31 groups PASS, 1/16 same-token success; 559/559 Vitest PASS, **85 QA cases unchanged**, `RUN-IAM-20261102-12`. Close only on exact final-head CI + public staging PASS, no unaddressed P0/P1 finding in local CAS, with real MFA explicitly NOT_RUN.
- The loop is not a perpetual scheduled agent, does not modify live D1 or guarantee universal security, and does not replace full verified OTP/factor/challenge/session atomic transaction review. SRS frozen, ADR proposed.

### CMS-08/S6 — isolated cross-entity MFA atomicity proof (2026-11-02)

- [PR #57](https://github.com/ntdung-tds/iaict-portal/pull/57) adds test-only `IAM-FUT-013`: synthetic TOTP verified with locally generated HMAC-SHA1 seed; a **single D1.batch** containing challenge CAS + SQL CHECK guard, factor counter CAS + CHECK guard, synthetic MFA session and audit. Zero-row CAS MUST raise SQL error inside transaction; otherwise post-commit JS checks cannot prevent session issuance.
- Initial local workerd results: **20/20 assertion groups PASS**, **1/16** same-challenge full transactions, **1/2** different challenges at same factor time step; late session/audit constraint errors prove rollback of both earlier CAS writes. Synthetic sessions/audits count **4/4**. [CI #41442058049](https://github.com/ntdung-tds/iaict-portal/actions/runs/41442058049).
- QA **86 cases**, real MFA/recovery/7-role hosted E2E NOT_RUN. This proof is not the actual TypeScript TOTP module nor real schema/keys/sessions. Require Owner security decision before any hosted D1 migration/enforcement; SRS FROZEN, ADR PROPOSED.

## Owner priority override — 2026-11-03 (non-IAM Portal delivery)

The owner explicitly **PAUSED IAM** and directed execution of the broader Portal roadmap. The older P0 IAM queue above remains historical/planned and must **not** be automatically resumed. Prioritize: **B1 source audit and backlog** ([inventory](PORTAL_REMAINING_WORK_2026-11-03.md), [Issue #79](https://github.com/ntdung-tds/iaict-portal/issues/79)) → **B2 CMS/Newsroom integration acceptance** → **B3 CMS Media R2** ([#39](https://github.com/ntdung-tds/iaict-portal/issues/39)) → **B4 training + contact/lead/CRM** → **B5 public UX/SEO/accessibility** → **B6 release readiness and UAT**. Work in reviewed small batches with real tests, no assumed completion, no production deployment. IAM tasks are DEFERRED while paused, their existing safety controls stay enabled; no SRS synchronization or final source Drive handoff.
