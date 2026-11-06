# CMS Media R2 — B3.3 decision register, isolation and recovery design

**Status:** PROPOSED / NOT APPROVED · **Date:** 2026-11-03 · **Issue:** [#39](https://github.com/ntdung-tds/iaict-portal/issues/39) · **Change:** CHG-MEDIA-R2-20261103-04 · **Baseline:** development `70b73d683c5c71d9ef29a315f81efc795b8f4a0f`

This batch is **DESIGN + PURE UNWIRED CODE only**. It is not a deployed endpoint, accepted policy, scanner, secure image decoder, production authorization scheme, or proof of Cloudflare R2/hosted D1 functionality. Existing B3.2 filename/MIME/signature helper remains unwired. IAM is owner-paused; SRS frozen; staging/production Workers remain unchanged.

## 1. Policy decisions still requiring explicit Owner approval

| ID | Topic | Proposed initial choice for IAICT review | Alternatives / why not yet approved | Owner status |
| --- | --- | --- | --- | --- |
| MED-DEC-01 | File types | Still images JPEG/PNG/WebP, no SVG/HTML/PDF/active or animated content in first media release | PDF, video and animation each need independent threat model and consumption requirements | **PROPOSED** |
| MED-DEC-02 | Size/dimensions | Candidate 10 MiB per upload and 25 megapixels post decode; enforce both raw stream cap and decompressed image dimensions | Owner to choose actual limits based on CMS use and cost; 10 MiB/25 MP are **NOT runtime defaults** | **PROPOSED** |
| MED-DEC-03 | Malware/invalid content | Isolated private quarantine; asynchronous scanner with explicit clean verdict plus trusted full decode/metadata re-encode before review; scanner error or timeout fails closed | Choose provider, budget, retry ceiling, signature/version pin, operational ownership; do not mark extension/magic-byte as malware scan | **PROPOSED** |
| MED-DEC-04 | Role and ownership | Capability-based `media:upload`, `media:review`, `media:publish`, `media:read`, `media:delete` with exact asset scope and per-action session checks | Real seven-role allocation needs explicit approval; no blanket `editor`/Admin inference or IAM changes | **PROPOSED** |
| MED-DEC-05 | Visibility and retention | R2 private always; server-controlled authenticated reads. Quarantined/failed data expires via an approved cleanup process; deleted/revoked not served | Object TTL, tombstone duration, public delivery/CDN invalidation and legal retention are **UNDECIDED** | **PROPOSED** |
| MED-DEC-06 | Quotas and privacy | Per-actor + per-scope size/count/rate quotas and metadata minimization. Strip GPS/EXIF when re-encoding publishable derivatives | Numeric quotas, log retention and exception process **UNDECIDED** | **PROPOSED** |
| MED-DEC-07 | D1/R2 recovery | D1 reservation/idempotency ledger + durable state and revision CAS; R2 opaque quarantine keys; periodic orphan reconciliation | Scanner queue and recovery execution environment require architectural decision | **PROPOSED** |

**Gate:** the Owner must approve the specific policy values and scanner/ownership design before any hosted upload route, R2 write, D1 migration, authenticated role QA or staging release. A routine "OK, bước tiếp theo" only authorizes continued bounded development, not those decisions.

## 2. Minimal staged contract (not implementation)

1. **Request admission:** authenticate with native CMS session *and existing Cloudflare Access*; verify scope/action, CSRF/Origin, content length when present, rate budget and a request idempotency token. Never allow direct unsigned client R2 writes by default.
2. **Reserve:** D1 unique key `(scope_id, actor_id, idempotency_key_hash)` identifies exactly one logical request. Store ephemeral reservation with generated UUIDv4 key. Raw idempotency tokens are not logged. Return the same authoritative state for duplicate retries, not a second write.
3. **Receive:** count stream bytes incrementally and abort beyond approved cap, including chunked transfers. Quarantine key is opaque and never derived from display filename. Reconcile R2 object success with D1 reservation via compensating cleanup, not a fictional cross-service transaction.
4. **Quarantine:** only after confirmed R2 object persistence and metadata verification create/advance the durable `QUARANTINED` state; the new pure lifecycle helper starts here. No user-facing URL or public hostname.
5. **Scan/review:** `QUARANTINED → SCAN_PENDING → SCAN_PASSED → REVIEW_APPROVED → AVAILABLE`. Scanner proof and independent review decision are externally attested, versioned, and checked **inside** the actual server transaction. The pure graph alone has no proof.
6. **Failure/revocation:** scanner error, timeout, mismatch or rejected review goes to non-serving terminal states; revocation immediately denies reads, then cleanup transitions to `DELETED` when authorized and verified. A stale worker retry must lose a D1 conditional update.

**Required D1 invariant:** a status transition must be committed with a single conditional statement equivalent to `UPDATE media_assets SET status=?, revision=revision+1 WHERE id=? AND status=? AND revision=?`; accept only exactly one affected row; bind owner/scope and attestation prerequisites to the transaction; audit the authorized action with the same effective revision. The returned pure `expectedRevision` is a proposed compare-and-swap value, **not evidence** of actual CAS or D1 concurrency safety.

**Required read invariant:** every private/public byte-serving path verifies authenticated scope (or a separately approved published-delivery policy), `AVAILABLE` state, current revocation epoch and actual object key ownership at time of read. Never allow `SCAN_PASSED` or `REVIEW_APPROVED` alone to serve bytes. Disable or invalidate stale caches before claiming revoke works.

## 3. Failure injection, cleanup and negative QA

| Failure injection | Safe expected behavior | Existing future QA case |
| --- | --- | --- |
| R2 upload succeeds, D1 state update fails | quarantined orphan remains nonservable; retry reconciler identifies/delete or finalizes by verified reservation | CMS-MEDIA-007 |
| D1 reservation succeeds, R2 write fails | failed reservation not AVAILABLE; expire/compensate without pretending object exists | CMS-MEDIA-007 |
| Concurrent duplicate idempotency keys | one logical asset, at most one successful conditional state advancement; deterministic retry/recovery | CMS-MEDIA-008 |
| R2 scan positive, timeout, unavailable or corrupt | no promotion; deny reads; record scanner outcome and bounded retry/failure | CMS-MEDIA-006 |
| Stale approval/old revision after revocation | zero-row CAS; no reactivation and no stale public read | CMS-MEDIA-007/009/010 |
| Cross-scope roles or forged Origin | authorization/CSRF denied **before** storage; no information disclosure/IDOR | CMS-MEDIA-001/002/009 |
| Oversized chunked request, image decompression bomb, spoofed signature | bounded stream and decoder reject; never assume B3.2 signature helper proves safe image | CMS-MEDIA-003/004/011 |

The existing **127 canonical QA cases remain unchanged** in this design batch: 15 Media IDs total. `CMS-MEDIA-001..012` are still `PLANNED/NOT_RUN`. The new `lib/media-lifecycle-contract.test.ts` assertions are exploratory **local unit checks for a pure graph only**; they do **not** mark hosted case `006/007/008/009/010` PASS and do not require changing the living Google QA case catalog. If a standalone automated case is later registered, update GitHub CSV + Google Master and independently read back in the same delivery.

## 4. Next implementation increments after decisions

- **B3.4:** enforce approved server policy on real streaming parser and tested decoder; route remains disabled until prerequisites met.
- **B3.5:** D1 reservation/idempotency and private R2 quarantine adapter, failure injection with disposable local D1/R2; no old migration modification.
- **B3.6:** scanner + verified attestation + server-enforced state CAS/audit and authorized read/revoke.
- **B3.7:** responsive CMS UI and true authorized staging E2E with synthetic accounts, R2/D1 readback, cleanup and rollback, evidence to private Drive only.

At each increment use small PRs, exact SHA CI and separate TEST RUNs; do not conflate old public staging smoke with new hosted Media behavior.

## 5. Rationale and rollback

This proposal uses the smallest secure boundary: a **pure, unconnected state planner** supporting fail-closed graph checks without imposing an unapproved scanner/provider or numeric runtime policy. If policy changes, update the proposed design and new code through PR/CHG; removing this unused module requires no Worker rollback. When hosted integration eventually exists, rollback must be a pinned Worker and schema-safe forward-only migration/compensation plan. No release or production action is authorized here.


## Resolution — 2026-11-04 (append-only)

This is the **historical proposal** of MED-DEC-01..07. The Owner's 2026-11-04 direct delegation to the AI Technical Lead resulted in the selected [ADR-MEDIA-20261104-01](../../adr/ADR-MEDIA-20261104-01.md), with all seven technical policy choices **ACCEPTED FOR STAGING IMPLEMENTATION**. Do not treat the old table's `PROPOSED` label as the current decision. This acceptance **does not provision an actual scanner**, approve production, release a hosted R2 upload API, close CMS-MEDIA-001..012 QA, or alter the FROZEN SRS.
