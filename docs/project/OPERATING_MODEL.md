# IAICT Portal — Project Operating Model (PMO-LITE v1.0)
**Date:** 2026-10-31 | **State:** proposed governance baseline (not sponsor-approved) | **Project owner/approver:** IAICT representative (person to be designated)
**Project Drive:** https://drive.google.com/drive/folders/11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ
**Folder registry:** [DRIVE_REGISTRY.md](./DRIVE_REGISTRY.md)
**Agent guidance:** [AGENTS.md](../../AGENTS.md) · [portable skill](../../.agents/skills/iaict-project-management/SKILL.md)

## 1. Why this lightweight model

IAICT is independently developing a Cloudflare Workers/D1/R2-based portal with growing CMS, newsroom, IAM and future CRM scope. It needs traceability and releases, not an overhead-heavy enterprise PMO. Use **incremental delivery** with visible decisions; group 2–4 small related tasks per delivery, or isolate one high-risk capability (MFA, identity recovery, tenant boundaries). Adapt ISO 21502 project-management ideas to the actual project and NIST SSDF secure software practices; neither implies certification.

## 2. One system of record per object

| Object | System of record | Drive role | Lifecycle / gate |
|---|---|---|---|
| Software source, schema migrations, GitHub CI, code reviews | GitHub repository, immutable SHA | release summary / links only | PR → tested SHA → staging → sign-off → prod separately |
| Backlog/task/bug/PR | GitHub Issue + PR (unless another explicitly approved tracker replaces it) | read-only dashboard/report | OPEN → TRIAGED → READY → IN_PROGRESS → REVIEW → QA → DONE; BLOCKED explicitly |
| Architecture decisions | `docs/adr/` or versioned ADR in GitHub | approved readable snapshot | PROPOSED → ACCEPTED / REJECTED → SUPERSEDED (no silent rewriting) |
| Test definitions, test histories, bug forms | `docs/qa/` version-controlled | human-readable QA plan | case READY != test PASS; run append-only |
| Live test screenshots / error images | Google Drive `06_Quality` | **sole media location** | include RUN + CASE + BUG IDs; redact secrets |
| Project charter, sponsor approvals, stakeholder communication | Google Drive `01`, `09` | **authoritative signed record** | DRAFT → REVIEW → APPROVED (only explicit sign-off) |
| Requirements acceptance, UX design, architecture presentations | GitHub for machine-readable, Drive for reviewed docs | approvals & collaboration | map `REQ` → `TASK` → `PR` → `CASE` → `RUN` |
| Cloudflare production configuration & secrets | Cloudflare account/secret manager | restricted nonsecret inventory / approved backups | never copy secret to GitHub, docs, screenshot |
| Agent procedures / skill | GitHub `AGENTS.md`, `.agents/skills/` | readable onboarding/published copy | versioned source; Drive copy has provenance |

No duplicate “official” backlog in a manually managed Drive sheet. If a dashboard is needed, generate it from GitHub Issues with source links and snapshot date; it is not an independent task authority.

## 3. Required records and identifiers

- `PRJ-CHTR-001`: project charter/scope. Define goals, non-goals, constraints, sponsors, assumptions, success indicators and explicit sign-off.
- `REQ-<AREA>-NNN`: requirement/change. Acceptance criteria and constraints, source/provenance and owner.
- `TASK-<AREA>-NNN` or GitHub Issue #n: story/implementation work item; DoR and DoD attached.
- `ADR-NNNN`: important engineering decision; context, alternatives, decision, consequences, approver and date.
- `RISK-NNN`: uncertain event with likelihood × impact, mitigation, owner, trigger and review date.
- `ISSUE-NNN`: happening problem, owner, containment, dependency and expected resolution; do not confuse with a GitHub Issue number.
- `DEC-NNN`: business/project decision with options, explicit approver and link.
- `REL-YYYYMMDD-NN`: staging/prod release record with SHA and Worker version.
- `IAM-AREA-NNN`, `RUN-IAM-YYYYMMDD-NN`, `BUG-IAM-YYYYMMDD-NN`: QA case, immutable run and defect under [QA standard](../qa/IAICT_TEST_MANAGEMENT.md).

Dates ISO `YYYY-MM-DD`; statuses `DRAFT, IN_REVIEW, APPROVED, SUPERSEDED`; do not label as FINAL/PASS/APPROVED without evidence. Use absolute dates and Asia/Bangkok (UTC+07) for human sign-offs, UTC timestamp for machine logs.

## 4. RACI by responsibilities, not invented personal assignments

| Activity | Sponsor / IAICT Owner | Product Lead | Engineering/Agent | QA/Security |
|---|---|---|---|---|
| Define product scope / P0 priority | A | R | C | C |
| Architecture / ADR | A for high-impact decisions | C | R | C |
| Code / tests / staging deployment | I | C | R/A technical execution | C |
| Test evidence / defect retest | I | I | R for automation | A for QA verdict |
| Production release / Access removal | **A** | C | R after approval | Gate reviewer |
| Root-level sharing / security backups | **A** | I | R after approval | C |
| Incident response and rollback | A for material business impact | I | R operational | C |

`R` executes, `A` accountable/approves, `C` consulted, `I` informed. Where nobody has been named, owner remains `UNASSIGNED` and that approval is pending—an AI agent cannot approve for the sponsor.

## 5. Definition of Ready / Definition of Done

**Ready:** user value and scope; `REQ` and acceptance criteria; data sensitivity; owner; dependencies; proposed test IDs; rollback strategy for a change that mutates state; expected environment. If uncertain, label uncertainty and proceed with safe, reversible work only.

**Done (engineering):** linked PR and issue; code, data migrations, security review, impacted docs/ADR/skill updated; tests and QA case mapping; commit SHA; CI PASS; staging release with Worker version and D1/access/rollback checks; QA results and Drive evidence where applicable; acceptance decision; remaining risks recorded. `MERGED` is not necessarily `DEPLOYED` or `ACCEPTED`.

**Release readiness:** no unapproved P0 security defect; staging has green test gates and verified postdeploy condition; rollback version and D1 restoration strategy documented. Production promotion requires **explicit user authorization** and a fresh prod-specific preflight; never deploy production as the implicit next step.

## 6. Cadence without artificial dates

- At each incoming user request: check current branch/PR status + newly requested scope; choose a bounded task batch; create/update issue links.
- At each PR: update affected requirements, QA tests and agent instructions/skills; record testing source links and staging acceptance.
- At each release: save `REL` with exact SHA, Worker UUID, D1 migration, preflight, CI URLs, manual QA, blockers, deploy/rollback result. Keep prior release records.
- At each sponsor review: review current scope, RISK, ISSUE, DEC, backlog priorities and next review date.
- At each incident: preserve reproduction evidence, incident chronology and recovery steps; redact confidential values.
- For any material architecture/hosting change: create ADR first, compare options, cost, security and rollback; seek approval for production-impacting changes.

## Project closure acceptance — mandatory full source on Drive

Owner clarification 2026-10-31: only after the owner explicitly says “bàn giao” may the entire IAICT Portal, including source code, be uploaded. Continue normal development until that command; project milestones never auto-trigger handover. This is not a background promise; it is a deferred handover instruction activated only by explicit owner request tracked in [Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38), and [FINAL_HANDOFF_PLAN](./FINAL_HANDOFF_PLAN.md). Destination: https://drive.google.com/drive/folders/1FPhc8qDloCwxSRxTq-X6i3t5b8DYkPaQ . Only after explicit “bàn giao”, before marking HANDOVER ACCEPTED: export the approved release commit, sanitized archive and Git history if approved, docs/test/skill, SHA256 manifest, upload/verify, clean restore and owner acceptance. Do not bundle D1/R2 user data or secrets with source. **Engineering Done for an increment ≠ Project Closed**, and no agent can automatically activate the handover.

## Requirements lifecycle: living changes, frozen SRS

**While building:** GitHub `docs/requirements/<module>/thaydoi.md` is the living per-component record for new requirements, fixes, UI/API/D1 changes, and design decisions. `docs/requirements/SRS.md` is a **LOCKED/NOT_APPROVED placeholder**; do not edit it. The uploaded IAICT outline is reference, not silently the approved SRS. Every change maps to CHG ID, Issue/PR, SHA, impact, test case/run and actual status.

**On explicit owner “chốt”:** compare relevant change logs with source outline, code and test outcomes; confirm exact accepted scope; submit versioned SRS update through separate review PR with traceability and recorded approval. Do not promote every proposed change automatically.

**On explicit owner “bàn giao”:** only then start source code archive to Drive. The two approvals are distinct; all other routine development/test/doc/Drive activity continues normally.

## 7. Practical change workflow (small batch)

1. **Inspect** GitHub head, opened PR, current Drive registry, newest QA run, Cloudflare staged/prod versions and prior ADR (read-only).
2. **Plan** a task group by size and shared dependency. Small: copy/UI/tests/docs; Medium: backend + schema migration; Large/high-risk: IAM MFA, recovery, policy engine, multi-tenancy; isolate large tasks behind explicit gates.
3. **Implement** in active feature branch or a new bounded feature branch; do not edit frozen migration. Use one feature PR per cohesive batch.
4. **Validate** test catalog, negative/security cases, `npm run verify:qa`, Vitest/typecheck/build/browser and actual staging acceptance. A staging public check does not prove an authenticated workflow.
5. **Release to staging only** after CI green on the exact pinned SHA. Hold Cloudflare auto-deploy, preserve prior Worker and D1 recovery bookmark, confirm Access coverage and correct R2/D1 bindings. Read back result and record.
6. **Record** QA run with each applicable verdict. Screenshots/defects: private [Drive evidence](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp); do not store screenshot/video in GitHub.
7. **Report** Done / Blocked / Next, with proof URLs, what did not get tested, safe follow-up, and stop before production without approval.

## 8. Confidentiality, Drive permissions & backups

Current root is a **private folder inside My Drive**, not an organization-owned Shared Drive. For a durable team, assess a Workspace Shared Drive only if eligible and approved, with access partitioned **before** migration; Shared Drive inherited permissions cannot always be reduced at child folders. Do not move restricted backups into a broadly shared root.

Classification: `PUBLIC` (published assets), `INTERNAL` (project working docs), `RESTRICTED` (security/private incidents/backups). Never export secrets or credentials, even to RESTRICTED as plain text. Access to `07` and sensitive `08` requires explicit review before anyone shares parent folders.

Retention: no blanket automatic expiry/deletion established; propose retention schedule and obtain owner/legal approval before setting Drive/R2 lifecycle rules. Backups are not test evidence; verify integrity and access separately.

## 9. Risk, change and exception policy

Risk register row: ID, statement (cause/event/impact), probability (1–5), consequence (1–5), score, mitigation/contingency, trigger, responsible role, review date and status. Escalate critical security/privacy/data-loss risks at once. A policy exception needs: scope, reason, owner approval, compensating controls, expiration/review, and affected test cases. If a tool is disconnected, log `BLOCKED`; do not fabricate action success or silently bypass controls.

## 10. Source standards and contextual use

- ISO 21502:2020: https://www.iso.org/standard/74947.html (project guidance; no conformance claim)
- NIST SP 800-218 SSDF 1.1: https://csrc.nist.gov/pubs/sp/800/218/final
- Google Drive file move rules: https://developers.google.com/workspace/drive/api/guides/folder
- Google Drive inherited-permissions model: https://developers.google.com/workspace/drive/api/guides/about-shareddrives
- ADR Nygard: https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html
- GitHub agent instructions: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- Agent Skills Specification: https://agentskills.io/specification
