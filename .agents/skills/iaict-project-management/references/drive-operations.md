# Drive operations — IAICT

Canonical: [Drive Registry](../../../../docs/project/DRIVE_REGISTRY.md) or direct [master folder](https://drive.google.com/drive/folders/11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ).

## Placement
- `00` onboarding / navigation, `01` charter/governance, `02` roadmap/risk, `03` requirements/UX, `04` ADR/architecture, `05` engineering/releases, `06` QA docs/evidence, `07` IAM/security/approved backups, `08` ops/incidents, `09` change and minutes, `10` AI agents, `90` archive, `99` uncategorized intake.
- Existing screenshot collection: https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3 ; existing QA docs: https://drive.google.com/drive/folders/1mE-w9P5JEKpr-EmCzQFrKcq4xXcryfIA ; security config backups: https://drive.google.com/drive/folders/1e8qxwlTawwJ7wZJcgWOjggKtxqhIGJmt.
- These existing folders are now under master `06` and `07` respectively. Their IDs and links must not change during reorganization.

## Safe create / move
1. Read registry; search by exact name/ID before creating. If found, reuse.
2. Inspect source metadata `parents`, MIME, permissions, shared-drive status; destination parent metadata and sharing inheritance.
3. If both are same My Drive security domain, move with `files.update addParents=<target> removeParents=<verified previous parent>`. Do not rename file IDs or replace bytes.
4. Read back `parents`, MIME and visibility. Report exact folder URL. Update registry if a permanent location changed.
5. If access, move or inherited permissions look unsafe, **stop**. Shared Drives may inherit broad access which cannot be reduced at subfolder level; never relocate private backups into one without security plan.
6. Avoid many deep empty folders and reorganization solely for aesthetics. Create structural folder only when it has a clear responsible owner/use.
7. Never publish a Drive item by setting `anyone with link` without owner approval.

## File naming and governance
`IAICT_<AREA>_<TYPE>_<ShortTopic>_vN.N_YYYYMMDD`.
Metadata inside/description: owner role, status, classification, version, source SHA/PR, last review, next review. If multi-editor Docs: use one living Doc and controlled PDF/DOCX snapshots when approved; don't overwrite historical final approvals.
Images: `RUN-ID__CASE-ID__PASS__01.png`, `BUG-ID__CASE-ID__FAIL__01.png`; always link to actual Drive item. Strip secrets, credentials, PII, token fragment, Access cookies and private headers before upload.
Never store CI screenshots/video/trace in GitHub artifacts.

## Backups and retention
Cloudflare config backups are RESTRICTED, NOT a casual shared team folder. Never inspect contents unrelated to authorized work, export to public storage, or delete them. Any retention or purge policy is a new approved decision. Archive superseded documents with provenance, not arbitrary cleanup.

## Source of truth
GitHub code/spec/QA test definitions vs Drive approved documents/media. Do not promise automatic synchronization. Update both when requested/required and read back, or report `PENDING_SYNC`.
