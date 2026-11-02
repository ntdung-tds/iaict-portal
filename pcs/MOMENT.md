# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 16 · CMS-08/S5 two-pass pre-MFA D1 challenge CAS review**

- Active development branch `feat/staging-native-login-r2-20261030`: PCS **revision 15 canonical** after [PR #53](https://github.com/ntdung-tds/iaict-portal/pull/53) merged `f18a375c38d6e4e023f51358dd0f155c925a7d52`. **Revision 16 PROPOSED** in [PR #54](https://github.com/ntdung-tds/iaict-portal/pull/54) until green gates and readback.
- **Security review pass 1:** source review of synthetic D1 `IAM-FUT-012` found present-state role/user flags + credential revision are not sufficient to invalidate pending challenges after an access revoke → restore transition before TTL expires.
- **Security review pass 2:** local synthetic `security_revision` bound between challenge and account in the same conditional D1 UPDATE, incremented on synthetic role removal / account disable. Old challenges remain denied after role regrant/account reactivation. [RUN-IAM-20261102-11](../docs/qa/IAICT_TEST_RUNS.md) **29/29 synthetic D1 groups PASS**, **1/16** same-challenge concurrent write success, source SHA `3c32802b791ec8ac44dfbb76868cd960265318c4`, [portal CI #41426633634](https://github.com/ntdung-tds/iaict-portal/actions/runs/41426633634) local-workerd job SUCCESS.
- `IAM-FUT-012` existing QA case updated; **85 QA cases unchanged**. `CHG-IAM-ACCESS-20261102-10` append-only; ADR-0002 **PROPOSED**, SRS **FROZEN**, owner security approval **NOT GIVEN**. `T-IAM-MFA-F2` remains **IN_PROGRESS / QA PARTIAL**.
- **Limit:** synthetic security revision does not exist in hosted IAM, no actual D1 migration, no OTP factor session/audit transaction, no live login/Worker/Access change. Real `IAM-FUT-001/002/004` **NOT_RUN**. HTTP 503 staging Issue #30 OPEN.
- QA images **NO_IMAGE_REQUIRED**, private [IAM evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). No source-code upload to Drive before Owner says “bàn giao”.

## Next precise action

Verify PR #54 final source SHA portal-ci and public staging; update living 85-case QA Doc and merge narrow synthetic test-only correction if green. Then **separately** test a true all-or-nothing OTP + factor counter + challenge consume + session issuance transaction before any hosted migration, real security-epoch enforcement or feature activation.
