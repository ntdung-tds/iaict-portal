# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 24 PROPOSED · PR #61 merged, IAM security design review closed**

- [PR #61](https://github.com/ntdung-tds/iaict-portal/pull/61) **MERGED** into active development as `c96737a3578672ced70b6d746d98894f700e8b2d`. Exact final PR head `4f7e1322b25438926a3057b7b0197c2c3c4eae81`: [portal-ci #41461155654](https://github.com/ntdung-tds/iaict-portal/actions/runs/41461155654) **SUCCESS**; [public-only staging #41461155651](https://github.com/ntdung-tds/iaict-portal/actions/runs/41461155651) **SUCCESS**.
- [Read-only MFA real schema/security review](../docs/iam/MFA_REAL_SCHEMA_SECURITY_REVIEW_2026-11-02.md) completed three focused rounds: actual tables and mutation sources; role/account/password/factor epoch race; key/recovery/rollback and Access **OR** native fallback configuration risk. Link and immutable Checklist Moment corrections were checked. `CHG-IAM-ACCESS-20261102-14` recorded; **no migration or new QA run claimed**.
- PCS revision **23 canonical** after PR61 merge; revision **24 proposed** by this handoff only. `T-IAM-MFA-F2` **IN_PROGRESS / QA PARTIAL**. Past `IAM-FUT-013` actual `lib/totp.ts` local synthetic proof **27/27** at PR59 remains historical, not live MFA. 86 QA cases; hosted D1, real factor/recovery/Worker/session-policy/7-role E2E **NOT_RUN**.
- ADR-0002 **PROPOSED**, SRS **FROZEN**, Owner security acceptance **NOT GIVEN**; Access policy not changed, production native-auth flag unverified, intermittent public staging 503 Issue #30 remains OPEN. No credential, D1, R2, Worker, Access or production modification. Evidence image **NO_IMAGE_REQUIRED** (private [QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp)).

## Next precise action

**Do not re-review or remerge PR #61.** Next separate QA-only local D1 task: exercise proposed epoch/assurance constraints *against the real schema baseline* with disposable data; test revoke/regrant, disable/reactivate, password/factor reset, old sessions and policy; preserve an independent security review. Real migrations, encrypted bindings, runtime login MFA and hosted/production deployment require explicit Owner/security approval.
