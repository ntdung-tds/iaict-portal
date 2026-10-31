# IAICT Portal — FINAL HANDOFF & RESTORE PLAN (PENDING)
**Requirement ID:** REQ-DELIVERY-001 | **Issue:** https://github.com/ntdung-tds/iaict-portal/issues/38
**Created:** 2026-10-31 | **Status:** PENDING — PROJECT IS STILL UNDER DEVELOPMENT
**Final Drive destination (verified):** https://drive.google.com/drive/folders/1FPhc8qDloCwxSRxTq-X6i3t5b8DYkPaQ

## Mandatory closure rule

Do not claim “IAICT project completed / handed over” before the full source-code archive and associated documents are uploaded to Drive, verified, restored and explicitly accepted by the IAICT owner. A final Google Drive folder created now is **not** a backup and does not satisfy this obligation. Keep Issue #38 OPEN until all checks and acceptance evidence are recorded.

## Final archive composition (separate artifacts)

| Name convention | Content | Exclusions / security |
|---|---|---|
| `IAICT_source_<release>_<SHA12>_YYYYMMDD.tar.gz` | Complete tracked software source at approved Git SHA: application, reusable components, tests, forward-only migrations, agent skill, nonsecret config examples, docs and deployment scripts | No .env secrets, runtime key/value dump, plaintext credentials, caches, node_modules, test videos/screenshots, raw D1/R2 data, Git credentials |
| `IAICT_git_history_<release>_YYYYMMDD.bundle` | Optional Git bundle: repository refs/history for disaster recovery | Must independently inspect for historical secrets, leaked tokens, oversized sensitive binaries; **do not create/upload automatically** |
| `IAICT_documents_<release>_YYYYMMDD.zip` | Approved scope, ADR, runbooks, test catalog/run ledger, QA links, requirements, release notes, installation, restricted assets inventory (not actual secrets) | Classify each file before publishing |
| `IAICT_recovery_<release>_YYYYMMDD.md` | Exact environment dependencies, installing, bootstrap/migrations, test/build and rollback instructions | Credentials entered from authorized secret manager only |
| `IAICT_manifest_<release>_YYYYMMDD.json` | Canonical SHA, release tag, timestamps, file names, bytes, SHA-256 digests, Drive IDs, approvers and verification outcomes | Never include bearer storage URLs or secrets |

**Important:** GitHub code snapshot is not a backup of live D1/R2 data, operational secrets, DNS or Cloudflare configuration state. If a full operational restore is required, create separate explicitly approved, encrypted, access-controlled DB/object backups with verified retention and restore procedures. Never mix these with a broadly shareable code archive.

## Phase 1: freeze and inventory

1. IAICT owner approves release name and immutable Git SHA; verify branch/tag and all PRs merged. Choose a source snapshot from that SHA, **not the latest changing branch**.
2. Inventory Git submodules and Git LFS. `git archive` alone does not include populated submodule repositories or download LFS objects; resolve explicitly or document unsupported files.
3. Check Git tree for secret-pattern paths, archived keys, private backups, real PII and accidental binaries. Run secret scanner approved by Security. A filename denylist is insufficient: scan content and, for Git bundle, relevant history.
4. Obtain reviewed `SOURCE_INCLUDE_LIST` / `SOURCE_EXCLUSION_LIST`; for an unsafe tracked file, create a corrected clean release commit. Do not silently delete a required source file from archive without recording the omission and acceptance.

## Phase 2: export and integrity

1. Use a clean, authorized Git checkout of approved SHA. Example code-only export (after source sanitization): `git archive --format=tar --prefix=iaict-portal/ <APPROVED_SHA> | gzip -n > <ARCHIVE>.tar.gz`. It does NOT export untracked local files, credentials or Git history; still scan tracked contents before upload.
2. Record `git rev-parse HEAD`, tag ref, `git ls-tree -r --name-only <APPROVED_SHA>`, archive path count and byte size; compute SHA-256 using `sha256sum <archive>` and store in manifest.
3. Inspect the archive by extracting **in an isolated scratch directory** and scanning for secrets, oversized files and expected required paths. Validate checksum, file list, project layout and parsability. Ignore unsafe symbolic links during validation.
4. If authorized to include history, create Git bundle from allowed refs, scan history and verify `git bundle verify` on a separate clean clone; this is **not** automatic.
5. Prepare manifest with exact schema:
   - `schemaVersion, project, releaseId, approvedGitSha, releaseTag, generatedAtUtc, artifacts[{name, bytes, sha256, contentType, gitSha?, driveFileId?, verificationStatus}], dependencies, excludedMaterial, responsibleRole, approvalLink, restoreTestRunId`.
   - Keep SHA-256 lowercase hex, lengths exact, artifact names immutable, no secrets.
6. Upload artifacts to the verified `FINAL_HANDOFF` folder in Drive. Read back Drive metadata and, if feasible, download/materialize each artifact to recompute checksum against the manifest. Merely observing filename or upload status is **not** hash verification.

## Phase 3: full restore & acceptance

1. Recover source **from Drive**, not GitHub, into an isolated clean environment with no production secrets.
2. Verify SHA-256, extract and install locked dependencies, check scripts, schema migration checks, full unit tests, typecheck, build and browser tests; note tooling versions and unsupported flows.
3. Verify deployment configuration templates are documented and that D1/R2/Access restore responsibilities are explicit; do not apply real production migrations in a restore drill.
4. Record an immutable QA run (`RUN-DELIVERY-YYYYMMDD-NN`) with actual PASS/FAIL/BLOCKED, commit SHA, archive checksum, environment, evidence links to Drive, tests and reviewer sign-off. Failed restore blocks completion.
5. Reviewer checks folder permissions against intended handover recipient, verifies all required deliverables, then owner signs `ACCEPTED` decision with timestamp. Close Issue #38 only after that.
6. Any later patch/hotfix gets a **new immutable archive + new manifest + delta approval**. Preserve prior archives; don't replace historical accepted artifacts.

## Failure safeguards

- Missing credentials/permissions/tools: mark BLOCKED and record exact missing entitlement, **never** work around by public sharing.
- Git tracked secrets/history exposure: quarantine release and report; follow incident process to revoke leaked credentials; don't upload unsafe archive.
- Drive API reports quota/rate limit or materialization failure: stop, keep archive local/secure, no “done” statement.
- Never keep full user database or private R2 objects inside a code archive. Sensitive database backups need separate encryption, owner authorization and retention policy.
- Production must not be mutated while preparing or testing archived code.

## Source and governance references

- `docs/project/DRIVE_REGISTRY.md`, `docs/project/OPERATING_MODEL.md`, `AGENTS.md`, `.agents/skills/iaict-project-management/SKILL.md`.
- Git archive (Git reference): https://git-scm.com/docs/git-archive
- Git bundle (Git reference): https://git-scm.com/docs/git-bundle
- NIST SSDF: https://csrc.nist.gov/pubs/sp/800/218/final
