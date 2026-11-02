# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 27 PROPOSED · CMS-08 / IAM-FUT-014 QA observation**

- [PR #67](https://github.com/ntdung-tds/iaict-portal/pull/67) applied **real committed** IAM source SQL 0001/0022/0023/0024 to a *disposable local Miniflare D1*, plus ephemeral test-only security-state, factor, challenge and session assurance columns. **No production/hosted migration or Worker/login code change.** New case IAM-FUT-014, QA **87**, [RUN-IAM-20261103-01](../docs/qa/IAICT_TEST_RUNS.md).
- Observed code HEAD `6a41f698906801f7c2a59ccf283d19794809fd9f`: [portal CI #41516228656](https://github.com/ntdung-tds/iaict-portal/actions/runs/41516228656) **SUCCESS 4/4**, security-epoch/policy local D1 **43/43**, Chromium local **30/30**; [public staging #41516228434](https://github.com/ntdung-tds/iaict-portal/actions/runs/41516228434) **SUCCESS**, real anonymous Chromium **21/21** and public GET **24/24** (0 sample HTTP 503; Issue #30 open). These tests are on the prior code SHA; a *new documentation HEAD* must be rechecked separately.
- Preserved initial test-only failures: multiline SQL `D1.exec` and synthetic session token double-hash, both fixed. Password/OTP verification, MFA factor encryption, real session reader integration, hosted D1 and 7-role authenticated E2E **NOT_RUN**. ADR-0002 **PROPOSED**, SRS **FROZEN**, Owner security rollout acceptance **NOT GIVEN**.
- Owner authorized staging QA identity provisioning/reuse PR #66; separate secured mailbox/Access/vault step still required before real login. Screenshots **NO_IMAGE_REQUIRED**; [private QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). No staging deploy or production change.

## Next precise action

After updating evidence, validate **exact final PR HEAD CI and Chromium staging**, fix any findings, then merge. Next separate task: try legitimate staging QA identity provisioning and real role E2E with secure vault and Access; never fake login or mark BLOCKED as PASS.
