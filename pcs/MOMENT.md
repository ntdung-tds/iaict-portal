# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 20 proposed · synthetic multi-entity MFA transaction proof MERGED**

- [PR #57](https://github.com/ntdung-tds/iaict-portal/pull/57) **MERGED** into `feat/staging-native-login-r2-20261030` as `6f4b6ee2db41432344ebed64e92016b0e9608fee`. PCS **revision 19 canonical** after its merge, **revision 20 proposed** in this small documentation handoff PR until merged.
- `IAM-FUT-013` [RUN-IAM-20261102-13](../docs/qa/IAICT_TEST_RUNS.md) verifies **LOCAL_MINIFLARE_D1 only**: synthetic HMAC-SHA1 verified code, D1.batch challenge CAS and factor replay CAS each guarded by a SQL `CHECK(changes()=1)`, then synthetic session and audit. [Final portal CI #41442739799](https://github.com/ntdung-tds/iaict-portal/actions/runs/41442739799) **SUCCESS all 4 jobs** (20/20 D1 assertion groups, 559/559 Vitest, 86 QA cases); [public staging #41442739686](https://github.com/ntdung-tds/iaict-portal/actions/runs/41442739686) 21/21 Chromium, 24/24 GET PASS, no observed 503 in that sample.
- Synthetic proof: 16 requests sharing a challenge produce **1** complete transaction, 2 challenges sharing factor/TOTP step produce **1**, after intentional failures on session or audit INSERT all previous writes rollback. **4 synthetic successful sessions and 4 matching audit rows**. No real session cookie/account/OTP factor was created.
- **86 QA cases**; [Google QA v1.9](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit) synced and read back. Historic `IAM-FUT-010/011/012` remain local only. `IAM-FUT-001/002/004` hosted E2E **NOT_RUN**. `T-IAM-MFA-F2` still **IN_PROGRESS / QA PARTIAL**.
- ADR-0002 **PROPOSED**, SRS **FROZEN**, Owner security approval **NOT GIVEN**. No real `lib/totp.ts` integration, hosted D1 schema, encrypted secret binding, recovery, session assurance middleware or Worker, Access, R2, production modifications. [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) intermittent 503 remains OPEN.
- Evidence images **NO_IMAGE_REQUIRED**; private [QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). Source-code Drive handover only with explicit Owner “bàn giao”.

## Next precise action

**Do not reopen PR #57**. Next independent design/testing task: prove parity with actual `lib/totp.ts` in a safe local harness; assess real IAM factor/challenge/session schema with authoritative security-epoch updates and recovery before proposing D1 migration or activation. MFA enforcement on actual login/session/Worker and authorized seven-role E2E still require separate Owner/security approval.
