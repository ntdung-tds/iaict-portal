# IAICT Portal — staging QA identities & real-browser role acceptance
**Date:** 2026-10-31 · **Status:** PARTIAL / REAL AUTHENTICATED QA BLOCKED · **Issue:** [#34](https://github.com/ntdung-tds/iaict-portal/issues/34)

**Restricted Drive inventory:** [QA account registry & role matrix](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit?usp=drivesdk), [QA identities folder](https://drive.google.com/drive/folders/1q8-9hjgH_Rq9WKhv_rJpA1C3A8jB8lGO). No usernames/passwords other than synthetic QA addresses are permitted in repository and no secrets in Drive.

## 1. Observed provisioning

- **Eight account rows on staging D1 only** — `admin`, `admin2`, `editor`, `reviewer`, `viewer`, `news_admin`, `news_editor`, `news_reviewer`. `admin2` is a second user with `admin` role for conflicting-editor scenarios.
- Stage D1 `aa4a97e7-60c5-4da4-9f0b-d469ece811b4` verified as binding to `iaict-portal-staging`. Before: 2 existing accounts, 0 QA. After: 10 total (2 unchanged + 8 QA), 8 new role links, 8 `qa.fixture.provisioned` audit rows. `PRAGMA quick_check=ok`.
- Bootstrap was **direct D1 QA fixture provisioning**, not proof that the normal Admin API onboarding works. All 8 accounts **disabled (`is_active=0`), without password credential, without Access Subject, without native session**. They cannot be used to sign in now; this is intentional until controlled QA access exists.
- Synthetic fixture emails are on reserved `example.test`, not deliverable inboxes. Avoid spoofed or fake Cloudflare Access identities. For real onboarding replace/prepare separately authorized IAICT-controlled QA mailboxes.

## 2. Role-based read-only API matrix after real authentication

| Role | `GET /api/admin/cms/overview` | `GET /api/admin/cms/users` | `GET /api/admin/cms/collection?module=leads&limit=1` | `GET /api/admin/cms/articles` | `GET /api/admin/news/review?status=pending&limit=1` |
|---|---:|---:|---:|---:|---:|
| `admin` / `admin2` | 200 | 200 | 200 | 200 | 200 |
| `editor` | 200 | 403 | 403 | 200 | 200 |
| `reviewer` | 200 | 403 | 403 | 200 | 200 |
| `viewer` | 200 | 403 | 403 | 200 | 200 |
| `news_admin` | 403 | 403 | 403 | 403 | 200 |
| `news_editor` | 403 | 403 | 403 | 403 | 200 |
| `news_reviewer` | 403 | 403 | 403 | 403 | 200 |

These are **expected assertions**, not observed 7-role results. Each role must be authenticated through Cloudflare Access and bound to the matching D1 test account before claiming LIVE_AUTH PASS. All mutations require independent controlled acceptance; use no real customer record or production data.

## 2A. Standing approval to provision and retain QA identities (2026-11-02)

The IAICT owner has **explicitly authorized** project agents to provision, configure and retain reusable **staging-only** QA accounts, including controlled test mailboxes, native credentials and normal Cloudflare Access enrollment. **No separate repeat approval is needed solely to create test identities.** This supersedes earlier wording that passively waits for fresh owner permission but does **not** turn disabled `example.test` D1 fixtures into legitimate logins automatically.

**Reusable account lifecycle:** first search the restricted account registry; reuse an appropriate managed test identity; otherwise create one with a controlled inbox and legitimate Access membership. Record nonsecret user ID, mailbox, role, purpose, state, created-at, owner/run, expiry or next audit and **encrypted-vault item reference**, not a secret. Keep test credentials and recovery codes in an approved encrypted vault, separate by role, and retain for later permitted runs. At the end, revoke transient browser sessions and high-risk temporary grants; keep the reusable identity registry and stable accounts as appropriate. Deactivation is a security state, not deletion of evidence. Do not write passwords/Access cookies to GitHub/Drive/ChatGPT or claim storage success without vault confirmation.

**Constraints:** provisioning, activation and test data mutations occur only on IAICT-owned *staging* with reversible, auditable procedures. Do not spoof Access JWT, bypass edge policy, modify production accounts or use customer records. If the connected tools cannot provision a real deliverable mailbox, Access membership or secure vault entry, mark only that affected E2E test `BLOCKED` with exact missing dependency; keep running safe browser checks. This note is a *standing authorization*, **not a statement that any previously blocked real-role login has already passed**.

## 3. Real-browser QA procedure

1. Under the 2026-11-02 standing owner authorization, proactively provision/reuse real IAICT-controlled QA mailboxes and legitimate test Access memberships; no additional routine account-creation approval is required. Don't bypass/change Edge Access routes. Use app invitation flow to set a different strong password per test account; keep credentials in an approved password manager, never GitHub/Drive/plaintext test report.
2. Activate or configure the minimum relevant test subset with the owner's standing authorization via audited Admin UI/API (prefer real onboarding). Verify D1 role assignments and audit; never impersonate an identity or activate unrelated/production accounts merely to make tests green.
3. Use a **separate browser profile and private `storageState` per role** on an authorized isolated machine, outside the repo, file permissions `0600`; no CI storage/upload of real sessions.
4. For each role, run `IAICT_AUTH_ACCEPTANCE_APPROVED=staging-only IAICT_ACCESS_STORAGE_STATE=/private/path/role-state.json IAICT_EXPECTED_CMS_ROLES=<exact-role> npx playwright test --config playwright.staging-authenticated.config.ts`. The config hard-codes staging, refuses CI, and turns screenshot/video/trace off. Do not paste a real state file into an agent chat.
5. Record each role `RUN-IAM-YYYYMMDD-NN`: exact staging Worker, SHA, D1 migration, test ID, expected vs actual status; failed permissions require a `BUG-IAM-...` and independent retest.
6. For any **non-sensitive** visual/bug evidence, redact secrets and upload to private [QA Drive](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). No screenshots/trace/video in GitHub or CI. Authenticated sessions must never be photographed or exported.
7. Revoke temporary sessions and excess Access grants when safe; retain the reusable QA accounts and restricted nonsecret registry for future runs, disabling only where needed for a security test or risk control. Preserve identity IDs, secure-vault references, audit and QA history; do not discard accounts automatically.

## 4. Actual browser observations and blockers (2026-10-31)

- **LIVE_BROWSER PASS** — Cloudflare Browser Rendering Chromium at `/login`, mobile viewport 390×844: visible `Đăng nhập quản trị`, Email, Mật khẩu and Đăng nhập button after load.
- **LIVE_BROWSER BLOCKED (HTTP 429)** — repeated Rendering attempts for `/account/security`, `/admin`, `/api/admin/cms/users`; no screenshots saved.
- **REAL_ROLE_AUTH NOT_RUN** — no controlled mailbox, native credential or valid Access identity for any QA account. No claim of full login or RBAC pass.
- Existing GitHub CI Chromium browser tests with mocks and anonymous staging read-only acceptance remain separate evidence and are not substitutes for real signed-in 7-role browser testing.

## 5. Test case mapping
- `IAM-AUTH-017` — controlled activation/live login.
- `IAM-USER-017` — 7-role read-only browser permission matrix.
- `IAM-USER-018` — 2-admin concurrent edit conflict.
- Existing `IAM-USER-016`, `IAM-SESS-008`, `IAM-ACC-005`, `IAM-ACC-006` retain their prior scope.

**Project handover is not in scope.** Issue [#38](https://github.com/ntdung-tds/iaict-portal/issues/38) is DEFERRED and must not be activated until the user explicitly says `bàn giao`.


## 6. 2026-11-03 preflight — no usable signed-in test identity yet

**Owner authorization:** PR #66 permits the agents to create and retain staging QA accounts without seeking the same permission again. This does not create a deliverable inbox or valid Cloudflare Access identity automatically.

**Observed from existing restricted registry:** eight synthetic `example.test` QA rows were previously provisioned disabled, without native passwords, real Access subjects or sessions. This was a registry read, **not** a fresh hosted D1 query. No account was activated, modified or given a new password in this pass.

**External integration constraints:** connected Cloudflare management API is present, but Access-app read was blocked by platform tool safety; no approved encrypted password-manager connector was available to persist test credentials; no managed test mailbox/inbox was connected for actual onboarding. These are concrete tool/integration blockers, not a new Owner permission request.

**Testing progress:** [PR #69](https://github.com/ntdung-tds/iaict-portal/pull/69) adds true rendered Chromium `page.goto` checks to the authenticated staging-only Playwright suite and 8 local rendered-role regression tests. **IAM-USER-019 = LOCAL_CHROMIUM_MOCK** (passes are not real identity acceptance). **IAM-USER-020 = AUTHENTICATED STAGING NOT_RUN** until a legitimate `storageState` exists in protected local storage. See [RUN-IAM-20261103-02](./IAICT_TEST_RUNS.md). Separate 7-role + second Admin expected server status matrix remains UNVERIFIED.

**When ready:** reuse test identity or create IAICT-controlled deliverable mailbox; enroll in Access through normal protected flow, provision native credential through real audited onboarding, store password/recovery only in an approved encrypted vault; keep nonsecret stable user/role/vault references in Drive. Run the existing private Playwright config with a separate external chmod600 state per role. Do not weaken Access or upload credentials to GitHub, Drive, CI, screenshots or chat.

## 7. Live Cloudflare and D1 readiness audit — 2026-11-03

Previous Access management API blocker is **RESOLVED for read-only inspection**. Actual live staging reads confirmed **8 QA D1 rows / 0 active / 0 password credentials / 0 Access subjects**. Staging Access app has one allow policy scoped to **Cloudflare account members** and currently one Access user; no policy was edited. Cloudflare account has **no Email Routing destination or managed DNS zone** to establish independent project-owned QA mailboxes.

An account-level, encrypted Cloudflare Secrets Store named `iaict_staging_qa_credentials` was **created and confirmed EMPTY (0 secrets)**. **No password has been generated or saved**; test account onboarding and private browser state remain blocked by controlled inbox/Access identity lifecycle. Avoid inviting Cloudflare *account-wide* members as a shortcut to pass staging tests, and do not replace Access membership checks with unrestricted email allows. Owner standing authorization PR #66 already covers legitimate staging QA user creation. Run [RUN-IAM-20261103-03](./IAICT_TEST_RUNS.md) remains a preflight only. No production or D1 user modifications.

## 8. Next feasible QA identity preparation — 2026-11-03

Read-only Cloudflare Access provider listing verified **one IdP of type `cloudflare`**, no One-Time PIN identity provider. Existing staging Access allow policy is Cloudflare-account-member-only. A connected Outlook.com personal mailbox is available, and Microsoft's documentation allows `+tag` receipt on Outlook.com, but eight tagged addresses do **not** provide separate mailbox ownership or independent OTP factors. We have **not** enrolled them or exposed the owner's address in project records. Safely enabling real QA E2E would require project-controlled delivery identities and a reviewed staging-specific exact-email/OTP authentication path; do not create broad Access login-method allow rules or invite eight account-wide Cloudflare administrators. No new identities or credentials provisioned by this check.

A new non-hosted [IAM-AUTH-020](./IAICT_TEST_CASES.csv) integration test uses original D1 migrations and actual native PBKDF2/session functions to narrow backend implementation risk. See [RUN-IAM-20261103-04](./IAICT_TEST_RUNS.md). It is not a replacement for authenticated Chromium acceptance.

### Cloudflare encrypted store is not a password manager

The Cloudflare Secrets Store create API defines `value` as **write-only** and states the API **never returns** secret values. The empty `iaict_staging_qa_credentials` store does not meet the requirement to retrieve/reuse private test login passwords for role-based Chromium acceptance. It must remain empty until a specific service-bound, restricted secret-use case is approved. Do not fill it with unrecoverable QA credentials. For actual browser tests, connect an approved managed credential vault or an isolated QA browser workstation with private profiles. Reference: [Cloudflare Secrets Store](https://developers.cloudflare.com/secrets-store/).
