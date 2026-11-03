# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 41 · IAM PAUSED · Newsroom acceptance**

- Owner instruction: continue Portal/CMS, keep IAM development paused. No live QA identity changes, no Cloudflare Access or production writes, no SRS baseline changes and no final source-code Drive handoff.
- Development branch: `feat/staging-native-login-r2-20261030`, latest verified baseline merge `1838683499e10386fad9577b39bc465664fb3f72` (PR #80). Exact post-merge [CI](https://github.com/ntdung-tds/iaict-portal/actions/runs/41569009218) 4/4 PASS, 585/585 Vitest, 38/38 local Chromium. [Real public staging smoke](https://github.com/ntdung-tds/iaict-portal/actions/runs/41569009228) 24/24 Chromium and 24/24 HTTP PASS. Public staging is the older deployed Worker; newly merged CMS code is not yet deployed.
- Current [Issue #81](https://github.com/ntdung-tds/iaict-portal/issues/81): branch `test/newsroom-real-sqlite-lifecycle-20261103`. Real Newsroom POST, RSS parser, repository, original schema SQLite, manual review CAS, publication and provenance, public visibility and CMS archive. Actor and upstream RSS HTTP are mocked; no hosted auth E2E.
- Changed ingest route rejects malformed JSON/object/content-type with HTTP 400 and sets `Cache-Control: no-store` on private responses. No changes to publication rules, scheduler, IAM or migrations.
- Requirement log `CHG-TIN-TUC-20261103-01`. QA catalog 103 cases including CMS-NEWS-001..004. New `RUN-CMS-20261103-03` NOT_RUN until exact-SHA CI. Google Master QA must be synchronized after tests.
- PCS STATE revision 41; previous narrow CMS task DONE on code/CI (not hosted deployment). Three IAM tasks DEFERRED. Media R2 [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) remains next major workstream.

## Next precise action

Open Newsroom PR to the development branch. Run portal-ci and live public staging Chromium; detect → fix → retest. Append QA evidence by verified SHA, rerun final documentation commit, merge only when all required checks PASS. No new staging/production deployments. Authenticated Newsroom browser E2E stays NOT_RUN.
