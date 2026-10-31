# IAICT Portal — Drive Project Registry (DRIVE-REG-001)
**Established:** 2026-10-31 · **Status:** ACTIVE · **Classification:** INTERNAL
**Canonical Drive project root:** https://drive.google.com/drive/folders/11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ
**Canonical GitHub repository:** https://github.com/ntdung-tds/iaict-portal
**Current protected development branch (not production):** `feat/staging-native-login-r2-20261030`
**Staging:** https://iaict-portal-staging.iaict-platform.workers.dev/
**Production:** https://iaict-portal.iaict-platform.workers.dev/

## Folder registry: exactly one project master
| Code | Purpose / expected artifacts | Folder ID / verified link | Classification |
|---|---|---|---|
| 00 | START HERE, navigation, current project status, document inventory | [00_START_HERE](https://drive.google.com/drive/folders/1WCB84rV4uU2oZoR1ihCws7DimzQMpaf1) | INTERNAL |
| 01 | Project charter, scope, stakeholders/RACI, approvals, governance policies | [01_Governance](https://drive.google.com/drive/folders/1RXoYSP9Q064YLcymvlI5BRPsUyuez4TX) | INTERNAL |
| 02 | Roadmap, milestones, risks/issues/dependencies, capacity/cost estimates | [02_Planning](https://drive.google.com/drive/folders/1xS5YJd4M_cjPXpv1nF6LUo0CKi_fNrgq) | INTERNAL |
| 03 | Business requirements, UX, product acceptance and change requests | [03_Product](https://drive.google.com/drive/folders/14k6YmQlwz-kJURo6aVp92JjQ47EM8GCw) | INTERNAL |
| 04 | Architecture designs, approved ADR snapshots, diagrams, schema designs | [04_Architecture](https://drive.google.com/drive/folders/1ue8sL_mmfpO3lX5BJj2UxNuh5nwUcRxY) | INTERNAL |
| 05 | Deployment summaries, CI reports, signed releases, rollback plans | [05_Engineering](https://drive.google.com/drive/folders/14I5VHk97ke5O1v6ss7UvUllOZES7OWhg) | INTERNAL |
| 06 | QA standards, test reports, real screenshots/error evidence | [06_Quality](https://drive.google.com/drive/folders/1HrneZMee1_bDuahmholKdnEoBymU4vy9) | INTERNAL/RESTRICTED |
| 07 | IAM/security review, privacy, access configuration backups (restricted) | [07_Security](https://drive.google.com/drive/folders/1jLu01Wj4zrTD2N7I3A3Ot9QbUxcBFUTo) | RESTRICTED |
| 08 | Operating runbooks, monitoring, incidents, disaster recovery | [08_Operations](https://drive.google.com/drive/folders/1uSefYC0EBA5DALNEMGw1lwBFfmEdGSzs) | INTERNAL/RESTRICTED |
| 09 | Decision minutes, reviews, change proposals & approvals | [09_Change](https://drive.google.com/drive/folders/1o9MyhJc8tKzM5xnNxshjcVnLAbkZZ9Ak) | INTERNAL |
| 10 | AI agent instructions, reusable Skill package, agent handoffs | [10_AI_Agents](https://drive.google.com/drive/folders/1daM-CQFF9SmLT-KYXEfZ5cIAnkh5Sayr) | INTERNAL |
| 90 | Superseded/retired reviewed snapshots, not active working copies | [90_Archive](https://drive.google.com/drive/folders/1NJhNBcTW4c0vt2CVM4ap0u_vw7mJaTxo) | INTERNAL |
| 99 | Intake for uncategorized incoming docs, requires owner & classification | [99_Inbox](https://drive.google.com/drive/folders/1dmXd-2xr3r4lZnSjXFkMs4g0s7OC36QM) | INTERNAL |

## Living project-management documents (created and checked 2026-10-31)

| ID | Document | Drive URL / location | Baseline |
|---|---|---|---|
| PM-INDEX-001 | Read first — master project navigation | [Google Doc](https://docs.google.com/document/d/1shehSFXogJqx7hhsIgYigU21IccifWx9ntybVUt3Rnk/edit?usp=drivesdk) in `00` | `docs/project/START_HERE.md` |
| PM-GOV-001 | Project operating model, source-of-truth, RACI and controls | [Google Doc](https://docs.google.com/document/d/1Zaa7NCCiP1pMtTCdiuQJHtihN_EorY09NJlIwc3_Toc/edit?usp=drivesdk) in `01` | `docs/project/OPERATING_MODEL.md` |
| PRJ-CHTR-001 | Project Charter, scope and approval roles — **DRAFT, not signed** | [Google Doc](https://docs.google.com/document/d/1NHgTtMGGvan4rrDXMuGQRUb2bCmAX2gDMctG96q-7I4/edit?usp=drivesdk) in `01` | `docs/project/PROJECT_CHARTER_DRAFT.md` |

| MOMENT-IAICT | Checklist Moment time-indexed project checkpoints, scoped progress and cross-chat handoff — WORKING | [Google Doc MIRROR](https://docs.google.com/document/d/1VT6fL6fogtrMg-MieaqhyjITceKiW2EqCcAZ1XcPpqM/edit?usp=drivesdk) in `02_Planning` | `docs/project/CHECKLIST_MOMENT.md`; timestamped `docs/project/checklist-moments/` |
| PM-PLAN-001 | Current roadmap, dependencies, approval gates — WORKING | [Canonical GitHub plan](PROJECT_PLAN.md) (no duplicate Drive authority) | `docs/project/PROJECT_PLAN.md` |
| PM-PROGRESS-001 | Evidence-based milestone and test progress — WORKING | [Canonical GitHub progress](PROJECT_PROGRESS.md) | `docs/project/PROJECT_PROGRESS.md` |
| RISK-REG-001 | Risks, contingencies and open owner decisions — WORKING | [Google Doc](https://docs.google.com/document/d/1p4qDFDH8qFi6Lq-fOw7b_3Xc4jSqaA4ct6LAXuaaqas/edit?usp=drivesdk) in `02` | `docs/project/RISK_REGISTER.md` |
| AGENT-GUIDE-001 | Multi-agent instructions / reusable Skill guide | [Google Doc](https://docs.google.com/document/d/1IPioKWQJ1ruXpgdAhKk7gHf3ItGRfShZGQUjiOfXXmo/edit?usp=drivesdk) in `10` | `AGENTS.md`, `.agents/skills/iaict-project-management/SKILL.md` |
| QA-PLAN-001 | Test management and 78 test cases | [Google Doc](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit?usp=drivesdk) in `06` | `docs/qa/` |

These Docs are **readable snapshots**, not auto-synchronized repositories. Their status is DRAFT/WORKING until an authorized owner records acceptance. Use exact file IDs and update the registry on relocation.

**Current QA snapshots as of 2026-10-31:** [living 78-case IAM v1.2 Google Doc](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit?usp=drivesdk) + [78-case Word v1.2 stored in QA Documentation](https://docs.google.com/document/d/1bLQSwbFfaNjKmFIc39ijPOWnGCjZGrAy/edit?usp=drivesdk). Earlier 73/75-case Word files remain historical snapshots and must not be mistaken for the current registry.

## Moved existing collections; IDs and permalinks deliberately preserved

- QA screenshots and historical media: [IAICT Portal — Browser QA Screenshots](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) → `06`.
- QA documents, including [73-case Word snapshot](https://docs.google.com/document/d/1xB592k649xvZ94ZfGVse2I_Ol7IAF-LG/edit?usp=drivesdk&ouid=115003313841764302454&rtpof=true&sd=true) → [IAICT Portal — QA Documentation](https://drive.google.com/drive/folders/1mE-w9P5JEKpr-EmCzQFrKcq4xXcryfIA) under `06`.
- Security config backups: [Cloudflare Access Config Backups](https://drive.google.com/drive/folders/1e8qxwlTawwJ7wZJcgWOjggKtxqhIGJmt) → `07`. Do not publicly share, alter contents, delete, or export private backup bytes without an explicit need and approval.
- Existing [IAM P0 evidence](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) remains inside screenshots collection. Subfolders: [PASS](https://drive.google.com/drive/folders/1W1HuaSxtaYMWxLDhdqy-U2HxX3jMlwfz), [FAIL](https://drive.google.com/drive/folders/1g50_0CJI3uoCNH2aAT5dBlKbyBPtsFln), [MANUAL/RECHECK](https://drive.google.com/drive/folders/1wW6te40YqBwc3dJNMT40cnVESC11Iv5j).
- [Living IAM Test Plan / 73 test cases](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit?usp=drivesdk) was verified and moved without changing its file ID or sharing; it now resides in [QA Documentation](https://drive.google.com/drive/folders/1mE-w9P5JEKpr-EmCzQFrKcq4xXcryfIA) under `06`.

## Security architecture draft in Drive

- [ADR-0002 — MFA/TOTP staged design (PROPOSED)](https://docs.google.com/document/d/1c0zGDPq6IJad8HO4LdlGty974_mbRIQQbpia8b59PTY/edit?usp=drivesdk), stored in [04_Architecture](https://drive.google.com/drive/folders/1ue8sL_mmfpO3lX5BJj2UxNuh5nwUcRxY). Source of truth: `docs/adr/0002-iaict-native-mfa-totp-staged.md`; no enrollment API is enabled.

## Final project handover — mandatory but not yet completed

**Drive Final Handoff instruction document (verified, private):** [READ FIRST — FINAL HANDOFF PENDING](https://docs.google.com/document/d/1w2BYP9fVfjQ1n1UKV-4W-UW96xGIZlOB0XAtxP8V1as/edit?usp=drivesdk), stored inside the reserved final folder. This file is a pending checklist, **not a completed source archive**.


- **Owner clarification, 2026-10-31:** Do NOT upload/export the entire project including source code until the owner explicitly says “bàn giao”. Continue ordinary development and QA. No automatic handover on milestone completion. [GitHub Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38) is DEFERRED until explicit owner handover request.
- **Verified destination, status PENDING:** [FINAL_HANDOFF — Full Source, Documentation & Recovery](https://drive.google.com/drive/folders/1FPhc8qDloCwxSRxTq-X6i3t5b8DYkPaQ) nested under `05_Engineering`. This folder is reserved for the **final approved release snapshot** only, not intermediate copies.
- Completion requires a source archive pinned to approved release SHA, optional history bundle, complete docs and agent skill, versioned manifest + independent SHA-256 checksums, sanitization/no secrets, upload/readback, clean restore test and owner sign-off. D1/R2 data backups are **separate restricted deliverables** requiring their own data-protection approval, not implied by a source archive.
- Archiving must never include live secrets, env files, passwords, cookies, personal data, plaintext config credentials, build dependencies or R2/D1 real data. Keep Drive ACL private. Archive must be sourced from immutable, known repository commit/tag. Handover completion (when explicitly requested) is blocked until #38 is closed with real evidence; do not fabricate success or close merely because a folder exists.
- References: `docs/project/FINAL_HANDOFF_PLAN.md`, `docs/project/OPERATING_MODEL.md`, `AGENTS.md`.

**QA identities and real-browser role-matrix:** [QA_TEST_IDENTITIES restricted folder](https://drive.google.com/drive/folders/1q8-9hjgH_Rq9WKhv_rJpA1C3A8jB8lGO) inside `06_Quality`, [private 8-account register](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit?usp=drivesdk). No passwords, bearer tokens or Access cookies are stored there. As of 2026-10-31 all 8 QA identities are disabled and role browser acceptance is not yet completed. [Current living 78-case QA plan](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit?usp=drivesdk), [Word v1.2 snapshot](https://docs.google.com/document/d/1bLQSwbFfaNjKmFIc39ijPOWnGCjZGrAy/edit?usp=drivesdk&ouid=115003313841764302454&rtpof=true&sd=true).

## Placement and naming contract

1. Never create another IAICT project root. Search this registry and the parent folder before creating children.
2. Functional folder codes are stable; add subfolders only when actual content exists. Avoid folder trees deeper than 3 levels unless a well-defined evidence/run boundary.
3. Working documents follow `IAICT_<AREA>_<TYPE>_<ShortTopic>_vN.N_YYYYMMDD`; bilingual headings may be used inside. Do not write `FINAL` without signed-off status.
4. Each deliverable has `Document ID, version, owner/role, status [DRAFT|IN_REVIEW|APPROVED|SUPERSEDED], classification, date, source PR/SHA, Drive URL, dependencies, review due`; no invented names or approvals.
5. Core code, tests, schemas, ADR text and machine-readable requirements are **version-controlled in GitHub**. Drive contains readable collaboration files and approval/evidence records; link to SHA-locked GitHub objects rather than copy without provenance.
6. File permission model: `INTERNAL` project users by least privilege; `RESTRICTED` only explicitly authorized reviewers. Current My Drive root is private; this is **not** a Google Shared Drive. Do not casually grant root-level access, because inheritance can expose `07_Security`. If team collaboration requires broader membership, first plan a move to an organization-owned shared drive with separate restricted backup boundary and approval; never claim this has already happened.
7. Evidence per `RUN-ID / CASE-ID / BUG-ID`, sanitize screenshots, never put test images in GitHub. Do not paste credential, Access JWT, password, invitation token, secret, session cookie, PII in any document.
8. Never delete an old version solely to tidy the folder; move approved superseded snapshots to `90` with a manifest, only after owner approval.
9. Google Docs and their GitHub references are **not automatically synced**. A change to one side requires an explicit synchronisation task and a readback check; update registry links on any verified relocation or new item.

## Change procedure for agent

Before any Drive change: read this registry → search for existing name/ID → read parent/permissions → determine source-of-truth and data classification → make the smallest authorized change → read back parent/content → update registry and release/QA links in same PR when applicable. On failure, stop and report exact blocker; no fabricated links or success messages.

## Project sources

- ISO 21502:2020 (guidance, not project certification): https://www.iso.org/standard/74947.html
- Google Drive folder parent/move semantics: https://developers.google.com/workspace/drive/api/guides/folder
- Google Shared Drive permissions: https://developers.google.com/workspace/drive/api/guides/about-shareddrives
- NIST SSDF 1.1: https://csrc.nist.gov/pubs/sp/800/218/final
