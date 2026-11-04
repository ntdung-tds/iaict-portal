# Media R2 B3.10 — Isolated image scanning, attested private evidence and CAS cleanup

**Date:** 2026-11-04 · **Disposition:** IMPLEMENTED SOURCE / UNDEPLOYED / HOSTED MEDIA NOT_RUN  
**Scope:** [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39), Owner request to group tasks.

## Consolidated tasks

1. **Isolated scanning implementation** (`services/media-scan/scan_image.py`): real ClamAV `zINSTREAM` UNIX socket protocol (scan original and derivative), real Pillow 13 full JPEG/PNG/WebP pixel decode/re-encode to metadata-free WebP, strict 10 MiB / 25 MP / 8192 px limits, no animations, timeout, exclusive file output, input SHA binding and HMAC-SHA256 signed receipt. No HTTP server and no IAM integration. Unit tests use a **synthetic local ClamAV socket**, *not real malware detection*. Production runtime sandbox/ClamAV missing.
2. **Receipt authentication** (`lib/media-scan-attestation.ts`): HMAC binding of upload UUID, D1 revision, policy, source hash/MIME, derivative key/hash/size/dimensions, nonce, engine and timestamp; strict canonical cross-runtime JSON; 15-min freshness and future-clock guard; reject tamper, stale, wrong owner scope/source ID, oversize, malformed signature.
3. **Forward-only D1 migration** `0026_media_r2_scan_evidence.sql`: private evidence table `media_r2_scan_evidence`; original 0025 NULL-only scanner/derivative checks remain immutable. No new AVAILABLE/public GET/REVIEW_APPROVED state; evidence is `SCAN_PASSED_PRIVATE` only. Production and hosted staging D1 migrations **not applied**.
4. **Private R2 readback and CAS** (`lib/media-r2-scan-evidence.ts`): only a trusted server caller with provisioned scanner/HMAC may check source+derivative R2 objects and SHA-256 before transactional D1 revision CAS, private receipt and audit. No HTTP route calls this helper; client cannot supply receipts as permission to publish. Actual hosted scan flow is blocked pending secure scanner service, job runner, secret binding and staging migration.
5. **Retention**: purge both D1-owned source and staged private derivative keys with strict key shape and rollback-safe retry; if scan receipt table absent, deletion fails closed. Test against disposable Miniflare D1/R2 with actual byte readback; synthetic HMAC signing in tests is not a real service.
6. **QA and gates**: TypeScript unit, Python Pillow with synthetic local AV socket, browser regression and public old-Worker smoke, migration digest/CI. All CMS-MEDIA-001..012 genuine authenticated hosted cases remain NOT_RUN.

## Operator checklist before any hosted release

- Deploy isolated private scanner service with ClamAV signature updates, pinned image, secret manager, egress restrictions, CPU/memory/concurrency/disk and service authentication; independent real malicious fixture and ClamAV health checks. Do not transmit original bytes to third parties.
- Implement a trusted private job runner to read quarantined R2 and verified D1 metadata, invoke isolated scanner, stage derivative to exact private R2 key, submit signed receipt to trusted server consumer. No public webhook accepted. Rotate HMAC secrets and cover multi-key rotation + independent audit. A local Python process is **not** a hosted service.
- Back up hosted staging D1 and verify migrations 0025 and 0026; prove role-authorized 8-user true browser E2E, negative IDOR/CSRF/replay/races/image bomb/AV failure, R2 SHA readback, retention and rollback.
- Implement separate approval/review/publish workflow after actual operational evidence; do not infer `SCAN_PASSED_PRIVATE` means publishable. Current scanner configured flag **false** and Worker `MEDIA_R2_QUARANTINE_ENABLED=false` in staging and production; no public route or Worker deployment.
- Keep existing Cloudflare Access staging protections; IAM owner-PAUSED; SRS FROZEN; production HOLD; Cloudflare Preview issue #32 and staging intermittent 503 #30 independent.
- Screenshot/visual evidence is private Drive-only, not GitHub.

## Sources

- [ClamAV official clamd zINSTREAM protocol](https://docs.clamav.net/manual/Usage/ClamdProtocol.html).
- [Pillow 13.0.0 release](https://pypi.org/project/pillow/).
- [B3.8 private quarantine foundation](MEDIA_R2_B3_8_QUARANTINE_PIPELINE_2026-11-04.md), [B3.9 request isolation](MEDIA_R2_B3_9_ISOLATION_QUOTAS_2026-11-04.md).
- [QA run ledger](../../qa/IAICT_TEST_RUNS.md), [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39).

**Acceptance only for source/test contracts, not full hosted Media.** NO production/staging D1/R2/Worker changes.
