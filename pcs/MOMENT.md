# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 13 · Two-pass security review of isolated pre-MFA guard**

- Canonical `pcs/STATE.json` revision **12** after [PR #50](https://github.com/ntdung-tds/iaict-portal/pull/50) MERGED as `1df08cd94f352b4e87223f0c4e4faf0ae0494ed2`; revision **13 proposed** in [PR #51](https://github.com/ntdung-tds/iaict-portal/pull/51) until merge and read-back.
- Two independent review passes: (1) source/architecture and actual GitHub diffs confirm the new helper is **not imported** by native login/Worker; (2) adversarial values reveal a type-coercion weakness for account/role booleans and token/digest fields. PR #51 now requires exact `true` and primitive strings, with four new negative tests under existing `IAM-FUT-011`.
- [RUN-IAM-20261102-09](../docs/qa/IAICT_TEST_RUNS.md) at exact source SHA `828d106029b75b73afb4ccf1c79c1e853c26a2c6`, [CI #41416918807](https://github.com/ntdung-tds/iaict-portal/actions/runs/41416918807): isolated `IAM-FUT-011` **20/20 Vitest PASS** (was 16), full suite **559/559 PASS**. **84 QA cases unchanged**. Initial QA gate failure due to missing catalog update is preserved in [CI #41416787752](https://github.com/ntdung-tds/iaict-portal/actions/runs/41416787752).
- `T-IAM-MFA-F2` still **IN_PROGRESS / QA PARTIAL**. The positive candidate filter remains READ ONLY, no D1 challenge consumption/OTP validation or full-session issuance; current native login remains password-based. Actual hosted MFA/recovery, 7-role E2E and policy enforcement **NOT_RUN**. [ADR-0002](../docs/adr/0002-iaict-native-mfa-totp-staged.md) PROPOSED, SRS FROZEN, change `CHG-IAM-ACCESS-20261102-08`, Owner security acceptance NOT GIVEN.
- Cloudflare Access, D1 staging/production, native login/Worker and deployed versions not altered in review. [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) intermittent 503 still OPEN. QA image **NO_IMAGE_REQUIRED**, private [IAM QA evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). Do not hand off source Drive until explicit “bàn giao”.

## Next precise action

Confirm final PR #51 portal-ci and public-only staging acceptance on exact head; sync 84-case living Google QA Doc and merge safe isolated correction if green. Then only an independently reviewed/approved D1 challenge transaction and all native session readers can establish real MFA; do not interpret the unit test as an MFA acceptance result.
