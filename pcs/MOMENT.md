# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 3 · Active checkpoint CMS-08/S2**

- Canonical progress source for this development line: `pcs/STATE.json` revision **3**; branch `feat/staging-native-login-r2-20261030` is the intended merge target. Changes in this documentation PR are only proposed until merged; always verify actual branch HEAD and the current revision.
- PCS bootstrap [PR #40](https://github.com/ntdung-tds/iaict-portal/pull/40) **MERGED** at commit `5473d954e79aeeb673a5a8816fedcd158cc448cc`; no app, Cloudflare or production changes.
- **Active PCS task:** `T-IAM-KDF-S2` — historical IAICT checklist **CMS-08 / S2**, project plan **P0-B**; a bounded [PBKDF2 Workers test plan](../docs/qa/IAICT_KDF_BOUNDARY_PLAN.md) has been prepared. **Actual workerd tests NOT_RUN**, no Worker deployment, IAM changes or ADR approval.
- Other backlog: `T-IAM-ONBOARDING` ([Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37)) and `T-MEDIA-R2` ([Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39)) are both **PLANNED**, live E2E NOT_RUN. No feature, flow or release marked ACCEPTED.
- **Avoid duplicated management:** existing [CHECKLIST_MOMENT](../docs/project/CHECKLIST_MOMENT.md), [PROJECT_PLAN](../docs/project/PROJECT_PLAN.md), [PROJECT_PROGRESS](../docs/project/PROJECT_PROGRESS.md), GitHub Issues/PRs, 78-case QA CSV and test-run ledger remain the detailed operational sources. PCS stores only pointers and high-level progress.
- SRS `docs/requirements/SRS.md` remains **FROZEN / UNAPPROVED**; existing per-module `thaydoi.md` logs remain canonical. [Source-code handoff #38](https://github.com/ntdung-tds/iaict-portal/issues/38) deferred until explicit “bàn giao”.
- Repo **PUBLIC**: metadata must be PUBLIC-safe; `public_content_reviewed=false` means no privileged public-repo PCS operator authorization. QA images: restricted [Drive IAM evidence](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp); none created in this documentation batch.

## Next precise action

Perform a *locally isolated* synthetic Workers PBKDF2 boundary proof at 100000 and 100001 iterations (600000 only after a resource gate), record real runtime/error evidence on an immutable SHA and new QA Run ID, then review the proposed MFA/KDF ADR. This is not approval to touch live staging, D1, Access or production. Update PCS State and this Moment consistently after actual evidence.
