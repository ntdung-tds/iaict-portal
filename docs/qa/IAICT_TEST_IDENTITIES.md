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
