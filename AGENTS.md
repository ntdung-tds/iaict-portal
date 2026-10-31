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

## Mandatory final full-source backup to Google Drive
Owner clarification 2026-10-31: full-source handover is DEFERRED. It must start ONLY after the owner explicitly says “bàn giao”; technical completion alone is not authorization. When instructed, the entire project including code must be uploaded to the private Drive Project Master. [Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38) is a DEFERRED instruction, not a release-blocking requirement. Destination [FINAL_HANDOFF](https://drive.google.com/drive/folders/1FPhc8qDloCwxSRxTq-X6i3t5b8DYkPaQ). Follow `docs/project/FINAL_HANDOFF_PLAN.md`; archive the exact approved release SHA and approved documentation, include manifest+SHA256, remove secrets/PII, verify upload/download and **clean restore from Drive**. Get human sign-off. A folder alone is not a backup. Do NOT initiate handover or export the final project before explicit “bàn giao” instruction. This is a future completion action; never claim the final archive exists while work remains ongoing.

## Working method
1. Confirm objective, boundaries, affected component, user value, project issue/requirement/ADR and baseline status. Group several **small related tasks**; split high-risk capabilities into separately tested stages.
2. Find existing folders/files by their exact ID first, then by metadata search. Do not duplicate project roots or create a second QA evidence repository.
3. Each code change: update or explicitly justify existing Test Case IDs, add negative/security coverage, run `npm run verify:qa`, TypeScript/build/Vitest/Playwright as applicable. Keep `docs/qa/` and living Google Doc aligned on approved changes; if Drive cannot be edited, record pending sync and never assert completion.
4. Changes affecting architecture, user identity, D1, access, backups, or production flow require written risk/ADR and rollback plan. No direct bypass of CI.
5. Staging deploy: verify pinned SHA + completed CI and staging gate, worker prev version, D1 migration integrity and bookmark, Access routes, R2 binding; deploy only staging; restore HOLD; read back state; record test run and release.
6. GitHub Issue/PR is source of truth for task and code; Drive for human approvals, document versions, QA media and backup. Do not duplicate authoritative state. Every report links issue/PR, SHA, CI, Worker, Drive evidence, and next blocker.
7. If blocked by tool/permission/rate limit, stop risky action, report current exact state and missing verification. Never invent Drive file URLs or tool success.

## Deliverable contract for every task batch
Report `Scope | Changed files/issues | Tests + exact results | Staging state | Evidence Drive URLs (or NOT_CAPTURED) | Production unchanged | Open risks | Next task`. When no deployment occurs, say `Not deployed`. Use explicit calendar dates and immutable identifiers.

## Agent compatibility
- Generic filesystem agents: this `AGENTS.md` and `.agents/skills/iaict-project-management/SKILL.md`.
- GitHub Copilot: `.github/copilot-instructions.md` points here.
- Claude Code: `CLAUDE.md` points here.
- Gemini CLI: `GEMINI.md` points here.
- If an agent does not auto-discover these paths, tell it explicitly to open this file and the skill. This does not install connectors or grant authorization automatically.
