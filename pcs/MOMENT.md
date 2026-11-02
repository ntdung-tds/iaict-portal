# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 7 · Post-merge security review**

- **Canonical:** `pcs/STATE.json` revision **7** on the reviewed project branch after this checkpoint PR is merged; verify HEAD before use.
- [PR #43](https://github.com/ntdung-tds/iaict-portal/pull/43) **MERGED** at `2f9cfa37e339af9b01521dc3ae403346f4ac54e9`; final [portal-ci #41386418466](https://github.com/ntdung-tds/iaict-portal/actions/runs/41386418466) and [public/read-only staging acceptance #41386418469](https://github.com/ntdung-tds/iaict-portal/actions/runs/41386418469) PASS.
- **Active task:** `T-IAM-MFA-F2`, IN_PROGRESS, QA PARTIAL. [IAM-FUT-008 / RUN-IAM-20261102-02](../docs/qa/IAICT_TEST_RUNS.md) — AES-256-GCM TOTP seed envelope **6/6 Node/Vitest UNIT PASS** at source SHA `8355bcdcdc66ce55bede8eeee50a0a8a1b38bf57`. No Worker runtime AES-GCM probe, D1 MFA factor storage, key provisioning/rotation, enrollment/replay/recovery or real-login acceptance; all **NOT_RUN**.
- **Dependency review:** isolated MFA-F2 test was incorrectly marked dependent on `T-IAM-KDF-S2` being ACCEPTED. That hard dependency is removed: KDF findings inform design but need not block unrelated crypto-unit development. Both workstreams retain independent security/Owner release gates.
- Prior `T-IAM-KDF-S2` remains IN_PROGRESS/QA PARTIAL: isolated local workerd PBKDF2 100000/100001 PASS in [RUN-IAM-20261102-01](../docs/qa/IAICT_TEST_RUNS.md); hosted parity and overall architecture decision pending. `T-IAM-ONBOARDING` and `T-MEDIA-R2` are PLANNED. **No feature/flow/release accepted.**
- Detailed status authority: [CHECKLIST_MOMENT](../docs/project/CHECKLIST_MOMENT.md), [PROJECT_PLAN](../docs/project/PROJECT_PLAN.md), [PROJECT_PROGRESS](../docs/project/PROJECT_PROGRESS.md), QA CSV **81 cases** and immutable run ledger. [Living Google Doc](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit) synchronized.
- Read-only Cloudflare deployment verification 2026-11-02: staging version `1b8cfe71-88ef-4e21-8937-4f8590daaba4`, production version `e7c703f7-fc4c-4313-b14c-0a2c94e0613d`, both unchanged since historical baseline. No deployment or live mutation for this review.
- SRS remains **FROZEN / UNAPPROVED**; ADR-0002 **PROPOSED**; module `thaydoi.md` is the requirements change authority. Public-only repository metadata; `public_content_reviewed=false`. QA images: private Drive, review requires **NO_IMAGE_REQUIRED**. Source handoff to Drive only on “bàn giao”.

## Next precise action

Review a minimal key-lifecycle proposal (secret binding, key versioning, rotation and restore) and pending/active D1 factor schema with replay-safe CAS and security/Owner gate; validate AES-GCM under targeted workerd separately if needed. Do **not** infer permission to create MFA factors, deploy Worker, remove Access, migrate D1 or change production.
