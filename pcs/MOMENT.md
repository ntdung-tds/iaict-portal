# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 22 PROPOSED · PR #59 merged, actual TOTP local parity validated**

- [PR #59](https://github.com/ntdung-tds/iaict-portal/pull/59) **MERGED** on `feat/staging-native-login-r2-20261030` as `bdd0d2e353079496bc32a249a128b2fd95db3ed9`. PCS revision **21 canonical** after merge; revision **22 proposed** for this documentation handoff until merged.
- Existing P0 `IAM-FUT-013` [RUN-IAM-20261102-14](../docs/qa/IAICT_TEST_RUNS.md): actual `lib/totp.ts` bundled into **local Node** alongside disposable **synthetic Miniflare D1**; atomic challenge CAS → guard → factor CAS → guard → synthetic session/audit. Two review passes; rare random negative-code flake fixed; out-of-window RFC negative case added.
- Exact final PR head `17eabc0fa896eea531aa186160f607f6ee66ea21`: [portal CI #41457724289](https://github.com/ntdung-tds/iaict-portal/actions/runs/41457724289) **SUCCESS 4/4 jobs**, 27/27 local IAM-FUT-013 groups, 559/559 Vitest, 86-case QA registry. [Public staging #41457724115](https://github.com/ntdung-tds/iaict-portal/actions/runs/41457724115) **SUCCESS**, 21/21 Chromium and 24/24 anonymous GET; 0 observed 503 in this sample; Issue #30 remains OPEN.
- Synthetic concurrent results: **1/16** same challenge, **1/2** same factor OTP step accepted; **4 synthetic sessions + 4 successful audit events**. **NOT a real login, not hosted D1, no MFA deployment**.
- [Google living QA v2.0](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit) synced/read back with final merge. QA images **NO_IMAGE_REQUIRED**; [restricted folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). No source handover without explicit Owner “bàn giao”.
- Actual IAM MFA enrollment/login/recovery, hosted D1/key/epoch, Worker session assurance and authenticated 7-role E2E **NOT_RUN**; `T-IAM-MFA-F2` IN_PROGRESS / QA PARTIAL. ADR-0002 **PROPOSED**, SRS **FROZEN**, security Owner approval **NOT GIVEN**. No API, real user/credential, cloud secret, Access, R2 or staging/production Worker mutation.

## Next precise action

**Do not repeat PR #59.** Review real IAM D1 tables, credential revocation events, authoritative security revision, factor/challenge schema, server-derived session assurance, recovery and key lifecycle against the existing source. Produce a reviewable design + risk/rollback plan **without** creating a migration, deploying a Worker, enabling MFA or changing production. Require explicit Owner/security approval for those later actions. Document-only revision 22 handoff needs its own exact-head CI/public staging gate before merge.
