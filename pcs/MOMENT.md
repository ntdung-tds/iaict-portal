# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 4 · CMS-08/S2 local workerd evidence**

- Tracking source: `pcs/STATE.json` **revision 4**; proposed on [PR #42](https://github.com/ntdung-tds/iaict-portal/pull/42), with intended branch `feat/staging-native-login-r2-20261030`. Confirm merge + HEAD before treating this as canonical on that branch.
- Active task `T-IAM-KDF-S2` (**IN_PROGRESS**, QA **PARTIAL**). Isolated local workerd `1.20261012.1`, compatibility date `2026-10-12`, tested SHA `82380adafceaa239f24438ee85fa8ef10cc9d343`, GitHub Actions [run #41384536088](https://github.com/ntdung-tds/iaict-portal/actions/runs/41384536088), QA [RUN-IAM-20261102-01](../docs/qa/IAICT_TEST_RUNS.md).
- **Observed:** PBKDF2 100000 SUCCESS (256 bits / 11 ms), 100001 SUCCESS (256 bits / 12 ms). Single-sample runtime proof, **not** load benchmark. The supposed exact 100000 workerd hard cap is contradicted by this local test; do not generalize to all hosted versions.
- **NOT_RUN:** 600000, actual hosted Worker parity, signed-in role E2E, full MFA enrollment/recovery. No product `PBKDF2_ITERATIONS` change; [ADR-0002](../docs/adr/0002-iaict-native-mfa-totp-staged.md) remains PROPOSED.
- Other backlog: `T-IAM-ONBOARDING` (Issue #37), `T-MEDIA-R2` (Issue #39), both PLANNED, not accepted. No feature/flow/release accepted.
- Detailed checklist: [CHECKLIST_MOMENT](../docs/project/CHECKLIST_MOMENT.md), [PROJECT_PLAN](../docs/project/PROJECT_PLAN.md), [PROJECT_PROGRESS](../docs/project/PROJECT_PROGRESS.md); authoritative QA catalog is now **80 cases** (78 prior + 2 workerd boundary cases), run ledger and actual CI logs. No duplicate requirement ledger; per-module `thaydoi.md` remains source. SRS FROZEN.
- Repository PUBLIC: public-only metadata; `public_content_reviewed=false`. QA images in private [Drive IAM folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) only. This crypto QA required **NO_IMAGE_REQUIRED**. No staging Worker, D1, R2, Access or production mutation.
- Full source handoff to Google Drive remains DEFERRED until Owner explicitly says “bàn giao”.

## Next precise action

Check the **final SHA** on PR #42, ensure CI and public read-only staging acceptance PASS, synchronize living QA Google Doc with cases 79–80, then merge if no independent review blocker. Continue S2 architectural review without altering the existing 100000-iteration product contract. Real IAM and MFA acceptance remain blocked independently.
