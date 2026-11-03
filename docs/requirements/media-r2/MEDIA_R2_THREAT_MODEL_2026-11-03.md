# CMS Media / R2 — Threat model and gated QA contract (DESIGN ONLY)

**Date:** 2026-11-03 · **Baseline source:** development SHA `844f7ddf37d2314eed55f1fe3f766e6610684226` · **Issue:** [#39](https://github.com/ntdung-tds/iaict-portal/issues/39) · **Change:** `CHG-MEDIA-R2-20261103-01`
**Status:** PROPOSED / NOT APPROVED for runtime activation. This is a design and test gap closure only; do not treat this as an approved SRS, deployed upload API or evidence of a secure R2 release.

## 1. Verified existing boundary and gaps

- Existing `cloudflare.config.ts` defines staging-only `MEDIA_BUCKET: bindings.r2({name:"iaict-portal-staging-media"})` and `undefined` for production. Related legacy R2 staging notes state **no public R2 hostname**.
- Existing `app/api/admin` has `cms` and `news` routes; `app/api/admin/cms` contains no dedicated media upload route in the reviewed tree. The code/config audit does **not** establish runtime upload acceptance.
- No dedicated `CMS-MEDIA` case existed before this design slice (112-case prior registry). Do not mistake API absence for a negative live security test.
- IAM is owner-PAUSED, real Media CMS role/browser E2E NOT_RUN; no new hosted D1/R2 test mutations and no Worker deployment in this task.

## 1B. Real Cloudflare R2 read-only verification (2026-11-03)

At the time of this separate **read-only** provider API query, `iaict-portal-staging-media` existed in **APAC**. Managed `r2.dev` public access was **disabled**, and the custom-domain list had **0** entries. A lifecycle query returned exactly one enabled rule, **Default Multipart Abort Rule**; this is **not** an application-level object expiration/retention/deletion policy. The CORS policy query did not complete successfully (do not claim CORS is configured or unconfigured).

Scope of evidence: **PASS_READ_ONLY_BUCKET_METADATA only**. No object key listing, no bytes read, no upload/delete, no Cloudflare changes, no Worker binding or authenticated CMS API E2E. Media runtime gates and test cases `CMS-MEDIA-001..012` remain **PLANNED/NOT_RUN**. The same observation is recorded in Google Master QA v2.13.

## 2. Trust zones and attack surfaces

| Boundary | Threat / possible failure | Proposed control / release gate |
| --- | --- | --- |
| Browser → authorized CMS route | Unauthenticated requests, role confusion, CSRF, forged Origin, stale privileges | Server-side identity and action-specific RBAC, CSRF/Origin, fail-closed session checks; cross-role negative tests `CMS-MEDIA-001/002` |
| Request → stream/file parser | MIME/extension spoof, executable content, oversized chunk streams, decompression/metadata abuse | Strict allowlist **to be approved**, MIME + signature + extension verification, total byte cap during stream, refuse unapproved SVG/HTML, robust error bounds `003/004` |
| Client filename → object key | Path traversal, key collision, names containing private data | Generate unguessable server-side IDs and versioned quarantine namespace, never use filename as object path `005` |
| Quarantine → scan → published media | Malware; scan service outage; premature public access | Private default, quarantine, scan/failure states, promotion after scan **and** authorized content approval; no direct public bucket hostname `006/009` |
| Worker → D1 + R2 | D1/R2 lack a shared atomic transaction, orphaned objects, duplicate retries, stale metadata | Explicit state machine + recoverable compensating actions + idempotent upload token + audited ownership `007/008` |
| Read/delete/retention | IDOR, cross-owner reads, stale links after revoke, retention mistakes | Resource-level auth, revocation, private delivery, lifecycle cleanup, audit `009/010` |
| Rate/observability/privacy | Quota exhaustion, embedded EXIF GPS, secrets in logs, leaked IDs | Role/quota/rate budget, privacy metadata stripping where applicable, redact sensitive logs and error messages `011` |
| Staging release boundary | Synthetic tests mistaken for hosted proof; production impact | Pinned exact SHA, authorized role browser, disposable R2/D1, cleanup/recheck, production NO-GO `012` |

## 3. Proposed lifecycle and invariant (not implemented)

`RECEIVING → QUARANTINED → SCAN_PENDING → SCAN_PASSED → REVIEW_APPROVED → AVAILABLE`.

`SCAN_FAILED / REJECTED / REVOKED / DELETED` never serve bytes; scanner unavailable means fail-closed. A durable record should connect opaque object ID, owner/scope, upload idempotency key, content hash, byte count, validated media type, scan version/verdict, publication approval, revision, audit ID and retention policy. R2 object write and D1 record cannot be assumed atomic. Record before/after writes with a resumable cleanup protocol and test injected failure at every transition. Any served URL must enforce status and permission; do not make the whole bucket public.

This is a candidate lifecycle only. No schema migration or behavior change is authorized by this document.

## 4. Open decisions — resolve before backend implementation

1. **Supported types:** propose initial still images JPEG/PNG/WebP only. PDF/other attachments, SVG, animated formats and video require separate explicit policy; inspect actual CMS usage before freezing.
2. **Limits:** maximum upload size, image dimensions/pixel count, request body cap, tenant/owner quota, per-actor burst limits and retention durations are **NOT DECIDED**. No invented deployed limit.
3. **Scanning:** select scanning architecture/provider, failure behavior, budget and how quarantine objects are made unreachable; never interpret extension-only filtering as antivirus.
4. **Authorization:** agree media upload/read/delete/publication actions per actual CMS roles. IAM owner-paused: cannot use absent legitimate sessions as PASS.
5. **Storage schema:** decide D1 metadata tables/transactions, orphan reconciliation, key namespace/versioning, safe URL delivery and whether transforms/re-encoding strip EXIF.
6. **Environment:** staging-only disposable test namespace and rollback; Cloudflare Access/hosted D1 changes or credentials require separate verified release/owner gate.

Unapproved choices should remain PROPOSED or CHƯA_CHỐT. Record future approved changes in `docs/requirements/media-r2/thaydoi.md`; never silently edit baseline SRS.

## 5. Acceptance and QA traceability

Existing GitHub CSV is canonical. Added `CMS-MEDIA-001..012` with priorities P0/P1 and `case_state=PLANNED`, `automation=MANUAL` because **no media API/test harness exists**. Execution record: `RUN-MEDIA-20261103-01` **NOT_RUN DESIGN ONLY**; no claim of passing these 12 cases. Google Master QA must mirror this exact case set, count and status, with readback before declaring sync complete.

- **Next narrow implementation task (separate PR):** after decisions, add typed *server-side validation contract and deterministic unit/security fixture tests* for approved MIME/bytes/size/name/key; no hosted upload by default.
- **Following distinct tasks:** private upload/quarantine API, scan integration, recoverable R2/D1 metadata, authorized read/revoke, CMS UI and actual staging acceptance, each with `CHG ↔ case ↔ run ↔ SHA ↔ Drive` traceability.
- **Gate to close Issue #39:** all 12 cases mapped to actual automated/manual test runs at appropriate layers, real authorized CMS staging browser and isolated R2 readback PASS, scanner/quarantine policy implemented, rollback verified and owner acceptance. Until then Issue stays OPEN.

**Evidence policy:** [restricted Drive QA](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3); no credentials, real user files, private test screenshots or tokens in GitHub. No QA images required for this document-only slice.

## 6. B3.2 pure contract boundary — no live activation

The isolated `lib/media-upload-contract.ts` adds preflight checks for filename safety, MIME/extension/file-signature matching for synthetic JPEG/PNG/WebP fixtures, declared and actual byte lengths, and UUIDv4-only private quarantine key generation. The caller **must** pass an explicit policy. No production/staging default MIME/size policy exists in this helper. The helper is not imported by any API, Worker or UI.

Passing preflight proves only small local input invariants. It **does not** prove a fully decoded image, malware-free payload, sanitized metadata/EXIF, streamed memory cap, quotas, authorized upload, object lifecycle, scanner, signed download or public visibility. Existing external-URL media CMS remains unchanged. Exact CI and `CMS-MEDIA-013..015` check only this narrow scope; all real hosted cases `001..012` remain NOT_RUN.
