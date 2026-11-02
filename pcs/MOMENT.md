# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 6 · CMS-08/S3 foundation**

- Status: Proposed by [PR #43](https://github.com/ntdung-tds/iaict-portal/pull/43) until merged into `feat/staging-native-login-r2-20261030`. Verify HEAD and `pcs/STATE.json` revision 6 before resuming.
- Active task `T-IAM-MFA-F2`: **IN_PROGRESS**, QA **PARTIAL**. Unused AES-256-GCM seed envelope helper `lib/mfa-secret-crypto.ts`; 6/6 unit tests PASS at SHA `8355bcdcdc66ce55bede8eeee50a0a8a1b38bf57`, [portal-ci run #41386111393](https://github.com/ntdung-tds/iaict-portal/actions/runs/41386111393), [RUN-IAM-20261102-02](../docs/qa/IAICT_TEST_RUNS.md). This is **UNIT ONLY**, not real Worker proof.
- QA CSV **81 cases** (added `IAM-FUT-008`); `IAM-FUT-001` actual MFA enrollment/challenge/recovery **NOT_RUN**. No factor D1 migration, key provisioning/rotation, authenticated sessions or D1 replay protection.
- Other tracked tasks: `T-IAM-KDF-S2` remains IN_PROGRESS with previously verified local workerd 100000/100001 results; `T-IAM-ONBOARDING` and `T-MEDIA-R2` remain PLANNED. No feature, flow or release ACCEPTED.
- Detailed authorities: [CHECKLIST_MOMENT](../docs/project/CHECKLIST_MOMENT.md), [PROJECT_PLAN](../docs/project/PROJECT_PLAN.md), [PROJECT_PROGRESS](../docs/project/PROJECT_PROGRESS.md), QA CSV/Run ledger and Issue/PR. PCS is a minimal resume pointer, not a second test ledger.
- ADR-0002 PROPOSED; per-module `thaydoi.md` is canonical, SRS FROZEN. Production/Access/D1/Worker unchanged; no staging deployment or Cloudflare secret binding. Images **NO_IMAGE_REQUIRED**; source-code Drive handoff deferred until “bàn giao”. Repository PUBLIC, `public_content_reviewed=false`.

## Next action

Verify **final** PR #43 CI and read-only staging gate, mirror `IAM-FUT-008` in living Google QA doc; merge only after checks pass. Then choose security-reviewed factor schema and key lifecycle design; do not enable MFA or use real credentials yet.
