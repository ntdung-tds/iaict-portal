# CMS Media R2 — B3.4 bounded stream contract and test gates

**Date:** 2026-11-04 · **Status:** PROPOSED, PURE SOURCE / NOT WIRED · **Change:** CHG-MEDIA-R2-20261104-01 · **Issue:** [#39](https://github.com/ntdung-tds/iaict-portal/issues/39) · **Base:** `29ab47001d1db5a7d35cf4f34836d12f7e826cfa`

This is a bundled **preparatory** delivery, not approval to deploy/upload. Existing [B3.3 Owner decision register](./MEDIA_R2_B3_3_DESIGN_DECISIONS_2026-11-03.md) remains **PROPOSED**. Do not interpret the fixture limits used by local unit tests as live quotas.

## Grouped small tasks, acceptance boundaries

| Task | Deliverable | Source-level verification | Hosted acceptance |
| --- | --- | --- | --- |
| B3.4-A | Explicit, fail-closed numeric stream `maxBytes` AND `maxChunks`, one-time policy snapshot | Missing/invalid/throwing policy rejects without defaults | NOT_RUN; Owner policy MED-DEC-02 pending |
| B3.4-B | Async byte/chunk inspection, small signature prefix (12 bytes), best-effort source cancellation | Split chunks, exact boundary, over-budget and zero-progress denial, native Uint8 byte length | NOT_RUN; no Worker handler, stream forwarding, R2 writes or actual image decoding |
| B3.4-C | Adversarial synthetic fixture suite | Proxy, spoofed byteLength, non-Uint8 input, malformed iterator/stream and failed cancellation fail closed | NOT_RUN; scanner/AV/RBAC/D1/R2 absent |
| B3.4-D | Change log, append-only QA run, PCS checkpoint + CI/public browser smoke | Final exact SHA GitHub CI | Public staging smoke only targets **unchanged deployed Worker**, not this helper |

## Source-only contract: `lib/media-stream-contract.ts`

- An *explicit async iterable* must yield `Uint8Array` instances. Each yielded chunk counts against a **caller-supplied** chunk budget, including zero-length chunks. Byte count uses the intrinsic typed-array slot, not attacker-overridden `.byteLength`.
- Policy is independently provided and snapshotted once; no runtime MIME/size/byte/chunk or limit values are approved or embedded by default.
- Entire stream is **consumed and discarded**, retaining at most a 12-byte prefix. A PASS means only bounded fixture accounting. It is **not** a production upload-forwarding stream or a guarantee that input can be replayed. The code may not be connected to an API without a separately reviewed streaming adapter.
- The helper attempts to call `iterator.return()` when invalid data or a budget limit is reached. Cancellation is **best effort**, not a network deadline or guaranteed cleanup of a remote stream. Real Worker must enforce request timeouts, body abort, incoming `Content-Length` precheck, streaming backpressure, resource quotas and R2/D1 rollback separately.
- Full decode, pixel/dimension bound, decompression-bomb resistance, AV scanner/quarantine, metadata stripping, signatures over the complete image, type allowlist, public/private serving, IDOR/CSRF and atomic storage recovery **NOT_IMPLEMENTED / NOT_TESTED**. The 12-byte prefix is not reliable image validation. Neither CMS Media preflight helper nor lifecycle helper is wired to upload routes.
- On hosted integration, never call this inspector then write an already consumed stream. Use an approved bounded **forwarding** adapter with single-pass server checks, source cancellation, verified scanner, D1 reservation and recoverable R2 transaction semantics.

## Decision gate before live implementation

The Owner must explicitly approve `MED-DEC-01..07`: allowed formats, max bytes, pixels, chunk/resource rate and quota, scan provider/budget, role/ownership, retention, recovery and public delivery. The proposed 10 MiB/25 MP figures in B3.3 are **candidates only**. A generic “OK, bước tiếp theo” here authorizes this safe preparatory batch only, not hosted upload.

## QA and rollback

- Existing **127 canonical QA cases**, including 15 Media IDs, remain unchanged; Google Master v2.15 requires no edit because case definitions are not changed.
- The new fixture tests cover a *subset of the future goals* of `CMS-MEDIA-004`, but that case remains `PLANNED / MANUAL / NOT_RUN`. Actual `CMS-MEDIA-001..012` **NOT_RUN** until authenticated live staging and hosted R2/D1 checks.
- Record local test evidence as `RUN-MEDIA-20261104-01` with exact SHA and workflow links; any failures must be retained in the append-only run. Screenshots/video only in [private QA Drive](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) if real browser testing warrants an image.
- This batch only adds **unwired** code/tests and documentation. Rollback is source reversion on the development branch, not a Cloudflare action. No new D1 migration, Worker, R2 object, Cloudflare Access, IAM login or production mutation. SRS remains frozen; no final source handover.
