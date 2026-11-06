# IAICT isolated Media scan runner (B3.10, **NOT DEPLOYED**)

One-shot Python/Pillow 13.0.0 process running in a hardened, network-restricted sandbox with a local ClamAV daemon via UNIX socket. Not a public HTTP endpoint. The worker has no supplied credentials/service yet.

* A trusted job runner (not included) reads private R2 quarantine bytes and confirms D1 upload id, source SHA, scope and revision. It supplies a private local input file, a restricted HMAC secret file (mode 0600), daemon socket and exclusive destination file to `scan_image.py`.
* Scans original with ClamAV zINSTREAM, enforces actual full Pillow decoder for JPEG/PNG/WebP with pixel/dimension/animation caps, strips metadata by reconstructing pixel buffers into a new WebP, scans derivative again, then signs a receipt binding original SHA/revision, derivative SHA/size/key and dimensions. Writes only a local file; **does not upload it to R2 or mark it approved**.
* The trusted job runner must upload derivative into private R2 at the exact receipt key, read back both original and derivative bytes for matching hashes, and call the separate D1 CAS evidence adapter with a runtime HMAC secret. Never use a public URL or permit clients to provide the receipt themselves.
* Failure (no ClamAV, infected/unknown response, malformed image, animation, timeout, unsupported MIME, bad source hash, no secret) denies the job, emits no usable receipt. Do NOT treat local fake-clamd fixture tests as proof of malware detection.
* This module must be deployed into a separate isolated image with pinned OS/Pillow/ClamAV, egress denied, security signature feeds kept fresh, CPU/memory/time quotas, single-use files and secret-manager provisioning. A real ClamAV health/virus test, service auth, R2 bridge and recovery remain **BLOCKED**.
* No production or staging changes, no Cloudflare Workers `MEDIA_R2_QUARANTINE_ENABLED` update, no IAM work.

Test locally (isolated mock socket only):
```bash
python -m pip install -r services/media-scan/requirements.txt
PYTHONPATH=services/media-scan python -m unittest discover -s services/media-scan -p 'test_*.py'
```

ClamAV INSTREAM framing: https://docs.clamav.net/manual/Usage/ClamdProtocol.html


## B3.11 real malware-engine CI (not a hosted service)

A **separate**, optional-cost GitHub Actions workflow [media-av-real-engine-ci.yml](../../.github/workflows/media-av-real-engine-ci.yml) runs `real_clamd_acceptance.py` against an actual ClamAV daemon and signature database. It uses the harmless EICAR antivirus test string and verifies the response includes both `Eicar` and `FOUND`, then proves the genuine `scan_clamd` function rejects it. It also checks that a clean PNG with metadata is scanned, decoded/re-encoded to WebP, rescanned and signed, and that a bad source SHA cannot produce a derivative.

The ClamAV Docker process is a disposable **CI-only** environment (4–5 GiB RAM recommended) exposed solely on loopback `127.0.0.1`, relayed into a mode-0600 UNIX socket; no user media or secrets are used. A PASS means a real engine and the existing scanner function interact successfully in **CI**. It is NOT evidence of scanning actual hosted R2 objects or of a deployed secret/ClamAV service.

The Cloudflare Containers API is currently **HTTP 401 / unauthorized** on the project connection, so the hosted scanner cannot be provisioned. Staging D1 media migrations 0025/0026 have been applied with a Time Travel bookmark, but no new staging Worker, scanner, job runner or upload gate was enabled. Consult [B3.11 operational gate](../../docs/requirements/media-r2/MEDIA_R2_B3_11_STAGING_RELEASE_GATE_2026-11-04.md).

Do not copy the CI test signer secret into any runtime. A production-grade scanner needs independent secret management, an authenticated private job bridge, R2 delivery and a hosted EICAR scan before the Media upload flag can turn on.
