# IAICT Portal — CMS-08 / S2: KDF compatibility verification plan

**Date:** 2026-11-02 (ICT) · **Status:** LOCAL_WORKERD_OBSERVED (100000/100001); 600000 NOT_RUN; live staging NOT_RUN · **Scope:** P0-B in [Project Plan](../project/PROJECT_PLAN.md) and CMS-08/S2 in [Checklist Moment](../project/CHECKLIST_MOMENT.md).

## Why this step exists

The source `lib/native-auth.ts` currently pins PBKDF2-HMAC-SHA-256 at `100_000` iterations for password credentials, with a workerd-limit comment; `lib/native-auth.test.ts` already exercises ordinary salted hash/verify using that setting. Historical CI confirms those unit tests in Node/Vitest, **not** an independent boundary measurement on Cloudflare Workers. The earlier research document proposes probing `100_000`, `100_001` and `600_000` iterations. These are **proposed experiment inputs, not an approved change to password policy or SRS**.

**Goal:** produce bounded, reproducible, nonsecret evidence of PBKDF2 `deriveBits` compatibility in the intended Worker runtime before considering any KDF/migration/credential-policy change.

## Observed baseline and distinctions

- **Code baseline:** `lib/native-auth.ts` exports `PBKDF2_ITERATIONS = 100_000`; `derivePassword` rejects credentials whose `iterations` do not equal this value. That *application guard* is separate from the *underlying runtime's actual limits*.
- **Unit evidence:** `IAM-AUTH-004` is in `docs/qa/IAICT_TEST_CASES.csv`; existing Vitest exercise the current 100k credential path. They do not prove the exact runtime behavior for 100001 or 600000.
- **MFA baseline:** `lib/totp.ts` / `lib/totp.test.ts` test only the RFC 6238 primitive; `docs/adr/0002-iaict-native-mfa-totp-staged.md` remains **PROPOSED**. No MFA enrollment, encrypted secret storage, replay-safe D1 challenge, recovery or Access cutover is authorized by this document.
- **Cloudflare documentation:** [Workers Web Crypto API](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) describes the supported API, but an exact 100k runtime boundary is **not independently established by the document review recorded here**. Measure it on the targeted runtime instead of asserting it.

## Test design — proposed cases, not yet added to the canonical QA CSV

| Proposed ID | Isolated runtime input | Expected evidence | Current status |
| --- | --- | --- | --- |
| `KDF-S2-P01` | PBKDF2 SHA-256, synthetic fixed password/salt, 100000 iterations | success/failure, exception name, runtime version, measured duration; no derived bytes logged | **PASS local**, 256 bits / 11 ms |
| `KDF-S2-P02` | Identical inputs, 100001 iterations | observe real runtime success or rejection and exact sanitized error class; no assumed outcome | **PASS local**, 256 bits / 12 ms |
| `KDF-S2-P03` | Identical inputs, 600000 iterations | optional bounded boundary probe after resource/runtime gate; record if deliberately SKIPPED for safety | NOT_RUN |
| `KDF-S2-P04` | Current `createPasswordHash` / `verifyPasswordHash` on isolated synthetic fixture | existing 100k application contract remains compatible and salted/hashed; test suite tied to SHA | NOT_RUN (new run) |
| `KDF-S2-P05` | Disabled/expired/nonmatching credentials and unsupported `iterations` metadata | application rejects invalid state without issuing a session; use existing negative tests as baseline | NOT_RUN (new run) |

**Execution constraints:** Run the lowest-risk, read-only/synthetic probes first in local `workerd` / Wrangler isolation (not generic Node as substitute). No persistent test route, no Cloudflare Access bypass, no real user account or D1/R2 binding, no credential mutation, no session creation. Limit to one derive call per iteration candidate and avoid looping/benchmark stress. Capture runtime version, compatibility date/flags, code SHA, invocation result and relevant timing/error class. Store **no password, salt, derived bits, tokens or identity data** in logs or GitHub.

A local workerd result is **LOCAL_WORKER**, not live staging evidence. If actual staging runtime proof is needed, propose a separately authorized isolated non-production diagnostic Worker with no privileged bindings, bounded access, reviewed source SHA, cleanup and rollback; **do not deploy it under this plan**. The production Worker, deployed staging Worker, D1, R2 and Access settings must remain untouched.

## Decision and completion gate

1. Review test design and risk of high iteration count; if needed, limit `600000` to a separate approved execution.
2. Implement or use an ephemeral local workerd harness; record code SHA and positive/negative observations; add verified cases to canonical `IAICT_TEST_CASES.csv` only when implementation and QA management are ready, then synchronize its living Drive copy.
3. Append a **new** `RUN-IAM-...` record with exact SHA/runtime and outcomes for each executed case. Never mark `NOT_RUN` cases PASS. Screenshots are not necessary for a pure crypto measurement; if ever captured, private [IAM QA Drive folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) only.
4. Review measured Worker behavior and `ADR-0002`, deciding whether the current 100k credential policy stays or any new architecture/migration is proposed. No automatic SRS synchronization, KDF parameter change, or production Access change.

**Completion criterion for S2:** real bounded workerd results, evidence-linked test run and reviewed architectural conclusion. **Writing this plan is not S2 PASS or S2 DONE.**

## Execution evidence — 2026-11-02 (local workerd only)

[GitHub Actions run #41384536088](https://github.com/ntdung-tds/iaict-portal/actions/runs/41384536088) at exact code SHA `82380adafceaa239f24438ee85fa8ef10cc9d343` ran two probes in isolated workerd `1.20261012.1` (compatibility date `2026-10-12`, `nodejs_compat`). Both returned 256 bits: **100000 SUCCESS / 11 ms**, **100001 SUCCESS / 12 ms** (single observations, not benchmark). See [RUN-IAM-20261102-01](IAICT_TEST_RUNS.md). **600000 NOT_RUN**, **staging Worker NOT_TESTED**, real IAM E2E NOT_RUN. The purported strict 100000 hard cap is contradicted for this local runtime. No product parameter change; ADR and Owner/security decision pending.
