# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 15 · CMS-08/S5 isolated D1 preauth challenge CAS**

- **Canonical PCS:** `pcs/STATE.json` revision **14** after [PR #52](https://github.com/ntdung-tds/iaict-portal/pull/52) MERGED at `c11ac258cbdd52e16ebfa2aebda2b8af4e3ebdbe`; revision **15 proposed** in [PR #53](https://github.com/ntdung-tds/iaict-portal/pull/53) until merged and read back.
- `T-IAM-MFA-F2` remains **IN_PROGRESS / QA PARTIAL**, owner approval **NOT GIVEN**. New `IAM-FUT-012` [RUN-IAM-20261102-10](../docs/qa/IAICT_TEST_RUNS.md): disposable Miniflare D1 synthetic challenge single-row CAS **26/26 assertions PASS** and **1/16** concurrent same-token attempts accepted on SHA `15b9b84a072af824eb467f59783f9b73106887a4`, [CI #41424145730](https://github.com/ntdung-tds/iaict-portal/actions/runs/41424145730) local-workerd job success. Initial CI [#41423994454](https://github.com/ntdung-tds/iaict-portal/actions/runs/41423994454) failed in aggregate fixture count and remains recorded; corrected and rerun.
- **85 QA cases**, with new P0 security case `IAM-FUT-012`; earlier `IAM-FUT-011` 20/20 local Vitest PASS, `IAM-FUT-010` local factor replay CAS PASS. All three are **synthetic/local only**. `IAM-FUT-001/002/004` hosted login/recovery/role E2E **NOT_RUN**.
- The CAS verifies account status, active role, credential fingerprint and revision *inside one SQL UPDATE* against synthetic D1. **It does not prove atomic OTP step + challenge consume + session issuance**; no real OTP/keys/session/audit or D1 migration is present; existing login and Worker unaffected.
- [ADR-0002](../docs/adr/0002-iaict-native-mfa-totp-staged.md) **PROPOSED**, [SRS](../docs/requirements/SRS.md) **FROZEN**, `CHG-IAM-ACCESS-20261102-09` QA_ONLY. Cloudflare Access, staging/production Worker, remote D1 and R2 **not modified**. [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) public 503 origin still unresolved; no owner real MFA acceptance.
- QA images **NO_IMAGE_REQUIRED**; private [IAM evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). No Drive source handover without “bàn giao”.

## Next precise action

Check **exact final PR #53 SHA** portal-ci and anonymous read-only staging, sync 85-case living QA Google Doc, merge if both gates PASS. Next distinct security step: prove truly atomic cross-entity verified OTP + challenge + session, then seek explicit Owner/security consent for any real migration/key/enforcement. Do not claim single-row CAS as full MFA.
