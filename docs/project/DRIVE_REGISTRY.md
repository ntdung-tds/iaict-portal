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

## Moved existing collections; IDs and permalinks deliberately preserved

- QA screenshots and historical media: [IAICT Portal — Browser QA Screenshots](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) → `06`.
- QA documents, including [73-case Word snapshot](https://docs.google.com/document/d/1xB592k649xvZ94ZfGVse2I_Ol7IAF-LG/edit?usp=drivesdk&ouid=115003313841764302454&rtpof=true&sd=true) → [IAICT Portal — QA Documentation](https://drive.google.com/drive/folders/1mE-w9P5JEKpr-EmCzQFrKcq4xXcryfIA) under `06`.
- Security config backups: [Cloudflare Access Config Backups](https://drive.google.com/drive/folders/1e8qxwlTawwJ7wZJcgWOjggKtxqhIGJmt) → `07`. Do not publicly share, alter contents, delete, or export private backup bytes without an explicit need and approval.
- Existing [IAM P0 evidence](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) remains inside screenshots collection. Subfolders: [PASS](https://drive.google.com/drive/folders/1W1HuaSxtaYMWxLDhdqy-U2HxX3jMlwfz), [FAIL](https://drive.google.com/drive/folders/1g50_0CJI3uoCNH2aAT5dBlKbyBPtsFln), [MANUAL/RECHECK](https://drive.google.com/drive/folders/1wW6te40YqBwc3dJNMT40cnVESC11Iv5j).
- [Living IAM Test Plan / 73 test cases](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit?usp=drivesdk) was verified and moved without changing its file ID or sharing; it now resides in [QA Documentation](https://drive.google.com/drive/folders/1mE-w9P5JEKpr-EmCzQFrKcq4xXcryfIA) under `06`.

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
