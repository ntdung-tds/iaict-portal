# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 29 PROPOSED · CMS-08 role-browser QA**

- [PR #69](https://github.com/ntdung-tds/iaict-portal/pull/69) adds local Chromium UI navigation tests for 7 roles plus forbidden session (**8 added MOCK tests; 38/38 local Chromium PASS** on observed code SHA `eb395141aaa052d5136797e3876b240b710a6bcf`) and actual Playwright `page.goto()` protected-staging role menu and CMS dashboard checks. Two QA cases `IAM-USER-019/020`; catalog **89**; [RUN-IAM-20261103-02](../docs/qa/IAICT_TEST_RUNS.md) distinguishes LOCAL_CHROMIUM_MOCK PASS from real authenticated staging **BLOCKED/NOT_RUN**.
- [Restricted registry](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit) still documents 8 **disabled** `example.test` D1 fixtures with no password or Access subject. It has not been refreshed from live D1 this step. The connected Cloudflare management tool blocked Access application-management reads and no approved encrypted credential-vault or controlled dedicated test mailbox was available. **No account created, activated, or password saved**. Owner standing permission [PR #66](https://github.com/ntdung-tds/iaict-portal/pull/66) is already present; do not request it again.
- Changed only tests, CI and QA/PCS docs. No changes to Cloudflare Access policies, hosted D1, Worker login, staging deploy, production, SRS or secrets. SRS **FROZEN**, ADR-0002 **PROPOSED**; real 8-role E2E stays **NOT_RUN**. QA images **NO_IMAGE_REQUIRED** for local synthetic tests; private [QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).
- CI evidence on the code SHA is **pre-documentation**; exact-final-HEAD portal CI and staging public Chromium need to pass again before merge. Keep any first-round QA validation failures in run history: manual case automation reference and missing `thaydoi` entry fixed.

## Next precise action

Verify all four portal CI jobs and actual public staging Chromium for final PR #69 HEAD; fix and re-run if needed; merge on green. Then unblock controlled staging QA identities through secure vault + mailbox + legitimate Access onboarding and execute the private role-by-role Chromium suite; do not conflate local MOCK with live AUTH acceptance.
