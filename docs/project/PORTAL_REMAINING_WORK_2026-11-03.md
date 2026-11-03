# IAICT Portal — source-to-requirements backlog after IAM pause

**Reviewed:** 2026-11-03 | **Owner directive:** pause IAM implementation, continue the broader Portal plan.  
**Observed branch baseline:** `feat/staging-native-login-r2-20261030` at `d7e582b20bc4be4aff097385189312952e9f0a38` before this PR.  
**Evidence:** [PCS moment](../../pcs/MOMENT.md), [project plan](PROJECT_PLAN.md), [QA catalog](../qa/IAICT_TEST_CASES.csv), [existing CMS test suite](../../lib/cms-articles-atomic.test.ts), [Issue #79](https://github.com/ntdung-tds/iaict-portal/issues/79).  
**Interpretation:** file existence = implementation evidence only; CI/mock PASS != hosted signed-in E2E. This is an initial scoped inventory, not a completed requirement-by-requirement acceptance matrix. The October 2026 17-section Portal outline is a referenced input; `docs/requirements/SRS.md` remains FROZEN/UNAPPROVED.

## Source and outstanding acceptance by module

| Module / requirement log | Current source evidence | Acceptance gap / next bounded task | Priority |
|---|---|---|---|
| 01 portal-ui | `app/(public)/page.tsx`, public layouts, responsive CSS, public Chromium smoke | Deep responsive/accessibility, navigation and broken links with live content, mobile devices, final copy/brand acceptance | P1 |
| 02 gioi-thieu | `app/(public)/gioi-thieu`, `chuyen-gia`, `doi-tac` | CMS create→publish→real page and metadata, empty states, expert/partner associations | P1 |
| 03 san-pham | `app/(public)/san-pham-nen-tang`, `app/api/public/products` | Published-only visibility, CRUD→public cache/SEO propagation, attachment/media gate | P1 |
| 04 giai-phap | `app/(public)/giai-phap-dich-vu`, `app/api/public/solutions` | Content/CTA flow, solution–product references, cross-screen QA | P1 |
| 05 chuyen-giao | `app/(public)/chuyen-giao-cong-nghe` | Live CMS content flow, inquiry entry, responsive/accessibility regressions | P1 |
| 06 dao-tao | `app/(public)/dao-tao-tap-huan`, `app/admin/course-sessions`, `app/api/public/courses` | Real registration/session/seat limit/cancel or conflict cases where supported; course data ownership and capacity integration | P1 |
| 07 du-an | `app/(public)/du-an`, `app/api/public/projects` | CMS project association, sort/filter, draft visibility and real page regression | P1 |
| 08 tin-tuc | `app/(public)/tin-tuc`, `app/admin/news`, `lib/news-scheduler.ts`, `lib/news-repository.ts` | End-to-end import→dedup→review→publish/revoke; failed feeds, scheduling lease and published state race; #16 closeout | P0/P1 |
| 09 lien-he-lead | `app/(public)/lien-he`, CMS `leads` module and `lib/cms-lead-flow.test.ts` | Authorized lead intake→assign→resolve, privacy/IDOR, audit, notification, export and CRM scope approval | P1 |
| 10 cms-workflow | `app/admin/content`, `app/api/admin/cms/articles`, `collection`, `revisions`, `lib/cms-articles-atomic.test.ts` | Targeted article input/cache guards in this PR; independent hosted CMS edit→preview→publish→revision/restore acceptance and #13 closure | P0 |
| 11 iam-access | Native auth, D1 roles, Access and prior synthetic/real-worker tests | **PAUSED by owner**; do not implement MFA, reset, role cutover or browser login in this phase; previous live E2E NOT_RUN | PAUSED |
| 12 media-r2 | Staging `MEDIA_BUCKET` binding / bucket; `media` D1 references | Upload/delete API, file signature and MIME policy, malware/threat controls, ACL, object lifecycle, rollback and hosted E2E; [#39](https://github.com/ntdung-tds/iaict-portal/issues/39) | P0/P1 |
| 13 seo-search | `app/(public)/tim-kiem`, `app/sitemap.ts`, `app/robots.ts`, public search modules | Live search correctness, published-only index, canonical/structured data, a11y, CWV/real Lighthouse and external index readiness | P1 |
| 14 platform-release | `worker.ts`, `cloudflare.config.ts`, `.github/workflows`, release guards | Reconcile base branch and 27 historic open PRs; #32 production auto-build safety; read-back/backups/rollback rehearsal and production NO-GO pending gates | P0 |

## Audit findings to prevent duplicate development

1. Existing CMS article/category route already includes D1.batch revisions/audits, optimistic token checks, editor publish guard; regression cases in `lib/cms-articles-atomic.test.ts`. Do not reimplement historical Issue #13 blindly. Confirm end-to-end and decide disposition with evidence.
2. News JWT issuer/audience/signature verification is implemented at `worker.ts` ingress via `lib/cloudflare-access-jwt.ts`; scheduler lease and publish-policy controls have source/test artifacts. Issue #16 is a *closeout/acceptance audit*, not proof the older vulnerability persists.
3. On 2026-11-03 GitHub showed **27 open PRs** (many historic Drafts), **9 open Issues**, and `main` vs feature branch divergence (**ahead 962, behind 80**). These are point-in-time counts, not outstanding unique feature count. Preserve history and classify before closure/merging.
4. Deployed staging Worker version as read back: `1b8cfe71-88ef-4e21-8937-4f8590daaba4` (2026-10-31), whereas the active development branch HEAD is newer. Production Worker `e7c703f7-fc4c-4313-b14c-0a2c94e0613d` (2026-10-15). Source/CI acceptance does not establish hosted feature rollout.
5. Baseline QA registry comprised **97 predominantly IAM cases**, plus two proposed CMS-ART cases in this PR. A new non-IAM suite is an incremental extension of the existing GitHub CSV/Run ledger, not a new competing tracker.
6. QA Access setup added 8 Cloudflare Access user IDs and 8 active staged D1 role profiles in the prior task, but **positive 8-role authenticated Chromium was not run**. IAM PAUSED; maintain least privilege and flag a future QA identity/offboarding cleanup review without doing IAM mutations now.

## Sequenced execution (scope and gates)

**B1 — Portal source/QA reconciliation (this PR):** this inventory; register focused CMS cases; preserve SRS; record implementation vs verified vs live gaps; no production deployment. Owner requested IAM pause.

**B2 — CMS/Newsroom functional acceptance:** finish article API payload privacy defenses (CMS-ART-001/002), add bounded test cases for article/category review state, preview/revision restore and Newsroom scheduler; run local CI and live public staging checks. Real hosted authenticated actions remain NOT_RUN until valid session/test access; do not invent PASS.

**B3 — Media R2** ([#39](https://github.com/ntdung-tds/iaict-portal/issues/39)): threat model and typed authorization contract, synthetic boundary tests; small upload workflow and read/delete lifecycle with controlled staging objects after approved destructive-test isolation.

**B4 — Training, lead and CRM:** independently reviewed requirements for session registration and lead assignment; test resource-level authorization; minimal vertical slices with contract/DB, E2E and privacy evidence.

**B5 — Public quality:** verify all published routes, SEO/index, accessibility and responsive/mobile. Existing public Chromium smoke is a baseline, not complete UX/UAT.

**B6 — Release preparation:** deployment SHA and branch convergence, protected path policy, DB/R2 backup+restore drill, logs/alerting, QA evidence and UAT ND01–ND10. Separate owner approval before production; source archive on Drive only after explicit “bàn giao”.

## Source of truth / gates

- **Tasks:** [Issue #79](https://github.com/ntdung-tds/iaict-portal/issues/79) and existing specific issues; avoid duplicate task systems.
- **Requirements:** each affected module `thaydoi.md`; no baseline `SRS.md` editing without owner “chốt”.
- **QA:** `docs/qa/IAICT_TEST_CASES.csv` + immutable run sections `IAICT_TEST_RUNS.md`; tests labeled local synthetic vs actual public vs genuine authenticated.
- **Evidence media:** private [Drive QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp); no screenshots in GitHub.
- **No IAM mutations** during pause; no production, no automatic SRS sync or final handoff.
