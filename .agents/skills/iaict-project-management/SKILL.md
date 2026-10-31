---
name: iaict-project-management
description: Manage the IAICT Portal project across Google Drive, GitHub, Cloudflare staging, test cases and releases. Use for project folder organization, planning, work batches, PR handoffs, QA evidence, documentation, risk/ADR decisions, AI agent handoffs, staging release and operational reporting. Enforces no unapproved production changes, no GitHub QA screenshots, and source-of-truth discipline.
compatibility: Requires authorized access to GitHub and optionally Google Drive/Cloudflare; degrades to read-only planning without connectors.
metadata:
  author: IAICT
  version: "1.0.0"
  project: "iaict-portal"
---

# IAICT Portal Project Management Agent Skill

Use together with repository `AGENTS.md`. This is a **portable Agent Skills** module; not a permission grant or an automated task runner.

## Activation and prerequisite discovery

Activate for: updating project Drive folders, staging/production planning, roadmap/backlog, release oversight, requirements, ADR, test case management, media evidence, incident, stakeholder update or any cross-agent handoff.

Read in order:
1. `AGENTS.md` (repo root). Its safety boundaries are mandatory.
2. `docs/project/DRIVE_REGISTRY.md` for verified folder IDs and URLs. Never reconstruct a Drive ID.
3. `docs/project/OPERATING_MODEL.md` for who approves, source of truth, statuses, artifacts and cadence.
4. `docs/qa/IAICT_TEST_MANAGEMENT.md` for testing and evidence.
5. [This skill's Drive-specific guide](references/drive-operations.md), [delivery guide](references/delivery-workflow.md), and [templates](references/templates.md) as needed; don't ingest irrelevant references.

Before any action, list available **connected capabilities**. If the required GitHub, Google Drive or Cloudflare action is missing, do not claim it was executed. Prepare a precise handoff with exact file ID, intended operation and verification instructions instead.

## A. Routing by work type

- **GitHub**: source code, scripts, migrations, automated test definitions, issue/PR/backlog, ADR source, run ledger and agent rules.
- **Google Drive project master**: https://drive.google.com/drive/folders/11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ. It contains signed-off governance docs, product/design snapshots, release reports, testing photos/errors, restricted backup references, and agent onboarding. Read registry rather than guessing a folder.
- **Cloudflare**: authoritative runtime worker version, D1 state, R2 binding, deployment state and access coverage. Cloudflare Access persists on admin paths until a separately approved IAM handover.
- **User in chat**: explicit approval for production, broad sharing, deletion, sensitive policy changes or removing Access. Never infer it from the skill itself.

## B. Observe → plan → execute → verify → register

1. **Observe:** latest project request, current GitHub branch/PR head, outstanding test failures, Drive registry, exact staging/production versions. Separate observed vs inferred.
2. **Plan:** choose a bounded batch (2–4 small related work items, 1 medium feature or a gated large feature); define acceptance criteria, likely risks and rollback impact.
3. **Execute:** update source of truth first. New code + tests + records in same PR. For Drive files, search before creating, verify parent/permissions, modify minimally; preserve file IDs when relocating.
4. **Verify:** CI statuses on same SHA, explicit run records, Cloudflare pre/post readback if deployed. Compare observed results with test expectations. No screenshots to GitHub.
5. **Register:** update Drive Registry when new permanent folders/resources arise, relevant PM log/test run/ADR/PR links. If a Google Doc is a projection of GitHub test definitions, update and read back both, or flag sync `PENDING`.
6. **Report:** results with verified links; untested work stays NOT_RUN or BLOCKED. No production change unless separately approved.

## C. Non-negotiable task gates

- Never modify production or Cloudflare Access policy without explicit approval; always prefer staging. Preserve build HOLD guard and rollback.
- Do not mutate genuine users/credentials or share production data for testing. Use synthetic fixtures and least privilege.
- No plaintext secrets, raw tokens, PII or screenshots/videos in GitHub or CI artifacts. Screenshots/images and defect captures → private Drive `06_Quality` with case/run ID, redact sensitive parts.
- Never equate a suite-level PASS with one-to-one case coverage or a live authenticated acceptance.
- Do not edit applied D1 migrations. Do not mark artifacts APPROVED if sponsor did not approve.
- Avoid bulk reorganizations and deletions; record source parent, target parent and post-move verification for each Drive move.
- For any security or architectural exception, capture RISK/ADR or owner decision before proceeding.

## Separation of normal work and handover
The user's explicit clarification is narrow: **do not transfer/export complete source code to Google Drive for final handover until the user says "bàn giao"**. All other authorized project work continues **without interruption**: coding and commits to GitHub, PRs, staging changes subject to their normal safeguards, project management, Google Drive documents and folders, QA test cases, test accounts, browser tests, sanitized Drive screenshots, defect tracking and routine reporting. Do not ask for "bàn giao" to perform ordinary work and do not make final archive preparation a dependency for unrelated tasks.

## Mandatory QA report output: table
For each test run return a **Markdown table** with at least `Test ID | Environment / role | Expected | Actual | Status | Evidence / Drive link`. Include `Run ID`, `Git SHA/Worker`, `Bug ID` as needed. Show unit/CI, mocked Chromium, anonymous live browser and authenticated live role tests as separate rows; accurately use PASS, FAIL, BLOCKED, NOT_RUN or NOT_APPLICABLE. Screenshot absent → NOT_CAPTURED; never invent links. Append a short action/blocker note, not a prose-only substitute.

## Final delivery / full-source archival gate

Only when the owner explicitly requests “bàn giao”, execute [Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38) and `docs/project/FINAL_HANDOFF_PLAN.md`. The owner requires **the whole source code, docs, tests, migrations, skill and recovery guide** uploaded to the verified private [FINAL_HANDOFF Drive folder](https://drive.google.com/drive/folders/1FPhc8qDloCwxSRxTq-X6i3t5b8DYkPaQ), with SHA-256 manifest and isolated restore test. Do not upload current working code as a falsely labelled FINAL, do not include secrets, and do not close handover Issue #38 or claim handover complete before owner acceptance; ordinary project development and milestone statuses remain independent. A later agent must read this prerequisite regardless of whether it was present in the original chat.

## Role-based real-browser QA

Read `docs/qa/IAICT_TEST_IDENTITIES.md` and its [restricted staging test-user registry](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit?usp=drivesdk). Eight disabled synthetic D1 fixtures represent seven roles; do not activate without approved Access test identity and proper password vault. Route role-sensitive tasks through 7-role positive/negative real-browser scenarios when authorized, record each run independently with actual statuses and sanitized Drive evidence. Cloudflare Browser Rendering quota errors are BLOCKED, not PASS. Use the existing staging-only authenticated Playwright config; no cookies or test login credentials in GitHub/Drive/CI.

## Test report response format (MANDATORY)

When giving QA results, present a **Markdown table**, with one row per actual checked case or meaningful grouped automated suite. Use columns: `Test ID | Scenario | Environment / test layer | Role | Expected | Actual | Status | Evidence/defect`. Precede with immutable `RUN-ID`, source SHA, staging Worker and date when known. Add a short summary table with PASS/FAIL/BLOCKED/NOT_RUN counts where useful. Never use PASS for a case based only on test-case readiness, different environment, or a non-equivalent mocked test. Mark browser HTTP 429 BLOCKED and unauthenticated role checks NOT_RUN. Store screenshots only in the verified private QA Drive folder.

Continue normal Drive project management, documents, live QA evidence, test-account records, and GitHub development. **No source code, including individual source files, full archives, Git bundles or snapshots, may be uploaded to Google Drive until the owner explicitly says `bàn giao`.** This does not restrict ongoing GitHub commits, project documentation on Drive, QA evidence or normal staging work.

## SRS freeze and per-component change records

Read `docs/requirements/README.md` and `docs/requirements/SRS.md` before any feature change. SRS is a **frozen, not-yet-approved placeholder**. During active implementation, update only `docs/requirements/<module>/thaydoi.md` for every affected subsystem, with a CHG ID, rationale, before/after behavior, risk, PR/SHA and QA table/evidence. Do **not** change SRS until the owner explicitly **“chốt”** the appropriate requirements. When chốt occurs, start a separately reviewed, versioned SRS consolidation PR with exact change IDs. Never confuse chốt with **“bàn giao”**: the latter alone permits source-code transfer to Drive. Use `npm run verify:requirements` as a regression check; do not bypass it.

## D. Output format for agents

Use the following concise deliverable layout, with actual proof:

```md
## IAICT delivery / handoff — YYYY-MM-DD
Goal and scope:
Issue/REQ/ADR IDs:
Changed (GitHub PR/commit + Drive file URLs):
Test cases and run IDs; passed / failed / blocked / not-run:
Staging deployed? Worker SHA/version + D1 migrations + Access:
Production touched? (yes/no; approval ref if yes):
Media evidence folder / file links (or NOT_CAPTURED):
Risks, unanswered assumptions, rollback/contingency:
Recommended next bounded task batch:
```

## E. Reuse across other agents

- Portable source path: `.agents/skills/iaict-project-management/SKILL.md`.
- Installation: copy the **entire skill directory** (including `references/`) to your agent's supported skill directory, or tell the agent to read the repository file directly. Whether auto-discovery works is client-dependent.
- Repo-wide default: `AGENTS.md`, Copilot `.github/copilot-instructions.md`, Claude `CLAUDE.md`, Gemini `GEMINI.md`. These are human-readable rules only; they do not automatically connect apps or authorize actions.
- Recommended invocation: **“Áp dụng skill iaict-project-management và AGENTS.md; kiểm tra Drive Registry, GitHub PR, QA ledger, Cloudflare staging; làm [task] trên staging, ghi lại bằng chứng và cập nhật project records.”**

## F. Versioning

When change policy or folder paths: update this file + relevant `references/` + `docs/project/DRIVE_REGISTRY.md` in a PR; include a short migration note. If Drive working copy exists, sync it and verify. Do not silently overwrite a prior approved skill release.

## Supporting guidance

- [Drive organization and ACL](references/drive-operations.md)
- [Delivery and QA workflow](references/delivery-workflow.md)
- [Record templates and prompts](references/templates.md)
