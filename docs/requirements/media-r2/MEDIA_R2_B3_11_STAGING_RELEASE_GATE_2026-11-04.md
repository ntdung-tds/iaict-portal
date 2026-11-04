# Media R2 B3.11 — Staging database readiness and REAL scanner acceptance

**Date:** 2026-11-04 (Asia/Bangkok)  
**Outcome so far:** STAGING D1 0025/0026 APPLIED · real ClamAV hosted **BLOCKED by Cloudflare Containers HTTP 401** · new Worker upload gate **OFF** · **NOT an approved Media release**.

## Actual Cloudflare staging migration (executed, not theoretical)

- Account: IAICT-managed Cloudflare. Only database `iaict-portal-staging-db` was changed. Production D1 and both Workers were NOT changed.
- **Preflight:** `d1_migrations` showed latest `0024_iaict_activation_invites.sql`; neither Media table existed; `admin_users` existed.
- **Time Travel bookmark before migration**: `0000088c-00000000-00005119-76aa9aed51901ec93f3e3c545bc7b1fd`. This is Cloudflare-managed point-in-time recovery, **not a separately exported durable SQL backup**. Bookmarks expire after the service's retention window (7–30 days depending on plan). Never invoke restore automatically; it overwrites the entire staging database and could erase subsequent unrelated changes.
- Forward-only `0025_media_r2_quarantine.sql` applied from **exact immutable Git blob** `c8320af6c2cc559a016858195ede064d3caa15b0`: 1 FK PRAGMA, 1 table, 3 indexes; `d1_migrations` updated **only after** table existence verified.
- Forward-only `0026_media_r2_scan_evidence.sql` applied from **exact immutable Git blob** `9688defdc38831f5caf7e88a07740bbe907ccf96`: 1 FK PRAGMA, 1 table, 1 index; ledger updated **only after** table existence verified.
- **Hosted readback:** both table names and four indexes present, both migration ledger names present, both Media tables have **zero records**, `PRAGMA foreign_key_check` returned no rows. **`PRAGMA integrity_check` was rejected with `SQLITE_AUTH` by the D1 API**; NOT_RUN/UNSUPPORTED, never report as PASS. No source/derivative R2 object write or user-account mutation performed.
- **Bookmark after migration:** `0000088c-00000012-00005119-41470e9c6ac51928d3c27fcb5c2ecbe8`.
- Schema migration alone does NOT enable scanner, upload, read, review or publication. `MEDIA_POLICY.scan.serviceConfigured=false`; `MEDIA_R2_QUARANTINE_ENABLED=false`.

## Real ClamAV without real user data

- Dedicated [.github/workflows/media-av-real-engine-ci.yml](../../../.github/workflows/media-av-real-engine-ci.yml) uses an official ClamAV `stable` image confined to a disposable GitHub runner and loopback port `127.0.0.1:33199`. A local UNIX relay permits the **actual B3.10 `scan_clamd()`** function to connect.
- `services/media-scan/real_clamd_acceptance.py` fails closed unless the real daemon responds `PONG` and a harmless official EICAR fixture returns `FOUND` (not just generic scanner failure); tests clean PNG → WebP **scan on both original and derivative**, verified byte hashes and HMAC receipt, and source hash failure.
- **Never send a real customer's file into GitHub CI**, and never treat EICAR or fake socket tests as complete malware coverage. Official ClamAV recommends ~4 GB RAM for the engine due to signature database reload.
- Because Cloudflare Containers list API returned HTTP **401 (not authorized)** under the connected account, no hosted scanner application or container was deployed. An authorized Containers-enabled token/role and container compute at least `standard-1` (4 GiB) are needed before staging can use a real scanner; entitlement is **not verified**.
- The isolated private job runner, HMAC secret-manager setup, Cloudflare private service binding, R2 object delivery and receipt consumed by D1 CAS remain **BLOCKED / NOT_IMPLEMENTED HOSTED**. No public scanner endpoint, never put signing keys into GitHub or browser. Even genuine real-engine CI passing is NOT proof of a deployed service.

## Mandatory no-go gates before enabling the upload Worker

1. Valid operator access to provision an **isolated** ClamAV service with AV signature-update policy, 4 GiB+ runtime, CPU/disk/time budgets and no open public port. Secret rotation, service identity, scanner readiness and EICAR FOUND+negative cases verified in that **hosted** environment.
2. A trusted worker/job bridge using private R2 bytes, D1 SHA/revision, scan original and derivative, staged derivative SHA readback and private CAS audit. Authenticated service-to-service requests only; no client-supplied clean verdict.
3. Verify staging migration 0025/0026 replay idempotence and recovery, stage Worker exact source SHA and rollback guard, E2E real authorized CMS users per role, object ownership/IDOR, 10 MiB/25 MP caps, replay, races, janitor, 503/fail-closed, issue #30 retries. Review 12 hosted Media test cases, collect visuals on restricted QA Drive (not GitHub).
4. Source and hosted tests **must independently PASS** before temporarily switching feature gates ON for staging. Production and owner-PAUSED IAM never auto-deployed. Production release requires a separate explicit owner approval. SRS baseline remains FROZEN.

## Operational status

| Gate | B3.11 status |
|---|---|
| Staging D1 0025 + 0026 | **PASS, APPLIED + READBACK** |
| D1 Time Travel rollback marker | **PASS, RECORDED** (retention-limited) |
| Independent SQL export | **NOT_RUN** (do not claim one exists) |
| D1 integrity_check | **UNSUPPORTED** by provider API |
| Cloudflare Containers application listing | **BLOCKED HTTP 401** |
| Local genuine scanner EICAR test | **PENDING dedicated CI** |
| Staging real AV service / job runner / HMAC | **NOT_RUN/BLOCKED** |
| Staging Worker Media upload enabled | **NO / OFF** |
| CMS-MEDIA-001..012 real authorized browser | **NOT_RUN** |
| Production | **HOLD / NO MUTATIONS** |

References: [Official ClamAV Docker RAM and signature update notes](https://docs.clamav.net/manual/Installing/Docker.html), [Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [B3.10 source-only baseline](MEDIA_R2_B3_10_SCANNER_EVIDENCE_2026-11-04.md).
