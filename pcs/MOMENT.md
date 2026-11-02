# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 10 · CMS-08/S3 isolated D1 CAS evidence**

- Canonical source: `pcs/STATE.json` revision **10**, proposed by [PR #47](https://github.com/ntdung-tds/iaict-portal/pull/47) until merged to `feat/staging-native-login-r2-20261030`. Check actual HEAD before resuming.
- `T-IAM-MFA-F2` remains **IN_PROGRESS / QA PARTIAL**. Actual **local Miniflare D1** `IAM-FUT-010` ([RUN-IAM-20261102-05](../docs/qa/IAICT_TEST_RUNS.md)) **15/15 assertion groups PASS**, 16 parallel same-counter writes with **exactly one** `meta.changes=1`; SHA `2bee360c3552e9dcfe60c94e7719b9d8ae7d33a5`; [CI #41393225236](https://github.com/ntdung-tds/iaict-portal/actions/runs/41393225236) workerd job success. Preliminary Miniflare v5 harness config failures were corrected and remain in CI history.
- **83 QA cases** (one new `IAM-FUT-010`, catalog READY != PASS). Earlier unit AES-GCM (6 tests) and local workerd AES-GCM (11 checks repeated twice) remain bounded PASS at their pinned SHA. No full product MFA acceptance.
- The D1 test creates an **ephemeral synthetic table only**: no migration, hosted D1 query, real OTP/TOTP matching, real key binding, MFA endpoint/session, recovery or role-based authorized E2E (**NOT_RUN**).
- [ADR-0002](../docs/adr/0002-iaict-native-mfa-totp-staged.md) **PROPOSED**, [SRS](../docs/requirements/SRS.md) **FROZEN**, per-module change log updated. Other tracked KDF-S2 IN_PROGRESS/QA PARTIAL; onboarding and R2 media PLANNED; no feature/flow/release ACCEPTED.
- [Checklist Moment](../docs/project/CHECKLIST_MOMENT.md), [Plan](../docs/project/PROJECT_PLAN.md), [Progress](../docs/project/PROJECT_PROGRESS.md) and append-only QA runs are detail authorities. QA screenshots **NO_IMAGE_REQUIRED**; restricted [IAM Drive evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).
- Staging public `/tin-tuc` intermittent 503 remains [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30); PR #46 staging attempt 1 FAIL and rerun PASS both preserved. Production/Access/Worker/D1 unchanged; full-source Drive handover only at Owner “bàn giao”.

## Next precise action

Verify **final** PR #47 CI plus public-only staging acceptance at exact HEAD; mirror `IAM-FUT-010` in the living Google QA Doc and merge if gates PASS. Before real MFA: independently review first-factor challenge, secure key binding, forward-only D1 factor migration, hosted replay/rate-limit and recovery with Owner/security approval.
