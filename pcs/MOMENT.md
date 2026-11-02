# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 2 · Project implementation checkpoint**

> This file summarizes `pcs/STATE.json` revision **2**. Validate the current GitHub HEAD and whether [PR #40](https://github.com/ntdung-tds/iaict-portal/pull/40) was merged before treating it as canonical for the chosen project branch. Do not use this file as a second source of truth.

- Project: [IAICT Portal](https://github.com/ntdung-tds/iaict-portal), repository visibility: **PUBLIC**; public-only tracking metadata. No privileged public-repository PCS operation approved (`public_content_reviewed=false`).
- Baseline for this bootstrap: `feat/staging-native-login-r2-20261030`; active work is associated with [Draft PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36). Verify fresh HEAD and PR status when resuming.
- State schema: `pcs3.simple.v1`; phase: `IMPLEMENTATION`; **no task, feature, flow or release recorded as ACCEPTED**.
- Backlog (both **PLANNED**, HIGH-risk / Owner-controlled, live acceptance NOT_RUN): `T-IAM-ONBOARDING` ([Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37)) and `T-MEDIA-R2` ([Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39)). These are existing issues, **not** claims of a new feature or authorized production release.
- Requirements: `docs/requirements/SRS.md` is **FROZEN / UNAPPROVED**. Existing module-specific `docs/requirements/<module>/thaydoi.md` files are the canonical change logs. Do not introduce a duplicate PCS SRS ledger or synchronize SRS without a separate explicit Owner decision.
- QA: Keep `docs/qa/IAICT_TEST_CASES.csv`, `docs/qa/IAICT_TEST_RUNS.md`, actual CI/SHA and live staging evidence authoritative. QA screenshots/video belong in the project's private Drive QA folders, never GitHub.
- Source-code Drive handoff is **DEFERRED** until the Owner explicitly requests it ([Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38)).
- Staging/production: **UNCHANGED BY PCS BOOTSTRAP**. Do not infer current runtime condition or deployment approval from this checkpoint.

## Next action

Reconcile recent PR #36, Issues #37/#39, code and test-run SHA; choose one safe next task, then update PCS State and this Moment consistently. Use GitHub revision/blob concurrency checks; when a PR is required, distinguish a proposed checkpoint from the canonical merged state.
