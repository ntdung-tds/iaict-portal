# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 8 · CMS-08/S3 Worker crypto verification**

- `pcs/STATE.json` revision **8**, active `T-IAM-MFA-F2` **IN_PROGRESS**, QA **PARTIAL**; proposed by [PR #45](https://github.com/ntdung-tds/iaict-portal/pull/45) until merged to `feat/staging-native-login-r2-20261030`.
- **Observed execution:** exact helper `lib/mfa-secret-crypto.ts` bundled and run in isolated **local workerd 1.20261012.1**, compatibility date `2026-10-12`: **11/11 crypto checks PASS** at source SHA `23c0960dba63905dfcf90fff2309e81b78f6e838` in [CI #41389043762](https://github.com/ntdung-tds/iaict-portal/actions/runs/41389043762); [RUN-IAM-20261102-03](../docs/qa/IAICT_TEST_RUNS.md), case `IAM-FUT-009`. Earlier `IAM-FUT-008` Node unit 6/6 PASS at its own SHA. QA CSV now **82 cases**, not 82 passes.
- **Scope:** no deployed Worker, D1/R2, Access, real secret, MFA session or production change. Hosted secret binding, live factor table, replay CAS, key rotation/restore, recovery and 7-role authenticated acceptance **NOT_RUN**.
- **Architecture:** [ADR-0002](../docs/adr/0002-iaict-native-mfa-totp-staged.md) adds **PROPOSED** key lifecycle and minimal factor D1 contract, not a migration/approved SRS. SRS **FROZEN**, full source Drive handoff **DEFERRED** until “bàn giao”.
- Other tasks: KDF-S2 local workerd proof PARTIAL and architecture review pending; onboarding and R2 media PLANNED. No feature/flow/release ACCEPTED; PCS remains minimal pointer, [Checklist Moment](../docs/project/CHECKLIST_MOMENT.md), [Plan](../docs/project/PROJECT_PLAN.md), [Progress](../docs/project/PROJECT_PROGRESS.md) and QA records are detailed authorities.
- Repo PUBLIC, PCS `public_content_reviewed=false`; QA imaging **NO_IMAGE_REQUIRED**; private [IAM evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).

## Next precise step

Verify PR #45 final SHA CI + public read-only staging acceptance and living QA Google Doc case 82, then merge if clean. Review D1 factor contract and build an **isolated synthetic atomic replay CAS concurrency test** before any live MFA operation. Never change production or Access by default.
