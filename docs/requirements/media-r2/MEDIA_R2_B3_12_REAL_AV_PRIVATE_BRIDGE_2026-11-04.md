# B3.12 — Real ClamAV → Pillow/HMAC → private R2/D1 CAS integration proof

**2026-11-04 · SOURCE/CI ONLY · NOT DEPLOYED · NOT HOSTED MEDIA ACCEPTANCE**

## Objective and exact tested boundary

Connect the **real malware engine**, Python safe-image decoder and signer from B3.11 to the **same TypeScript HMAC verifier**, private R2 source+derivative SHA-256 readback, D1 CAS + audit and two-object cleanup from B3.10. Unlike separate tests, this proves data compatibility across both programming runtimes and the entire clean-file pathway.

1. On a disposable CI runner, pull the official ClamAV stable Docker image, wait for genuine signatures, prove EICAR harmless test string is detected with a `FOUND` verdict. The exact Python scanning function rejects EICAR.
2. Scan a benign **synthetic** PNG with real engine, fully decode with Pillow and create metadata-free WebP, scan resulting derivative with real engine. Python signs a receipt binding SHA-256, UUID, revision, MIME, dimensions, engine and nonce.
3. Write **only this synthetic** clean PNG, WebP and signed receipt into a local file mode 0600 at `/tmp/iaict-b312-real-av-fixture.json`. No GitHub artifact upload, no customer data, no secrets or images in GitHub repository.
4. In the **same runner**, `npx vitest run lib/media-r2-real-av-bridge.test.ts` loads local fixture and writes bytes to a **disposable Miniflare D1/R2** instance (not a hosted R2 bucket). It verifies the actual Python HMAC independently in TypeScript and checks both source and derivative byte hashes before D1 CAS.
5. Negative checks: deliberately tamper a private R2 derivative and require no D1 evidence, then restore bytes; verify one private `SCAN_PASSED_PRIVATE` receipt and one audit row, replay must not change revision, purge must delete **both** private objects. Original quarantine row never becomes `AVAILABLE` and no public URL is returned.
6. The default Portal unit CI does **not** have the mandatory fixture env var; the specialized integration tests are SKIPPED there. This is deliberate, never count skipped tests as PASS. The dedicated real ClamAV workflow **requires** that env var and will FAIL if the fixture cannot be produced.

## Security and operational limitations

- `services/media-scan/real_clamd_acceptance.py` writes the ephemeral synthetic fixture **only when** `IAICT_B312_REAL_AV_BRIDGE_FIXTURE` is set by CI; no real user files, no host credentials and no outbound customer data. Hard-coded test HMAC key is **test-only**, not a deployable scanner secret.
- The specialized real ClamAV GitHub workflow runs an AV Docker container bound to loopback, bridged via a protected local UNIX socket. It has no public media endpoint or Worker upload flag.
- **A PASS proves compatibility in CI, not a remotely deployed scanner.** Cloudflare Containers application API is still **HTTP 401** under current connector permissions. Actual hosted service, trusted private job runner, secret-manager HMAC, private hosted R2 reads/writes and authorized CMS role upload E2E remain **BLOCKED / NOT_RUN**.
- Existing Cloudflare staging D1 migrations 0025–0026 were applied during B3.11. B3.12 does **not** alter staging D1 data/Worker or production. Source-only PR/CI runs; scanner and upload feature flags stay false; IAM owner-PAUSED and SRS FROZEN.
- Return to hosted Media acceptance only after permission/hosting access is resolved, signed receipt identity is provisioned, and staging E2E including malicious/invalid files, IDOR, quota and backup/rollback has been genuinely exercised. Keep issues #39 Media, #30 intermittent 503 and #32 Preview open.

**QA:** `RUN-MEDIA-20261104-20`, [B3.11 staging schema and blocked host](MEDIA_R2_B3_11_STAGING_RELEASE_GATE_2026-11-04.md).

**Not approved**: staging scanner online; upload gate ON; public Media serving; production deployment; E2E CMS-MEDIA-001..012. Do not conflate isolated Miniflare D1/R2 with real hosted Cloudflare R2.
