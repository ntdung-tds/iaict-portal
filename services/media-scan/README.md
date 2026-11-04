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
