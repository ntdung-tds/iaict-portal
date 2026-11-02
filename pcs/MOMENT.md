# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 21 PROPOSED in PR #59 · bounded actual TOTP helper local-parity proof**

- [PR #58](https://github.com/ntdung-tds/iaict-portal/pull/58) **MERGED** as `b30fcb841ba084b0fa22686269d61a3123e6be50`; PCS revision 20 canonical before this PR. [PR #59](https://github.com/ntdung-tds/iaict-portal/pull/59) is **QA-only**, not yet merged. Revision 21 is proposed until its final exact-head gates and merge are observed.
- `IAM-FUT-013` / [RUN-IAM-20261102-14](../docs/qa/IAICT_TEST_RUNS.md): the actual checked-in `lib/totp.ts` generator/matcher bundled into **local Node** and used before an isolated, disposable **synthetic Miniflare D1** all-or-nothing transaction. Existing D1 CAS/guard/session/audit SQL and negative/concurrent rollback coverage preserved. Two review passes fixed random negative-code flakiness and added deterministic out-of-window rejection.
- Tested **code/checkpoint SHA** `5e13f97da067f12c3d21de460092ecd37aa8298d`: [portal-ci #41456996101](https://github.com/ntdung-tds/iaict-portal/actions/runs/41456996101) SUCCESS **4/4 jobs**: **27/27 IAM-FUT-013 groups PASS**, 559/559 Vitest, 86-case registry. Same challenge **1/16** wins; two challenges same counter **1/2** wins; four *synthetic* success sessions and four matching audits.
- [Public staging #41456996063](https://github.com/ntdung-tds/iaict-portal/actions/runs/41456996063) SUCCESS: 21/21 public Chromium, 24/24 anonymous GET, 0 observed HTTP503/5xx/network errors in this sample. [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) intermittent 503 remains OPEN. After this PCS/doc update, **new final PR HEAD must be retested**.
- 86 QA cases, `IAM-FUT-001/002/004` live MFA/recovery/7-role E2E **NOT_RUN**; `T-IAM-MFA-F2` **IN_PROGRESS / QA PARTIAL**. No actual login/API/Worker, authoritative security epoch, hosted D1, migrations, secret keys, credential/user changes, Access/R2 or production deploy.
- SRS **FROZEN**, ADR-0002 **PROPOSED**, Owner MFA/security approval **NOT GIVEN**. No fake claim that module-level local pass enables MFA. Images **NO_IMAGE_REQUIRED**; private [QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). Whole-source Drive handover only when Owner explicitly says “bàn giao”.

## Next precise action

Verify [PR #59](https://github.com/ntdung-tds/iaict-portal/pull/59) **exact final HEAD** portal-ci (4 jobs) and public-only staging-acceptance; then allow narrow QA-only merge if both PASS. After merge, next scoped security design task is actual IAM factor/challenge/session schema + trusted account/security-revision changes and recovery, with Owner approval required before live migration, keys, Worker or MFA enforcement.
