# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 12 · CMS-08/S5 isolated pre-MFA primitives**

- PCS `pcs/STATE.json` revision **12** proposed in [PR #50](https://github.com/ntdung-tds/iaict-portal/pull/50), not canonical until merged. Prior [PR #49](https://github.com/ntdung-tds/iaict-portal/pull/49) architecture review MERGED as `cc917d67d046f15cad4b58b8e679f83dfff90b80`.
- Task `T-IAM-MFA-F2` still **IN_PROGRESS / QA PARTIAL**. New `lib/native-mfa-preauth.ts` is an **UNIMPORTED** foundation: 256-bit opaque challenge, digest-only proposed record, distinct HttpOnly/Secure pending cookie, expiry/attempt/account checks and fail-closed server assurance predicate. Both the pending challenge eligibility and assurance guard are **NOT WIRED TO ACTUAL LOGIN/WORKER**. A candidate check is READ_ONLY, does NOT consume D1 challenge, verify OTP, mint a session or enforce MFA.
- `IAM-FUT-011` 16/16 Node/Vitest PASS at source SHA `aee436679d3efb76b13adb755fe5b58b560639ca`, [CI #41414835791](https://github.com/ntdung-tds/iaict-portal/actions/runs/41414835791), [RUN-IAM-20261102-08](../docs/qa/IAICT_TEST_RUNS.md). Overall Vitest **555/555 PASS** at this prior code SHA. **84 QA cases**; `IAM-FUT-001/002/004` real enrollment/recovery/roles **NOT_RUN**. No new role E2E approved.
- Change log `CHG-IAM-ACCESS-20261102-07`, ADR-0002 **PROPOSED**, SRS **FROZEN**. No login/session/API/Worker code changed, no D1 migration/binding, hosted secrets or Cloudflare Access/production mutation. Owner approval NOT GIVEN.
- Latest [Checklist Moment](../docs/project/CHECKLIST_MOMENT.md), [Plan](../docs/project/PROJECT_PLAN.md), [Progress](../docs/project/PROJECT_PROGRESS.md) and QA ledger are details. QA image **NO_IMAGE_REQUIRED**; [private IAM evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).
- Staging intermittent HTTP 503 [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) cause unconfirmed; keep monitoring and fail-closed release gate. Source Drive handover only after explicit “bàn giao”.

## Next verified step

Check PR #50 final SHA `portal-ci` and anonymous/read-only staging, update living Google Doc to 84 cases, merge only on clean gates. Next gated technical PR would implement real D1 challenge lifecycle and server-side session enforcement with coordinated old-session handling, approval and negative concurrency tests; never assume the isolated helper enforces live MFA.
