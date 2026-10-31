# AGENTS.md — IAICT Portal (applies repo-wide)

> Shared working rules for ChatGPT, Codex, Claude Code, Gemini CLI, GitHub Copilot and other repository agents. Human user/sponsor direction and higher-priority safety/tool instructions always take precedence. Never treat this file as authorization to disclose secrets or deploy production.

## Read first (in order)
1. `docs/project/DRIVE_REGISTRY.md` — **single** project Drive root and subfolder URLs: https://drive.google.com/drive/folders/11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ
2. `docs/project/OPERATING_MODEL.md` — PMO-lite, source-of-truth, RACI, release and documentation policy.
3. `docs/qa/IAICT_TEST_MANAGEMENT.md`, `docs/qa/IAICT_TEST_CASES.csv`, `docs/qa/IAICT_TEST_RUNS.md` — QA rules and current known results.
4. `.agents/skills/iaict-project-management/SKILL.md` — portable execution workflow. Load its references as needed.
5. Current GitHub PR head/CI status and exact Cloudflare Workers/D1 state. Repository `README.md` contains older M0 baseline history: **verify its status against current runtime; do not assume old README milestones are current**.

## Hard boundaries
- **Production is not a test environment.** The production Worker `iaict-portal` must NEVER be deployed, migrated, deleted, or reconfigured without explicit human approval in the current task. Build/test/staging work is not implicit approval.
- Staging: `iaict-portal-staging`; GitHub branch for recent IAM work: `feat/staging-native-login-r2-20261030` (confirm active head). Cloudflare Builds HOLD guard must be restored immediately after a one-shot approved staging deployment. Use exact SHA pin, CI PASS and rollback readiness.
- Keep Cloudflare Access protecting staging `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*` until independent native IAM security acceptance and explicit owner approval. Never bypass or casually remove Access.
- D1 migrations must be **forward-only**; do not edit executed/frozen migrations. Verify state and backup bookmark before writing. Protect last-admin, race conditions, sessions, audit integrity and IDOR.
- No passwords, MFA codes, account recovery secrets, bearer activation links, cookies/JWT, personal data, credential exports or confidential Cloudflare config in GitHub, logs, prompts, screenshots, public Drive documents or CI artifacts.
- **QA screenshot/video/bug media belong ONLY in private Google Drive:** [QA root](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3), [IAM evidence](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). Do not commit images or upload them as GitHub Actions artifacts.
- Never claim PASS for tests that did not run, or for mocked-browser tests as a substitute for authenticated live staging. Preserve BLOCKED and NOT_RUN statuses.
- Do not change folder sharing, delete/move large sets, set retention policies, modify external accounts, or publish sensitive content without a specific task and permission check.

## Source-code transfer to Google Drive — exclusively on owner handover command
**Only the operation of exporting/uploading the complete project source code to Google Drive as a handover is on hold.** Do not perform it until the owner explicitly says "bàn giao". This restriction does **not** pause or delay routine software development, GitHub code commits/PRs, staging implementation/deployment under normal approvals, project management, task tracking, Google Drive document updates/organization, test cases, test account management, browser testing, sanitized screenshots/bug evidence, or other authorized routine work. Do not treat milestone completion as an automatic source-code-to-Drive trigger.

## Mandatory final full-source backup to Google Drive
Owner clarification 2026-10-31: full-source handover is DEFERRED. It must start ONLY after the owner explicitly says “bàn giao”; technical completion alone is not authorization. When instructed, the entire project including code must be uploaded to the private Drive Project Master. [Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38) is a DEFERRED instruction, not a release-blocking requirement. Destination [FINAL_HANDOFF](https://drive.google.com/drive/folders/1FPhc8qDloCwxSRxTq-X6i3t5b8DYkPaQ). Follow `docs/project/FINAL_HANDOFF_PLAN.md`; archive the exact approved release SHA and approved documentation, include manifest+SHA256, remove secrets/PII, verify upload/download and **clean restore from Drive**. Get human sign-off. A folder alone is not a backup. Do NOT initiate handover or export the final project before explicit “bàn giao” instruction. The owner may separately declare development complete; that does not authorize handover. Do not claim any final archive exists until explicitly executed and verified.

## Staging role-based QA accounts and real browser testing
- **Verified inventory:** 8 synthetic disabled staging D1 QA users for seven roles (plus second Admin), [private Drive registry](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit?usp=drivesdk), [role QA procedure](docs/qa/IAICT_TEST_IDENTITIES.md), [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34). Preserve disabled status until genuine controlled mailboxes and Access enrollment are ready.
- For any role-sensitive feature, design positive **and negative** tests with the appropriate role, not only Admin; use isolated real Chromium browser sessions on staging only after explicitly authorized QA login, record 200/403 matrix and cross-role IDOR. Never spoof Access or fake an authenticated result. Tests with mock responses must be labeled MOCK, live browser HTTP 429 is BLOCKED, absent role login is NOT_RUN.
- Store **only nonsecret account IDs/emails/status** in restricted Drive. Test passwords must live in an approved encrypted vault and session files must remain private on the authorized tester's machine outside the repository, never GitHub or Drive. After test revoke/disable, keep audit and run history.

## Working method
1. Confirm objective, boundaries, affected component, user value, project issue/requirement/ADR and baseline status. Group several **small related tasks**; split high-risk capabilities into separately tested stages.
2. Find existing folders/files by their exact ID first, then by metadata search. Do not duplicate project roots or create a second QA evidence repository.
3. Each code change: update or explicitly justify existing Test Case IDs, add negative/security coverage, run `npm run verify:qa`, TypeScript/build/Vitest/Playwright as applicable. Keep `docs/qa/` and living Google Doc aligned on approved changes; if Drive cannot be edited, record pending sync and never assert completion.
4. Changes affecting architecture, user identity, D1, access, backups, or production flow require written risk/ADR and rollback plan. No direct bypass of CI.
5. Staging deploy: verify pinned SHA + completed CI and staging gate, worker prev version, D1 migration integrity and bookmark, Access routes, R2 binding; deploy only staging; restore HOLD; read back state; record test run and release.
6. GitHub Issue/PR is source of truth for task and code; Drive for human approvals, document versions, QA media and backup. Do not duplicate authoritative state. Every report links issue/PR, SHA, CI, Worker, Drive evidence, and next blocker.
7. If blocked by tool/permission/rate limit, stop risky action, report current exact state and missing verification. Never invent Drive file URLs or tool success.

## Mandatory tabular QA results in each report
For every executed test batch, **present actual test results as a Markdown table** (not a prose-only summary), minimum columns: `Test case / hạng mục | Môi trường & vai trò | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Bằng chứng (URL)`. Add `Run ID`, `SHA/Worker`, `Defect ID`, and Drive image/folder links where relevant. Distinguish `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`, `NOT_APPLICABLE`; never inflate 533 unit tests into 533 manual role cases. CI and real Chromium tests must be identified separately. Use `NOT_CAPTURED` when no image exists. Finish with any blockers/next task. This is the **default user-facing format**, also for other AI agents.

## Mandatory test-result presentation — TABULAR REPORTS
- **Every test report to the IAICT owner MUST use a Markdown table** (also provide a structured table in the persistent QA document/ledger when practical), not prose-only verdicts or a stack of colored badges.
- Minimum per-case columns: `Case ID | Feature / scenario | Test layer & environment | Test role | Expected | Actual observed | Status (PASS/FAIL/BLOCKED/NOT_RUN) | Evidence / Defect link`. For large batches, group rows by workstream, with a concise summary table. Record exact Run ID, SHA, staging Worker and date in the table heading or adjacent caption; never invent evidence.
- Report authorized real-browser E2E separately from mocked/local Chromium and from D1-only checks. A test account fixture created in D1 does NOT count as a real role login; unavailable Access credentials mean NOT_RUN/BLOCKED, not PASS.
- **Drive activity continues as normal** for QA evidence, documents, role account registers, design files, reviews and regular project operations. **Do not upload ANY source-code files, code archives, Git bundles or source snapshots to Google Drive until the owner explicitly says `bàn giao`.** Continue all normal development and commits on GitHub, Drive documentation/QA media and project management without restriction from this rule. Code continues to be committed to GitHub as normal.

## Deliverable contract for every task batch
Report `Scope | Changed files/issues | Tests + exact results | Staging state | Evidence Drive URLs (or NOT_CAPTURED) | Production unchanged | Open risks | Next task`. When no deployment occurs, say `Not deployed`. Use explicit calendar dates and immutable identifiers.

## Agent compatibility
- Generic filesystem agents: this `AGENTS.md` and `.agents/skills/iaict-project-management/SKILL.md`.
- GitHub Copilot: `.github/copilot-instructions.md` points here.
- Claude Code: `CLAUDE.md` points here.
- Gemini CLI: `GEMINI.md` points here.
- If an agent does not auto-discover these paths, tell it explicitly to open this file and the skill. This does not install connectors or grant authorization automatically.
