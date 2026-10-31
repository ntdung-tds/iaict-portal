# IAICT Portal — START HERE / Project Navigation (2026-10-31)

## One entrypoint
**Project Master on Google Drive:** https://drive.google.com/drive/folders/11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ
**Source/Issues/PRs:** https://github.com/ntdung-tds/iaict-portal
**Staging:** https://iaict-portal-staging.iaict-platform.workers.dev/ (Cloudflare Access guards admin)
**Production:** https://iaict-portal.iaict-platform.workers.dev/ (**DO NOT CHANGE** without approval)
**PR for current IAM work:** https://github.com/ntdung-tds/iaict-portal/pull/36 (draft as of 2026-10-31; re-check live status)

## Where things live
| Purpose | Go to |
|---|---|
| Project home / folder IDs | [Drive Registry](./DRIVE_REGISTRY.md) |
| Scope, governance, RACI, workflow, risks | [Operating Model](./OPERATING_MODEL.md) |
| Agent and developer guardrails | [AGENTS.md](../../AGENTS.md) |
| AI multi-agent skill | [IAICT Skill](../../.agents/skills/iaict-project-management/SKILL.md) |
| Test plan and test case registry | [QA Standard](../qa/IAICT_TEST_MANAGEMENT.md), [73 test cases](../qa/IAICT_TEST_CASES.csv) |
| Append-only verification results | [QA Run Ledger](../qa/IAICT_TEST_RUNS.md) |
| Live review-friendly Google Doc | https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit?usp=drivesdk |
| QA screenshots and error photos | [Drive QA collection](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) |
| IAM Test Evidence (PASS/FAIL/Manual) | [Drive IAM](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) |
| Cloudflare Access backups | [Restricted Drive folder](https://drive.google.com/drive/folders/1e8qxwlTawwJ7wZJcgWOjggKtxqhIGJmt) |

## Project operating rules
- GitHub is authoritative for code, issues, PR, test specs and agent policy; Drive for shared docs, stakeholder approvals, visual QA evidence, restricted backup inventory, reports.
- Each work batch: `REQ/Issue → PR/SHA → test cases → test run → staging release → approval`; do not declare done based only on passing mocks.
- Keep version/owner/approval/evidence links; don't create an untracked duplicate “official” project folder.
- Production is separately gated; staging must be tested first; keep Cloudflare Access admin protection and Build HOLD safety.
- Update instructions/skill/Drive index/test records whenever relevant functionality or project process changes. Coordinate rather than duplicate sources.

## Initial known baseline (historical snapshot, not live health)
- Last **observed deployed staging feature**: SHA `2a76deb5642d6f60a89c894fa91c7c30a42953c8`, Worker `1b8cfe71-88ef-4e21-8937-4f8590daaba4` — IAM password check, sessions, invites. Verify runtime again before deployment.
- Test catalog: 73 cases; earlier tested feature baseline had 526/526 Vitest PASS plus browser and staging acceptance. Historical `RUN-IAM-20261031-01` distinguishes PASS from BLOCKED and NOT_RUN.
- This project folder/agent-governance PR **does not itself deploy** application changes.

## New team member or agent — first 5 minutes
1. Read this page and `AGENTS.md`.
2. Open Drive Registry for the correct folder. Do not guess file IDs.
3. Read the latest PR and tests run for the task.
4. Confirm the current staging/production state using authorized tools; do not assume old baseline means current.
5. Propose a bounded batch, preserve safety gates, record actual evidence and update this page/registry after verified structural changes.

## Research foundation
ISO 21502:2020 project management; NIST SSDF SP 800-218; Google Drive API folder/permissions; Agent Skills open spec; OWASP ASVS for IAM testing. Reference links in Operating Model and Agent Skill; guidance adapted for IAICT, not an audit certification.
