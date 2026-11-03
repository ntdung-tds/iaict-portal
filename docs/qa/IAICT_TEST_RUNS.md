# IAICT — Immutable Test Run Ledger

**Quy tắc:** chỉ append run record mới; không sửa PASS/FAIL quá khứ để thay cho retest. Test case catalog riêng tại [IAICT_TEST_CASES.csv](./IAICT_TEST_CASES.csv). Trường hợp chưa xác minh không được tự suy ra PASS từ run tổng hợp.

## RUN-IAM-20261031-01 — Baseline IAM P0 release batch 2

| Trường | Thông tin |
|---|---|
| Date | 2026-10-31 · UTC+07 |
| Environment | GitHub CI (local unit/integration/browser) + read-only staging acceptance |
| Repo/branch | ntdung-tds/iaict-portal / feat/staging-native-login-r2-20261030 |
| Immutable tested SHA | `2a76deb5642d6f60a89c894fa91c7c30a42953c8` |
| Staging Worker deployed | `1b8cfe71-88ef-4e21-8937-4f8590daaba4` |
| Deployment ID | `754b0509-e754-410c-8dff-46015d162a89` |
| D1 | 24 migrations; `PRAGMA quick_check=ok`; verified after deploy |
| CI (unit/integration/build/typecheck) | **PASS**: 526/526 Vitest, typecheck, build; 52 test files |
| CI (Chromium local with API stubs) | **PASS**: browser-visual job |
| CI staging acceptance | **PASS**: read-only live acceptance **before the new release**, on previous staging Worker |
| Trigger & rollback | One-shot pinned build SUCCESS; auto-deploy HOLD restored; rollback Worker `bf2a0bfd-0e08-492c-9853-de6b35498b1b` retrievable |
| Access | 4 staging admin root/subpath policy destinations read back unchanged |
| Production | Worker `e7c703f7-fc4c-4313-b14c-0a2c94e0613d` unchanged |
| Browser rendering post-deploy | **BLOCKED** due to Cloudflare Browser Rendering HTTP 429 rate limit; do not mark PASS |
| Real staging authenticated multi-device QA | **NOT_RUN**; no authorized shared cookies/real-user mutation |
| Visual evidence | **NOT_CAPTURED** (no screenshot output from CI, per security rules); Drive folder: https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp |
| PR | https://github.com/ntdung-tds/iaict-portal/pull/36 |
| CI proof | https://github.com/ntdung-tds/iaict-portal/actions/runs/41186058883 |
| Staging acceptance proof | https://github.com/ntdung-tds/iaict-portal/actions/runs/41186058888 |
| Verdict | **PASS for automated CI and pre-deploy read-only acceptance only**; live-authenticated/post-deploy visual acceptance remains pending |

**Caveat:** Suite-level PASS không chứng minh tự động rằng cả 73 test case trong catalog đã chạy, hoặc kiểm thử thủ công trên hai thiết bị đã hoàn tất. Khi chạy case riêng, cần thêm run record với `Case ID / actual / verdict`.

## Template (copy below for every new run)

### RUN-IAM-YYYYMMDD-NN — Title

- Scope / Release / Requirement:
- Operator + date/timezone:
- Environment, code SHA, Worker version, D1 migration, browser/device:
- Test Case IDs, automation refs and prerequisites:
- Test data provenance: synthetic/test-only; no credentials:
- Actual observed + expected comparison:
- Verdict for EACH case: NOT_RUN / PASS / FAIL / BLOCKED / NOT_APPLICABLE:
- CI run URL, Drive evidence URL (or NOT_CAPTURED):
- Defect ID/issue URL, impact, severity:
- Retest parent run ID, rerun SHA and verdict:
- QA reviewer and release decision:


## RUN-IAM-20261031-02 — TOTP primitive RFC 6238 verification (foundation only)

| Field | Observation |
|---|---|
| Date/timezone | 2026-10-31, UTC+07; GitHub Actions timestamp in immutable run |
| Tested source commit | `645a98d50bd132278733f6676ebc7c72aa88cb06` |
| Test case | `IAM-FUT-007` (pure RFC 6238 TOTP helper only) |
| Environment | GitHub CI (Node 22/Vitest), not an authenticated production/staging account |
| Test proof | [GitHub portal-ci run #41192956639](https://github.com/ntdung-tds/iaict-portal/actions/runs/41192956639), `verify`, `browser-visual`, `rc-ancestry` **PASS** |
| Suite results | 53 Vitest files, **533/533 tests PASS**, 7 additional TOTP primitive tests in `lib/totp.test.ts`; TypeScript/build passed |
| Covered assertions | RFC 6238 SHA1/SHA256/SHA512 vectors, zero-padding, clock ±1, previously-used counter filter, Base32 secret generation/strict decoding, invalid parameters |
| Actual verdict `IAM-FUT-007` | **PASS for pure algorithm compatibility and guard tests only** |
| Full MFA enrollment/login/recovery `IAM-FUT-001` | **NOT_RUN / PLANNED** — not implemented or connected to any login; no encrypted D1 secret, enrollment, CAS replay, rate limit, recovery, step-up or UI |
| Drive visual evidence | **NO_IMAGE_REQUIRED** for the crypto unit test; CI text log above. [IAM evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) |
| Staging deployment | **NOT DEPLOYED**; no MFA behavior or Cloudflare Access changes. Last known Worker `1b8cfe71-88ef-4e21-8937-4f8590daaba4` |
| Production deployment | **NOT DEPLOYED**, unchanged; release gate remains closed |
| ADR | [ADR-0002 proposed](../adr/0002-iaict-native-mfa-totp-staged.md); no approval claimed |
| Reviewer acceptance | PENDING independent security review for future MFA stages |

**Known limitation:** A stateless matching time step is **not** atomic replay prevention. Do not treat algorithm-level PASS as production-ready MFA. Follow-up needs encrypted D1 schema, atomic used-step CAS, challenge/session binding, abuse controls and safe recovery.

## RUN-DELIVERY-20261031-01 — Final handoff requirement registered, not executed

- Case: `IAM-REL-008`; status **NOT_RUN / PLANNED**, because IAICT Portal has not completed the project.
- Requirement: [Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38); [FINAL_HANDOFF folder](https://drive.google.com/drive/folders/1FPhc8qDloCwxSRxTq-X6i3t5b8DYkPaQ) reserved and documented.
- **No final source code archive, checksum manifest, download verification or isolated restore test has been produced yet.** This is a recorded final acceptance obligation, not a completed backup. No PASS.


## RUN-IAM-20261031-03 — Eight staging QA identities and real browser rendering

| Item | Actual observation |
|---|---|
| Date | 2026-10-31, UTC+07 |
| Environment | **Real Cloudflare D1 staging** + Cloudflare Browser Rendering **actual browser** (mobile 390×844), no signed-in Access |
| Worker deployed | Staging `1b8cfe71-88ef-4e21-8937-4f8590daaba4`, unchanged during QA bootstrap |
| D1 binding | Staging database `aa4a97e7-60c5-4da4-9f0b-d469ece811b4` read back from Worker settings; no production DB write |
| Original state | 2 pre-existing users, 0 QA fixtures; 7 role codes seeded |
| Bootstrap action | Create **8 synthetic disabled QA users** (`admin` ×2 plus `editor, reviewer, viewer, news_admin, news_editor, news_reviewer`) through one QA-only D1 batch, not Admin API |
| D1 readback | **PASS**: 8 user rows + 8 role joins + 8 `qa.fixture.provisioned` audit rows; all `is_active=0`; 0 password credentials; `PRAGMA quick_check=ok` |
| Existing accounts | 2 existing users untouched; no customer data queried or mutated |
| Credentials / Access | None generated, no valid Cloudflare Access test identities; full login is **NOT_READY**, not PASS |
| Actual mobile browser `/login` | **PASS**: real rendered heading `Đăng nhập quản trị`, Email + Mật khẩu inputs, Đăng nhập button at 390×844 |
| Browser `/account/security` | **BLOCKED** by Browser Rendering HTTP 429 (rate limit), not PASS |
| Browser `/admin` | **BLOCKED** by Browser Rendering HTTP 429; anonymous Access gate not re-proven by this run |
| Browser `/api/admin/cms/users` | **BLOCKED** by Browser Rendering HTTP 429; no authenticated API verification |
| Full seven-role acceptance | **NOT_RUN** — needs controlled IAICT test mailboxes, Access identities, vault-backed credentials and approved activation |
| Evidence | [Drive restricted QA account registry](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit?usp=drivesdk), [account folder](https://drive.google.com/drive/folders/1q8-9hjgH_Rq9WKhv_rJpA1C3A8jB8lGO), [GitHub Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |
| Screenshots | **NOT_CAPTURED** — actual browser accessibility observations only, no screenshot emitted or uploaded |
| Test IDs | `IAM-AUTH-017` (NOT_RUN); `IAM-USER-017` (NOT_RUN); `IAM-USER-018` (NOT_RUN); login form public browser smoke check PASS (not a signed-in authentication test) |
| Production | Untouched. Cloudflare Access policy and Build HOLD unchanged |
| Next step | Controlled test inbox + Access identity + approved password vault; activate users one-by-one, run private real Chromium auth suite, revoke and disable afterward |

**Do not mark every role PASS:** fixtures are intentionally disabled; the D1 bootstrap does NOT exercise the app's Admin create-user API or verified browser sign-in.


## RUN-IAM-20261102-01 — Isolated local workerd PBKDF2 boundary observation

| Field | Observed / verified |
| --- | --- |
| Date/timezone | 2026-11-02 10:42 ICT (03:42 UTC), GitHub Actions UTC timestamps |
| Task / plan | PCS `T-IAM-KDF-S2` / checklist `CMS-08 S2`; [bounded test plan](IAICT_KDF_BOUNDARY_PLAN.md) |
| Repository / observed SHA | `ntdung-tds/iaict-portal` / `82380adafceaa239f24438ee85fa8ef10cc9d343` (CI test code head at runtime, before this report commit) |
| Environment | **LOCAL_WORKERD** in GitHub-hosted Ubuntu runner; `workerd` npm `1.20261012.1`; `compatibilityDate=2026-10-12`, `nodejs_compat`; loopback-only, no Cloudflare account/bindings |
| CI run / job | [portal-ci #41384536088](https://github.com/ntdung-tds/iaict-portal/actions/runs/41384536088); **kdf-local-workerd** job succeeded; [job log](https://github.com/ntdung-tds/iaict-portal/actions/runs/41384536088/job/125082350924) |
| Test runner | `scripts/kdf-workerd/run-local.mjs`, `config.capnp`, `probe.mjs` |
| Input data | Synthetic fixed bytes only. Never logs password/salt/key bits; no sessions, D1, R2, Access or real accounts |
| Deployed Worker / D1 / Access / production | **NOT_USED / NOT_MODIFIED** by this experiment; no remote diagnostic Worker deployed |
| 600000 iterations | **NOT_RUN_RESOURCE_GATE** (deliberate bounded-probe policy) |
| IAM real signed-in acceptance | **NOT_RUN**, no proof of actual CMS role login |
| Visual evidence | **NO_IMAGE_REQUIRED** for pure runtime boundary; private [IAM QA evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp), no new image uploaded |
| Defect / retest | No observed failure for the two bounded iterations. No claim of full KDF performance or live-auth acceptance |
| Owner / ADR | Architectural decision **PENDING**; SRS **FROZEN**. No parameter or migration changes authorized |

| Case ID | Layer / scope | Expected | Actual observed | Verdict |
| --- | --- | --- | --- | --- |
| IAM-AUTH-018 | Isolated local workerd, PBKDF2-HMAC-SHA-256, 100000 iterations | One 256-bit derivation succeeds with synthetic bytes | **SUCCESS**, 256 bits, **11 ms** (single observation) | **PASS — LOCAL_WORKERD ONLY** |
| IAM-AUTH-019 | Same local process, 100001 iterations | Record real success or rejection, do not assume a fixed 100000 hard limit | **SUCCESS**, 256 bits, **12 ms** (single observation) | **PASS — OBSERVATION COMPLETE** |
| KDF-S2-P03 | Proposed 600000 probe | Only if extra resource test authorized | Not executed by design | **NOT_RUN** |
| IAM-FUT-001 | Full native MFA | End-to-end enrollment, secure stored secret, replay block and recovery | Not implemented or exercised | **NOT_RUN** |

**Interpretation:** `100001` succeeds in this precisely versioned **local** workerd. Therefore the previously hypothesized strict 100000-iteration runtime ceiling is **not supported by this measurement**. This does not prove production/staging runtime parity, unconstrained higher iterations, resistance to DoS, or suitability of a KDF upgrade. The current app still accepts exactly `100000` iterations by its own `derivePassword` guard. Keep its parameter unchanged pending an architecture decision. No interpretation of 11/12 ms as a performance benchmark (single sample).



## RUN-IAM-20261102-02 — AES-256-GCM TOTP seed protection helper (unit only)

| Field | Verified observation |
|---|---|
| Date | 2026-11-02 (Asia/Ho_Chi_Minh); GitHub Actions UTC job timestamp |
| Task / CHG | PCS `T-IAM-MFA-F2`, CMS-08/S3 (isolated substep), `CHG-IAM-ACCESS-20261102-02` |
| Exact tested SHA | `8355bcdcdc66ce55bede8eeee50a0a8a1b38bf57` (PR #43 initial source+requirements snapshot) |
| CI evidence | [portal-ci #41386111393](https://github.com/ntdung-tds/iaict-portal/actions/runs/41386111393); verify job PASS |
| Environment | GitHub Actions Node 22 + Vitest, **UNIT / SYNTHETIC**, not real Worker MFA enrollment or D1 |
| Unit suite | `lib/mfa-secret-crypto.test.ts`: **6/6 PASS**; aggregate 54 Vitest files / **539/539 PASS** |
| Security assertions | Nonextractable AES-256 key; 160-bit seed roundtrip; independent randomized IV; owner/factor/key AAD binding; tampered IV/ciphertext/wrong key rejected; malformed input rejected |
| Tests not performed | Workers runtime AES-GCM parity, Worker secret binding, key rotation, forward-only factor D1 schema, atomic OTP replay, enrollment/verification session, recovery, 7-role real browser QA: **NOT_RUN** |
| Deployment | **NOT DEPLOYED**; no live password/account/D1/Cloudflare/Access/production changes |
| Visual evidence | **NO_IMAGE_REQUIRED**; [private IAM QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp); no screenshot created |
| Approval status | ADR-0002 remains PROPOSED, SRS FROZEN, Owner feature acceptance **NOT GIVEN** |

| Case | Layer / role | Expected | Actual | Verdict | Evidence |
|---|---|---|---|---|---|
| `IAM-FUT-008` | Unit / synthetic key, no user | AES-GCM encrypt/decrypt roundtrip and tamper/swap failure | 6 relevant assertions groups PASS, no authentication session | **PASS — UNIT ONLY** | [CI #41386111393](https://github.com/ntdung-tds/iaict-portal/actions/runs/41386111393) |
| `IAM-FUT-001` | Live MFA / real authorized role | Secure factor enrollment, OTP challenge and replay guard | No integrated enrollment or real role QA | **NOT_RUN** | Issue #37 |

**Scope warning:** The CI on this source SHA predates later documentation/checkpoint edits on the same PR. Reconfirm all CI gates at the PR's final head before merge; never transfer this test verdict to a deployed Worker.


## RUN-IAM-20261102-03 — AES-256-GCM exact library on isolated local workerd

| Field | Actual observation |
| --- | --- |
| Date/timezone | 2026-11-02 11:32:49 ICT (04:32:49 UTC) |
| Scope / test | CMS-08/S3 `T-IAM-MFA-F2` / `IAM-FUT-009` (runtime crypto only) |
| Exact tested SHA | `23c0960dba63905dfcf90fff2309e81b78f6e838` (initial PR #45 head **before** QA report/checkpoint edits) |
| CI proof | [portal-ci #41389043762](https://github.com/ntdung-tds/iaict-portal/actions/runs/41389043762), `kdf-local-workerd` job [#125096175596](https://github.com/ntdung-tds/iaict-portal/actions/runs/41389043762/job/125096175596) **PASS** |
| Actual runtime | **LOCAL_WORKERD** npm `1.20261012.1`, compatibility date `2026-10-12`, `nodejs_compat`; loopback-only `127.0.0.1:19388` |
| Code being tested | The **real** `lib/mfa-secret-crypto.ts` bundled via installed esbuild into an ephemeral workerd module; **not** a manually rewritten AES example |
| Inputs | Fixed synthetic 160-bit seed and 256-bit AES key, generated solely for CI; no account password or secret binding |
| Logged output | Sanitized check IDs, `passed=11`, verdict and runtime version. **No key bytes, seed bytes, OTP, ciphertext or session** |
| Deployment | **NOT DEPLOYED**; no staging/production Worker modification, D1, R2, Cloudflare Access or real credentials |
| Evidence image | **NO_IMAGE_REQUIRED** for local crypto runner; private [IAM QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) unchanged |
| Other CI | The workerd job PASS is confirmed at this SHA; verify final PR #45 **portal-ci** plus public-only staging-acceptance independently before merge |
| Owner / architecture | ADR-0002 PROPOSED; SRS FROZEN; no user or security acceptance for hosted MFA |

| Case ID | Environment / role | Expected | Actual | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-009` | Isolated local workerd / synthetic | 11 positive/negative WebCrypto checks using exact project helper | **11/11 PASS**, HTTP 200; roundtrip/nonce/key, owner+factor+key AAD, swapped IV/ciphertext, wrong key and malformed IV rejected | **PASS — LOCAL_WORKERD ONLY** | [CI job](https://github.com/ntdung-tds/iaict-portal/actions/runs/41389043762/job/125096175596) |
| `IAM-FUT-008` | Node/Vitest / synthetic | Independent 6-case crypto unit suite | Previous [RUN-IAM-20261102-02](#run-iam-20261102-02--aes-256-gcm-totp-seed-protection-helper-unit-only) still valid at its pinned SHA | **PASS — PRIOR UNIT ONLY** | [CI #41386111393](https://github.com/ntdung-tds/iaict-portal/actions/runs/41386111393) |
| `IAM-FUT-001` | Hosted Worker + real approved role | MFA enrollment, atomic replay guard, recovery and audit | Not implemented or exercised | **NOT_RUN** | Issue #37 |

**Interpretation:** The exact AES-256-GCM helper functions on **one tested local workerd version** under the project's compatibility flags. It does **not** establish hosted Cloudflare parity, secret/KMS injection, concurrency/replay resistance, key rotation, D1 factor schema, IAM step-up or authorized E2E acceptance. Keep Cloudflare Access, SRS and production unchanged.


## RUN-IAM-20261102-04 — Retest workerd AES-GCM request isolation after PR #45 review

| Field | Observed evidence |
| --- | --- |
| Date | 2026-11-02 11:45 ICT (GitHub Actions 04:45 UTC) |
| Retest parent | `RUN-IAM-20261102-03`, test `IAM-FUT-009` (same case ID, no added feature) |
| Exact executed source SHA | `702ce448ae1a63a6ab3e768a01104f14d16a183c` (PR #46 preliminary code head) |
| CI job | [portal-ci #41390187476](https://github.com/ntdung-tds/iaict-portal/actions/runs/41390187476), [local workerd job #125099646544](https://github.com/ntdung-tds/iaict-portal/actions/runs/41390187476/job/125099646544) **SUCCESS** |
| Tested runtime | `workerd` npm `1.20261012.1`, compatibility date `2026-10-12`, `nodejs_compat`, isolated loopback; **NOT HOSTED** |
| Actual | For each of **two sequential requests on same Worker isolate**, all **11/11** crypto checks PASS. `identical_check_sets_for_two_requests=true`; invalid route and POST returned HTTP 404. Runner output sanitized; no key/seed/OTP/ciphertext logged |
| Change reviewed | Reset per-request `checks` accumulator in `scripts/mfa-workerd/probe.ts`; fail-closed error names instead of arbitrary exception text; runner verifies repeated and negative-path behavior. **Application crypto helper unchanged** |
| Deployment | NONE, no real secret, D1, R2, Access, staging Worker or production mutation |
| QA media | **NO_IMAGE_REQUIRED**; [private IAM evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) not modified |
| Independent acceptance | MFA real factors, hosted secret bindings, D1 replay CAS, recovery and role E2E still **NOT_RUN**; SRS FROZEN and ADR-0002 PROPOSED |

| Case | Layer and role | Expected | Actual | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-009` | Synthetic local workerd, unauthenticated probe | 11 checks per request, independent state for repeat, invalid route and method fail closed | 11/11 on each of 2 requests; 404/404 invalid route and method | **PASS — LOCAL_WORKERD RETEST ONLY** | [CI job #125099646544](https://github.com/ntdung-tds/iaict-portal/actions/runs/41390187476/job/125099646544) |
| `IAM-FUT-001` | Hosted Worker, approved real users | MFA enrollment, key binding, OTP replay CAS, recovery, audit | No app integration or authorized role E2E performed | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |

**Limits:** CI is a synthetic runtime compatibility and harness isolation check, not a hosted Worker, real-login or security acceptance result. Final PR #46 CI and public-only staging acceptance must be checked separately at exact final head. Historical `RUN-IAM-20261102-03` remains intact; this is a new append-only retest record.


## RUN-IAM-20261102-06 — Staging 503 fail-closed probe diagnostic enhancement

| Field | Actual result and scope |
| --- | --- |
| Date | 2026-11-02 14:00–14:01 ICT (07:00–07:01 UTC) |
| Case | `IAM-REL-005` (existing case, no new QA ID) and public-only `IAM-REL-004` |
| Exact tested source SHA | `664f77dc7ce8387ad25c6e43077c4ea817481441` ([PR #48](https://github.com/ntdung-tds/iaict-portal/pull/48) preliminary final-code head before this QA record) |
| Portal CI | [#41403328517](https://github.com/ntdung-tds/iaict-portal/actions/runs/41403328517) **SUCCESS**; staging availability probe **10/10 Node unit tests PASS** (three new checks), full Vitest **539/539 PASS**, QA registry **82 cases**, Moment validator PASS |
| Public staging CI | [#41403328483](https://github.com/ntdung-tds/iaict-portal/actions/runs/41403328483) **SUCCESS**; Chromium **21/21 PASS**, anonymous availability **24/24 GET requests PASS**, `http503=0`, `networkErrors=0` |
| Changes exercised | On non-200 responses, preserve only syntactically validated CF-Ray ID and enum-classified server/cache/content headers. Never read response body, cookie, credentials or arbitrary headers. Live probe runs after failed Chromium too; **no gate weakening** |
| Real 503 diagnostic | **NOT_OBSERVED_IN_THIS_RUN**. CF-Ray extraction was verified with a synthetic 503 in unit tests; there is no new real CF-Ray sample in this run |
| Historical incident | [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) remains **OPEN**: PR #47 staging attempts 1 and 2 both FAIL with HTTP 503. A successful later sample is not an operational fix |
| Cloudflare root-cause evidence | Staging observability configuration read-only inspection: `observability=null`, `logpush=false`, zero tail consumers; no matching exception trace available from this inspection. GraphQL analytics quota returned rate-limit error. **ROOT_CAUSE_UNCONFIRMED** |
| Runtime / deployment | Existing staging Worker remains deployed, diagnostic probe is only a GitHub CI client; no staging deploy, D1, Access, R2 or production modification |
| QA media | **NO_IMAGE_REQUIRED** (HTTP status + sanitized text CI log). No GitHub screenshot/video/trace artifacts; [restricted QA evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) unchanged |
| Scope limit | This test concerns anonymous staging availability and release observability, not MFA/OTP. `IAM-FUT-001` live authenticated MFA remains **NOT_RUN** |

| Test case | Environment | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-REL-005` | Node test with synthetic errors | Preserve valid CF-Ray on 503, reject unsafe headers, fail closed | **10/10** Node tests PASS, prior 503→200 still FAIL as designed | **PASS — UNIT ONLY** | [portal-ci #41403328517](https://github.com/ntdung-tds/iaict-portal/actions/runs/41403328517) |
| `IAM-REL-005` | Live staging, public anonymous | 6 cycles × 4 GETs, no errors, fail on any non-200 | **24/24 PASS**, no real 503 sampled; no actual CF-Ray error diagnostic exercised | **PASS — BOUNDED LIVE SAMPLE** | [staging #41403328483](https://github.com/ntdung-tds/iaict-portal/actions/runs/41403328483) |
| `IAM-REL-004` | Staging real Chromium | Public pages and Access boundaries | **21/21 PASS** | **PASS — LIVE PUBLIC ONLY** | [staging #41403328483](https://github.com/ntdung-tds/iaict-portal/actions/runs/41403328483) |

**No root cause established, no reliability/SLO clearance, no permission for any production change or live MFA migration.** The original staging HTTP 503 failures remain in CI history and Issue #30. PR #47 local D1 CAS proof remains bounded; it must be independently verified on a new exact head after any eventual integration.

## RUN-IAM-20261102-05 — Atomic MFA replay-counter CAS on isolated local Miniflare D1

| Field | Observed / verified |
| --- | --- |
| Date/timezone | 2026-11-02 12:18 ICT (05:18 UTC) |
| Scope | CMS-08/S3; `IAM-FUT-010` P0 SECURITY / LOCAL D1 SQL only |
| Exact executed source SHA | `2bee360c3552e9dcfe60c94e7719b9d8ae7d33a5` (PR #47 initial source and QA case HEAD; later documentation/checkpoint edits NOT implicitly tested) |
| CI evidence | [portal-ci #41393225236](https://github.com/ntdung-tds/iaict-portal/actions/runs/41393225236), `kdf-local-workerd` job [#125108910122](https://github.com/ntdung-tds/iaict-portal/actions/runs/41393225236/job/125108910122) SUCCESS; local D1 runner line `[mfa-d1-cas] OBSERVED` |
| Environment | **LOCAL_MINIFLARE_D1**, Miniflare v5 adapter + ephemeral SQLite D1 via workerd; generated random synthetic database ID; no persistence root, cleaned by `dispose()`. **No production or staging D1 binding / API / real user** |
| Setup / semantics | One minimal **test-only** `iam_mfa_factors` SQL table (NOT a deployment migration). Atomic `UPDATE ... WHERE last_accepted_counter IS NULL OR last_accepted_counter < candidate`; require `result.success === true` and D1 `meta.changes===1`. Pure candidate counter inputs; code matching, time window and authentication not exercised |
| Actual | 15/15 independent assertion groups PASS; **16 parallel same-counter writes**, exactly **1** accepted and 15 rejected. Monotonic counter, replay and older step denied; owner/factor mismatch, pending, disabled and locked factor denied; expired lock/newer step accepted; invalid counters and missing D1 metadata fail closed; independent factor counter |
| Previous unsuccessful setup runs | [PR CI #41392786419](https://github.com/ntdung-tds/iaict-portal/actions/runs/41392786419), [#41392954526](https://github.com/ntdung-tds/iaict-portal/actions/runs/41392954526), [#41393053532](https://github.com/ntdung-tds/iaict-portal/actions/runs/41393053532) **harness/config FAIL**, not successful D1 tests. Pinned Miniflare 5 rejected old configuration; used its supported `convertV4MiniflareOptions` adapter, retested. All errors preserved in CI history |
| Other CI gates | Verify typecheck, whole suite, browser and read-only staging on **final PR head** before merge; do not transfer this proof to hosted D1 |
| Deployment | **NONE**. Not an MFA API, factor migration, server-side code verification, session issuance, Cloudflare binding or Access change |
| Evidence media | **NO_IMAGE_REQUIRED**; [private IAM QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) unchanged |
| Approval | ADR-0002 PROPOSED; SRS FROZEN; MFA feature Owner acceptance **NOT GIVEN** |

| Case ID | Test layer / role | Expected | Actual | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-010` | Local ephemeral Miniflare D1 / synthetic factor | Same OTP step accepted **at most once** under 16 concurrent CAS writes; no replay/regression/state bypass | Exactly **1/16** `meta.changes=1`; 15 groups PASS incl negative checks; test-only D1 | **PASS — LOCAL_SQL_CAS ONLY** | [CI job](https://github.com/ntdung-tds/iaict-portal/actions/runs/41393225236/job/125108910122) |
| `IAM-FUT-001` | Hosted Worker + approved real user | Full MFA enrollment, secure key binding, TOTP code matching, guarded challenge, session, recovery and audit | No live factor or authentication integration | **NOT_RUN** | Issue #37 |

**Boundary:** This is evidence that a **proposed SQL replay-counter CAS** behaves atomically on one local Miniflare/D1 runtime with synthetic factor rows. It does not validate TOTP code matching against the DB, hosted D1 consistency, session issuance, key rotation, real-user concurrency or full MFA. No forward-only migration or production/staging mutation was executed.


## RUN-IAM-20261102-07 — MFA integration contract/source review (no MFA runtime test)

| Field | Actual observed |
| --- | --- |
| Date | 2026-11-02, Asia/Ho_Chi_Minh |
| Scope | `CHG-IAM-ACCESS-20261102-06` / ADR-0002 F2/F3 DESIGN_ONLY, proposed [PR #49](https://github.com/ntdung-tds/iaict-portal/pull/49), Issue #37 |
| Read source | `lib/native-auth.ts`, `app/api/auth/login/route.ts`, `app/api/auth/session/route.ts`, `app/api/account/password/route.ts`, `worker.ts`, `lib/totp.ts`, `lib/mfa-secret-crypto.ts`, `lib/cms-roles.ts` at merged PR #47 baseline `11e3af741ede3e3d0d17c9e6d34034a8bb388876` |
| Confirmed behavior | `authenticateNativePassword()` immediately inserts a full `iaict_auth_sessions` row after password success and returns token. `POST /api/auth/login` sets `__Host-iaict_session` cookie. Session readers today do **not** require a native MFA assurance claim. |
| Threat identified | An OTP-only UI added to this login code would not secure privileged native sessions because the full session has already been created. **Do not label existing pre-MFA feature a production bypass until enforcement is added**. |
| Proposed design | Split primary proof and session mint, opaque expiring one-time pre-MFA challenge, atomic D1 challenge+factor CAS+session commit proof, session-reader assurance guard, key rotation, privileged recovery, Access retained; all **NOT_IMPLEMENTED** |
| QA registry | **83 cases**, existing `IAM-FUT-001/002/004` manual scenarios refined for current security risks, no invented PASS. `IAM-FUT-010` local Miniflare D1 15/15 PASS belongs to prior pinned [#41405196516](https://github.com/ntdung-tds/iaict-portal/actions/runs/41405196516), **not** a hosted login test |
| New runtime tests | **NOT_RUN / NOT_APPLICABLE**: document/QA contract review only, no app/D1/Access feature changed. GitHub CI validates documentation and existing regression tests only |
| Staging browser | Read-only public staging CI to be checked at final PR head; authenticated role+MFA E2E **NOT_RUN** |
| Evidence media | **NO_IMAGE_REQUIRED**, [private IAM QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) unchanged |
| Approval | Owner MFA acceptance NOT GIVEN; ADR-0002 PROPOSED; SRS FROZEN; no Cloudflare Worker/version, D1, secret, recovery code or production mutation |

| Case ID | Environment / role | Expected | Actual | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-001` | Hosted staging; approved native IAM account | MFA-required password login issues **only** restricted challenge; OTP+CAS grants full session exactly once | No new route/session gate implemented | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |
| `IAM-FUT-002` | Hosted staging; authorized privileged user | Recovery code single-use, approved dual-control lost-device recovery, audit and session revocation | Not implemented | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |
| `IAM-FUT-004` | Hosted staging; 7 roles and second Admin | Pending challenge and old session cannot bypass Access/RBAC or server-side MFA assurance | Accounts disabled, not run | **NOT_RUN** | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |

**Strict scope:** This QA record describes a source-code and threat-model review, not execution/acceptance of the proposed MFA design. Final CI SHA shall be appended/recorded in the PR once completed; a documentation-only CI pass is not an MFA feature pass.


## RUN-IAM-20261102-08 — Isolated first-factor challenge / native session-assurance guard

| Field | Actual result and scope |
| --- | --- |
| Time | 2026-11-02 ~15:41 ICT (08:41 UTC) |
| Case / PR | `IAM-FUT-011`, P0 security / synthetic local unit, [PR #50](https://github.com/ntdung-tds/iaict-portal/pull/50), Issue #37 |
| Exact source SHA tested | `aee436679d3efb76b13adb755fe5b58b560639ca` (source code/test/log snapshot before later ADR/PCS documentation changes) |
| CI | [portal-ci #41414835791](https://github.com/ntdung-tds/iaict-portal/actions/runs/41414835791), `verify` job #125176056864 **SUCCESS** |
| Runtime | Node/Vitest only, no Cloudflare Worker deployment, no remote D1, no MFA/role account |
| Actual | **16/16 tests PASS** in `lib/native-mfa-preauth.test.ts`; complete Vitest suite **555/555 PASS** (55 test files). QA catalog **84 cases** and requirements gate PASS; SRS frozen unchanged |
| Verified scenarios | 256-bit random token and digest-only proposed record, 5-min separate Secure/HttpOnly pending cookie, invalid/ambiguous cookie, account/credential mismatch, stale/consumed/locked challenge, attempts exhausted, unknown assurance policy fail-closed, MFA-required rejects password-only and legacy, invalid MFA time denied |
| Explicit negative proof | `pendingChallengeEligibleForCas()` is deliberately **read-only**; it can return true twice for an unchanged candidate. It does **not** perform D1 CAS/OTP validation or issue a full session. No live session readers use these helpers yet |
| Known gaps | Real MFA enrollment/recovery/session enforcement, active-account session rotation, protected admin Worker routing, hosted challenge storage, cross-request replay and seven-role authenticated E2E **NOT_RUN**; Owner/security approval NOT GIVEN |
| QA media | **NO_IMAGE_REQUIRED**, [private IAM QA evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) unchanged |
| Deployment | **NONE**, no API/UI route or real database/account/config change, Access and production unchanged |

| Case ID | Test layer / role | Expected | Actual | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-011` | Node/Vitest, synthetic records | Distinct restricted challenge, no raw token in stored record, strict TTL and server-derived assurance policy | **16/16 PASS** isolated module only | **PASS — ISOLATED_UNIT_ONLY** | [CI #41414835791](https://github.com/ntdung-tds/iaict-portal/actions/runs/41414835791) |
| `IAM-FUT-001` | Hosted Worker, approved real accounts | Password verification without MFA does not create a full session; OTP CAS/challenge must commit | New module not wired to login, no MFA factors | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |
| `IAM-FUT-004` | Authenticated seven-role staging | Server-side assurance and RBAC checked from D1 for every route | QA users remain disabled; no live role testing | **NOT_RUN** | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |

**Important:** a successful unit test of the isolated predicate does not prove the production/staging login route enforces it. Existing `native-auth.ts`, `worker.ts`, login routes and D1 schema are intentionally unchanged. Final PR SHA CI and staging acceptance must be separately verified before merge.


## RUN-IAM-20261102-09 — Two independent review passes of isolated MFA preauth guard

| Field | Observed result |
| --- | --- |
| Date | 2026-11-02, Asia/Ho_Chi_Minh |
| Scope | Security review of merged PR #50 and bounded fix in [PR #51](https://github.com/ntdung-tds/iaict-portal/pull/51); existing case `IAM-FUT-011` only |
| Review pass 1 — static and boundaries | Read `lib/native-mfa-preauth.ts`, tests, `native-auth.ts`, QA, ADR, PCS and original PR #50 diff. The new module remained **unimported by Worker/login**; current password-only session behavior unchanged. Found truthy input coercion for `accountActive`/`hasActiveRole` and type assumptions on token/hash inputs |
| Review pass 2 — adversarial cases | Add four independent negative Vitest scenarios with `"false"`, `"true"`, numeric 0/1, Boolean wrapper objects, null/undefined account/role flags, non-string token or digest inputs; strict boolean and primitive-string validation now fails closed. Future trusted D1 caller must explicitly normalize 0/1 before invoking predicate |
| Exact tested source SHA | `828d106029b75b73afb4ccf1c79c1e853c26a2c6` (PR #51 code/QA catalog after correction; document/checkpoint edits later) |
| Observed CI | [portal-ci #41416918807](https://github.com/ntdung-tds/iaict-portal/actions/runs/41416918807) — `verify` job #125182920590 **SUCCESS**, new module **20/20** test PASS, overall **559/559 Vitest PASS**, QA registry **84** cases PASS, requirements and frozen-SRS gate PASS |
| Initial verification failure | [CI #41416787752](https://github.com/ntdung-tds/iaict-portal/actions/runs/41416787752) initial `verify` job **FAIL** due to missing QA registry update in the first revision, not a security assertion failure. Existing `IAM-FUT-011` test-case row was revised and test rerun; original failure remains in CI history |
| Runtime/coverage limits | **LOCAL_NODE_UNIT_ONLY**; helper still not imported in Worker/login/actual session readers, no D1 schema or user MFA enrollment. Positive challenge eligibility remains **READ_ONLY** and is NOT atomic redemption, OTP verification, or full-session issuance |
| Real MFA security acceptance | `IAM-FUT-001` full login, `IAM-FUT-002` recovery, `IAM-FUT-004` seven-role cross-route and hosted D1 challenge **NOT_RUN** |
| Deployment | **NONE**; no Cloudflare staging/production Worker, Access, D1, R2, credentials or live user modified |
| Media | **NO_IMAGE_REQUIRED**, [private IAM QA evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) unchanged |
| Approval | SRS FROZEN, ADR-0002 PROPOSED, owner/security activation NOT APPROVED |

| Case | Environment and role | Expected | Actual | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-011` | Local Node/Vitest, synthetic typed and malformed values | Deny truthy non-boolean account/role flags, reject non-string token/digest, preserve valid strict-boolean semantics | **20/20 PASS** (four additional negative scenarios) | **PASS — ISOLATED UNIT** | [CI verify job](https://github.com/ntdung-tds/iaict-portal/actions/runs/41416918807/job/125182920590) |
| `IAM-FUT-001` | Real hosted IAM | Verify OTP and atomically consume challenge before privileged session | Not integrated | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |

**Do not infer live MFA enforcement from a unit test.** Final source SHA CI and anonymous staging acceptance must be verified separately before merging PR #51.


## RUN-IAM-20261102-10 — One-time pre-MFA challenge CAS, isolated disposable D1

| Field | Observed / verified |
| --- | --- |
| Date (ICT) | 2026-11-02 |
| Case and risk | `IAM-FUT-012`, P0 security, [PR #53](https://github.com/ntdung-tds/iaict-portal/pull/53), [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |
| Exact source SHA executed | `15b9b84a072af824eb467f59783f9b73106887a4` (final tested code prior to documentation commits) |
| CI | [portal-ci #41424145730](https://github.com/ntdung-tds/iaict-portal/actions/runs/41424145730), `kdf-local-workerd` job #125206551257 **SUCCESS**; `[mfa-preauth-d1-cas] OBSERVED` |
| Environment | **LOCAL_MINIFLARE_D1** / new UUID ephemeral D1 with `synthetic_mfa_users` and `synthetic_mfa_challenges` only; no configured Cloudflare account, real D1 binding, migration, actual Worker route or user |
| Actual | **26/26 SQL/security assertion groups PASS**. **16** concurrent attempts to consume the *same* challenge; exactly **1** conditional UPDATE changed a row (`success=true` and integer `meta.changes=1`). 15 attempts rejected |
| Negative behavior | Same-challenge replay, expiry at exact boundary, future/overlong TTL, wrong owner, invalid token hash, wrong credential, credential revision rotated then fingerprint restored, stale revision, account disabled, role revoked, wrong challenge purpose, too many/negative attempts, lock until, already consumed, malformed context, missing D1 metadata all deny. Fresh and independent-user challenges can succeed. Only newly consumed rows counted |
| Initial setup failure | [CI #41423994454](https://github.com/ntdung-tds/iaict-portal/actions/runs/41423994454) `kdf-local-workerd` **FAIL** at final aggregate fixture assertion: the intentionally pre-consumed fixture was included in the total. Corrected count to `consumed_at_ms >= synthetic now`, retested; **previous FAIL preserved**, not recast as a security pass |
| Security/transaction limit | This is **only one atomic challenge-row UPDATE** with server-owned synthetic current user account/role and credential revision checked by SQL `EXISTS`. It does **not** verify an OTP/TOTP counter, commit factor and session atomically, create a session, write security audit or prove remote D1 consistency/rollback |
| Other code / deployment | No change to real `lib/native-auth.ts`, login, Worker, session readers, real D1, Access, secrets, R2, staging or production |
| Media | **NO_IMAGE_REQUIRED**; [private IAM QA evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) unchanged |
| Approval | ADR-0002 PROPOSED, SRS FROZEN, security/Owner policy approval NOT GIVEN |

| Case | Environment and role | Expected | Actual | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-012` | Local Miniflare D1, synthetic users | At most one successful redemption, server state/credential revision validated in same SQL update, fail closed | **26/26 check groups PASS; 1/16 parallel writes** | **PASS — LOCAL_D1_CAS_ONLY** | [CI #41424145730](https://github.com/ntdung-tds/iaict-portal/actions/runs/41424145730) |
| `IAM-FUT-001` | Approved real staging IAM accounts | Verified OTP and full session issued exactly once after atomic proof of challenge, factor step and user/session policy | No integration exists | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |
| `IAM-FUT-004` | Authorized seven-role E2E staging | Protected APIs reject pending/legacy sessions and enforce RBAC/Access | Not tested live | **NOT_RUN** | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |

**Boundary:** The new test does not import the preauth TypeScript module into a real route; its D1 schema is strictly synthetic. Neither a successful conditional UPDATE nor this PASS grants a native IAM session. Full MFA transaction semantics remain NOT_RUN.


## RUN-IAM-20261102-11 — Two-pass security review of pre-MFA challenge revival after restoration

| Field | Observed evidence / strict boundary |
| --- | --- |
| Date | 2026-11-02, Asia/Ho_Chi_Minh |
| Case / PR | Existing P0 `IAM-FUT-012` (no new case), [PR #54](https://github.com/ntdung-tds/iaict-portal/pull/54), Issue #37 |
| Round 1 — source review | A challenge pre-dating a role revocation or account disable could become eligible again after permissions/account status were restored before its original five-minute expiry, because the synthetic SQL only checked present `is_active`/`has_active_role` bits and the password credential revision |
| Round 2 — adversarial contract | Synthetic `security_revision` on both account and challenge, validated inside same conditional D1 UPDATE. Test role revoke→regrant and account disable→reactivate with old pre-change challenge **denied** even after restored bit; explicitly seed fresh and independent-user revision fixtures. Strict 64-character token/fingerprint check |
| Exact source SHA tested | `3c32802b791ec8ac44dfbb76868cd960265318c4` (initial PR #54 head before this QA/PCS documentation; logs from same test code) |
| CI | [portal-ci #41426633634](https://github.com/ntdung-tds/iaict-portal/actions/runs/41426633634), `kdf-local-workerd` job `125214697790` **SUCCESS**; `[mfa-preauth-d1-cas] OBSERVED` |
| Actual result | **29/29 synthetic D1 assertion groups PASS**, exactly **1 of 16** concurrent requests to consume the same hashed challenge accepted; 3 added security-state negative groups compared with historical 26/26 |
| Other tests | Existing `IAM-FUT-010`, `IAM-FUT-011` retain their prior bounded scope; full Vitest, QA registry and public staging gate must be verified against **final PR head** after checkpoint edits |
| Prior history | `RUN-IAM-20261102-10` 26/26 remains historical evidence for PR #53; this review does not reinterpret that older result. First PR #53 fixture-count FAIL remains preserved in CI history |
| Important implementation constraint | In a real D1 architecture, any revocation/disable/privilege or MFA policy change must advance an authoritative security epoch **atomically** with the state change or revoke outstanding challenges using an equivalent proven transaction. The new epoch exists **only in synthetic test tables** |
| Strict security limit | No OTP/TOTP code verification, factor counter+challenge+session+audit transaction, real user/session, D1 migration/binding, Worker/login integration, Cloudflare Access or production modification |
| QA media | **NO_IMAGE_REQUIRED**, [private IAM evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) |
| Approval | ADR-0002 PROPOSED, SRS FROZEN, Owner approval NOT GIVEN |

| Case | Environment / role | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-012` | Local Miniflare D1, synthetic identities | Old challenge stays invalid after role restored or account reactivated | **29/29 groups PASS, 1/16 concurrent consumes** | **PASS — LOCAL_D1_ONLY** | [CI #41426633634](https://github.com/ntdung-tds/iaict-portal/actions/runs/41426633634) |
| `IAM-FUT-001` | Real authenticated hosted staging | Password-only session not issued for MFA-required user; full OTP+factor+challenge/session atomicity | Not implemented | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |
| `IAM-FUT-004` | Authenticated 7-role staging | Access/RBAC/assurance remain secure after revoke and regrant | No authorized live fixtures | **NOT_RUN** | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |

**This is a synthetic D1 contract proof, NOT a live MFA feature.** Final PR SHA CI and public staging acceptance are separately required before merge.


## RUN-IAM-20261102-12 — Iterative security review loop for synthetic pre-MFA D1 CAS

| Field | Evidence and honest limitation |
| --- | --- |
| Date | 2026-11-02, Asia/Ho_Chi_Minh |
| Scope | Existing `IAM-FUT-012`, P0; [PR #55](https://github.com/ntdung-tds/iaict-portal/pull/55); **85 QA cases unchanged** |
| Loop 1 — inspect and identify | Merged PR #54 already tested current role/active-bit revoke→restore, but lacked role-scope/permission updates while `has_active_role=1` and factor reset while user status/credentials are unchanged. Synthetic challenge creation also mirrored the security revision in JS, rather than reading authoritative D1 |
| Loop 1 — minimal fix | Source-only `scripts/mfa-preauth-d1-cas/run-local.mjs`: seed challenge from current D1 `security_revision`, increment epoch on synthetic role-scope and factor reset events, verify old challenge is still denied despite unchanged active flags |
| Loop 1 — observed CI | PR #55 source SHA `b80fb136097dd5da2e0ccb95f0770d567a00f8a0`, [portal CI #41433990774](https://github.com/ntdung-tds/iaict-portal/actions/runs/41433990774), `kdf-local-workerd` job #125239205340 **SUCCESS**: **31/31** synthetic D1 assertion groups PASS, exactly **1/16** same-challenge CAS writes accepted; unchanged synthetic-only explicit result markers |
| Loop 2 — independent inspection | Compare SQL conditional update to test matrix: current user/factor epoch equality; credential revision/password rotation; role revocation and restoration; account disable/reactivation; role-scope change while active; factor reset; replay; expiry; wrong owner/token; lockout; missing D1 metadata; fresh independent-user eligibility. All **in-scope listed invariants represented by negative/positive tests**. No further reproducible code defect found in this bounded SQL CAS harness on this inspection |
| Loop 3 — closure criterion | Re-execute *final exact PR head* full portal CI and independent public staging acceptance after QA/PCS doc updates. Close this review only if all gates PASS and no high-priority in-scope defect remains. If a gate fails, keep PR OPEN and iterate; never classify older red runs as PASS |
| Past evidence | `RUN-IAM-20261102-11` (29/29 at PR #54) retained unchanged; this run adds 2 scenarios, not 2 test cases |
| Critical boundaries | This **does not** prove atomic verification of actual OTP + factor counter CAS + challenge consumption + full-session creation + audit; does not exercise hosted D1 or actual revocation handlers. Real hosted `IAM-FUT-001/002/004` **NOT_RUN**, live user security epoch **NOT_IMPLEMENTED** |
| Media | **NO_IMAGE_REQUIRED**, [private QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) unchanged |
| Release | SRS FROZEN, ADR-0002 PROPOSED, owner approval NOT GIVEN. No D1 migration, Worker, login/API, Cloudflare Access, secret or production modification |

| Case | Environment | Expected | Actual | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-012` | Local Miniflare D1 synthetic user/challenge | Scope/factor change invalidates prior token, one 16-way CAS winner | **31/31 groups PASS; 1/16 accepted**, local only | **PASS — LOCAL_D1_CAS_ONLY** | [CI #41433990774](https://github.com/ntdung-tds/iaict-portal/actions/runs/41433990774) |
| `IAM-FUT-001` | Hosted IAM with approved users | Verified OTP, challenge/factor/session atomic transaction | No integration | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |
| `IAM-FUT-004` | Authenticated seven-role staging | Session assurance and policy/revocation enforced at every protected endpoint | No authorized E2E fixtures | **NOT_RUN** | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |

**Stop rule is scope-bound**, not a claim of absolute absence of all vulnerabilities. PR remains open until exact final SHA CI + staging gates pass.


## RUN-IAM-20261102-13 — Synthetic verified OTP + challenge/factor/session/audit transaction on isolated D1

| Field | Observed facts and scope |
| --- | --- |
| Date | 2026-11-02 (Asia/Ho_Chi_Minh) |
| Test/PR | **`IAM-FUT-013`**, P0 Security/AUTO; [PR #57](https://github.com/ntdung-tds/iaict-portal/pull/57); Issue #37 |
| Source tested (before QA edits) | `f621f1ea9896010b720aecd25b4120cfa1ec6618` |
| Observed runner | [portal CI #41442058049](https://github.com/ntdung-tds/iaict-portal/actions/runs/41442058049), `kdf-local-workerd` job #125266084414 **SUCCESS**; `[mfa-atomic-d1] OBSERVED` |
| Test environment | **LOCAL_MINIFLARE_D1** with fresh randomized DB UUID, synthetic random 20-byte HMAC-SHA1 seed created within test, synthetic user/factor/challenge/session/audit/guard tables; no real D1 Worker binding or OTP account |
| Atomicity mechanism | One `D1.batch()` with challenge conditional UPDATE, immediate `CHECK(observed=1)` using SQLite `changes()`, factor counter conditional UPDATE, second CHECK guard, synthetic MFA-assured session INSERT, audit INSERT. A zero-row CAS forces a *database SQL error* and rollback; checking `meta.changes` after a committed batch alone would be too late |
| Verified execution | **20/20 synthetic assertion groups PASS**; **16** simultaneous requests for the same challenge with **1 successful complete transaction**; two different challenges using the same factor time-step yielded **1** complete transaction, losing challenge not consumed; **4 committed synthetic MFA sessions and 4 matching success audit entries** |
| Negative proofs | Wrong/malformed TOTP, same-challenge replay, two-challenge same-step replay, 0-row CAS rollback, session UNIQUE failure, late audit UNIQUE failure, expiry, security/credential revision changed between OTP check and batch, account disable and factor disable/secret-version rotation between verification and batch. Snapshots demonstrate no partial challenge/factor/session/audit state on rejected attempts |
| Independent design review | Compared the SQL and injection cases against ADR-0002: challenge user+credential/security revision validated in DB, factor owner/status/secret version and monotonic counter checked on D1, session/audit issued only if batch succeeds; audit failure tested after session insertion and rolls back earlier writes. **No additional reproducible in-scope defect** in this synthetic multi-entity proof on this pass. This is *not* a claim that live MFA is verified |
| Limits | Test uses a **standalone synthetic Node HMAC-SHA1 verifier** (0-step window), **not** the running TypeScript TOTP module or hardware-bound secret; no real login session token, key encryption, API CSRF/throttle, recovery, hosted D1 transaction, Worker deployment or real 7-role E2E. Does NOT prove remote execution or live key lifecycle |
| Other tests | `IAM-FUT-010/011/012` remain local-only historical; full CI and public staging gate to be verified on **final PR SHA** before merge |
| Evidence media | **NO_IMAGE_REQUIRED**; [private QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) |
| Approval | ADR-0002 PROPOSED, SRS FROZEN, Owner MFA/security approval NOT GIVEN |

| Case ID | Environment / role | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `IAM-FUT-013` | Local Miniflare D1 synthetic user/factor/session | Verified synthetic OTP + challenge and factor CAS yield one session and audit atomically or no writes | **20/20 groups PASS**, 1/16 same-challenge and 1/2 different challenge same step accepted; 4 synthetic sessions and 4 success audit | **PASS — SYNTHETIC_ATOMIC_D1_ONLY** | [CI #41442058049](https://github.com/ntdung-tds/iaict-portal/actions/runs/41442058049) |
| `IAM-FUT-001` | Hosted approved IAM users | Full MFA login route and server-recognized MFA session with live factor/OTP | No actual route integration | **NOT_RUN** | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |
| `IAM-FUT-002/004` | Authenticated hosted recovery/7 roles | Safe recovery, session revocation and per-route MFA enforcement | Identities/feature not available for acceptance | **NOT_RUN** | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |

**Bounded result:** The local D1 batch rollback and guard pattern is supported by this test. Production transaction design must still use actual typed TOTP helpers, vetted secret custody, a real schema and hosted tests with Owner/security acceptance; avoid treating 20/20 local PASS as real MFA completion.


## RUN-IAM-20261102-14 — Real TOTP helper parity inside isolated synthetic D1 batch

| Field | Verified evidence and boundary |
| --- | --- |
| Date / owner | 2026-11-02 (Asia/Ho_Chi_Minh); PCS Solo Lead; Owner security acceptance NOT GIVEN |
| PR / case | [PR #59](https://github.com/ntdung-tds/iaict-portal/pull/59), existing P0 `IAM-FUT-013`, **86 QA cases unchanged**; `CHG-IAM-ACCESS-20261102-13` |
| Baseline | [Merged PR #58](https://github.com/ntdung-tds/iaict-portal/pull/58) left `IAM-FUT-013` at **20/20** synthetic Node-HMAC-based local D1 proof. This historical result is retained unchanged |
| Review 1 / change | The previous verifier reproduced HMAC independently, never calling `lib/totp.ts`. Bundle actual repository `lib/totp.ts` with esbuild into local Node WebCrypto and use its `matchTotpCounter()` as OTP candidate; cross-check generation against independent Node HMAC and RFC 6238 SHA-1 8-digit known vector |
| Review 2 / correction | Fixed rare randomized negative-case flake: fixed wrong OTP might match a valid ±1-step code; choose wrong input absent from all three admissible codes. Add deterministic out-of-window RFC rejection. No SQL CAS or backend auth source modified |
| Exact tested code/checkpoint SHA | `5e13f97da067f12c3d21de460092ecd37aa8298d`; [portal-ci #41456996101](https://github.com/ntdung-tds/iaict-portal/actions/runs/41456996101) **SUCCESS, 4/4 jobs**; local workerd job `kdf-local-workerd` **27/27 groups PASS**; QA registry **86**, full **559/559 Vitest** |
| Actual local result | **27/27**: actual generator/matcher RFC and independent-HMAC parity, exact/adjacent/replay/malformed/out-of-window; existing atomic D1 challenge+factor guarded CAS, rollback after session/audit failures and synthetic audit matching. **1/16** concurrent same challenge accepted; **1/2** distinct challenges using same TOTP step accepted; **4 synthetic session + 4 audit success records** |
| Public staging check | [staging-acceptance #41456996063](https://github.com/ntdung-tds/iaict-portal/actions/runs/41456996063) **SUCCESS**: 21/21 public Chromium, 24/24 anonymous GET, 0 observed HTTP 503/5xx/network errors **in this sample only**; intermittent [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) remains OPEN |
| Merge gate | Exact final PR HEAD must pass portal-ci (4 jobs) and public read-only staging again after this documentation commit; do **not** reuse earlier SHA status as proof of a later SHA |
| Explicit NOT_RUN | **Real MFA enrollment/sign-in/recovery/7-role authenticated E2E** (`IAM-FUT-001/002/004`), live session assurance and pre-MFA route enforcement, hosted D1, production encrypted secret/KMS, real security epoch, D1 migration, key rotation |
| Operational constraints | Node local module + disposable synthetic Miniflare D1 only. No changes to `lib/totp.ts`, Worker/auth routes, user credentials, actual tables, Cloudflare Access, R2 or staging/production deploy. SRS **FROZEN**, ADR-0002 **PROPOSED**, owner/security approval **NOT GIVEN** |
| Evidence media | **NO_IMAGE_REQUIRED**; [private QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). No private images/logs to GitHub |

**Conclusion:** The actual TOTP helper now participates in the *isolated* D1 batch harness and passed the bounded security regression. This does NOT implement MFA in IAICT Portal or approve a live migration, account enrollment or Access cutover. The next action is to review authoritative IAM schema/epoch/assurance and recovery under a separate approved scope.


### RUN-IAM-20261102-14 — post-merge readback (documentation-only handoff)

- [PR #59](https://github.com/ntdung-tds/iaict-portal/pull/59) **MERGED** as `bdd0d2e353079496bc32a249a128b2fd95db3ed9`. Exact final PR HEAD `17eabc0fa896eea531aa186160f607f6ee66ea21`: [portal-ci #41457724289](https://github.com/ntdung-tds/iaict-portal/actions/runs/41457724289) **SUCCESS all four jobs**, **27/27 local IAM-FUT-013**, **559/559 Vitest**, QA 86; [public staging #41457724115](https://github.com/ntdung-tds/iaict-portal/actions/runs/41457724115) **SUCCESS 21/21 Chromium + 24/24 anonymous GET**, 0 HTTP503/5xx/network errors **in sample only**.
- Post-merge active branch source and PCS **revision 21** read back; Google QA [v2.0](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit) updated/read back. This handoff proposes PCS revision 22 to replace stale “verify/merge PR59” next action; it **does not** add a new test run or increase scope of the preceding evidence.
- **Persistent restrictions:** actual MFA/hosted D1/Worker/key/recovery/7-role E2E NOT_RUN, ADR PROPOSED, SRS FROZEN, Owner security sign-off NOT GIVEN. No remote mutations, Access changes or production deploy.

## RUN-IAM-20261103-01 — actual IAM migration baseline + disposable D1 security epoch

| Case / hạng mục | Environment & role | Expected | Actual observed | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| IAM-FUT-014 — local epoch CAS | Random **ephemeral Miniflare D1**, synthetic user/role; exact unmodified migration source 0001/0022/0023/0024 | Final password session issuance checks current policy/epoch/credential; no stale challenge or session can revive; failure rolls back | **43/43 assertion groups PASS**. Tested wrong-policy mid-verification, stale epochs, role revoke/regrant, deactivate/reactivate, credential/factor rotation/disable, legacy NULL-assurance, challenge one-use, audit collision rollback, FK integrity. No hosted D1 | **PASS LOCAL_ONLY** | [CI #41516228656](https://github.com/ntdung-tds/iaict-portal/actions/runs/41516228656) · source SHA `6a41f698906801f7c2a59ccf283d19794809fd9f` |
| Real local Chromium regression | Local web server, mocked CMS APIs where specified, no authenticated staging role | Existing UI regression passes | **30/30 Chromium PASS** (browser-visual job) | **PASS LOCAL_CHROMIUM_MOCK** | [CI #41516228656](https://github.com/ntdung-tds/iaict-portal/actions/runs/41516228656) |
| Public staging Chromium acceptance | **Real staging**, anonymous/read-only Chromium, no authenticated CMS role, not deploying the PR's code | 21 existing public paths/flows behave safely | **21/21 Chromium PASS** | **PASS LIVE_STAGING_ANONYMOUS** | [staging #41516228434](https://github.com/ntdung-tds/iaict-portal/actions/runs/41516228434) |
| Public staging HTTP availability | Real staging, anonymous/read-only | 24 checks; report transient 503 if any | **24/24 PASS; zero observed 503/5xx/network errors in THIS sample** | **PASS SAMPLE_ONLY** | [staging #41516228434](https://github.com/ntdung-tds/iaict-portal/actions/runs/41516228434) |
| Authorized 7-role, real MFA and hosted D1 | Live Worker/credentials and actual MFA path | Genuine authorized role browser and encrypted factor integration | **NOT_RUN**; no real MFA implementation, no live schema or vault/key binding | **NOT_RUN** | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) · [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) |

- **Recorded:** 2026-11-03 ICT; PR [#67](https://github.com/ntdung-tds/iaict-portal/pull/67), tested code SHA `6a41f698906801f7c2a59ccf283d19794809fd9f`, catalog **87 cases**, CI **4/4 jobs SUCCESS** (typecheck/build and D1 tests), public staging read-only workflow **SUCCESS**. Real Chromium is mandatory where applicable; this new D1-only test exposes no new live UI, so browser gates are regressions against existing deployed staging, **not evidence of code deployment**.
- **Review/fix history retained:** first source SHA `9b9a788c` FAILED migration D1 `exec` multiline parser; after split source SHA `743ec9d3` FAILED synthetic MFA session reader due double hash of returned token; both fixed at observed SHA `6a41f698906801f7c2a59ccf283d19794809fd9f`. Do not misclassify earlier failures as app defects. The four migration files remained unchanged; no live D1 touched.
- **Screenshots:** `NO_IMAGE_REQUIRED` for D1 and automated public regression; private [QA evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). No secrets, session files, screenshots, trace/video uploaded to GitHub.
- **Boundaries:** SRS FROZEN, ADR-0002 PROPOSED. New case proof does **not** verify actual password PBKDF2, TOTP, real MFA challenge/session readers, encrypted factors, hosted D1, or seven-role authenticated browser tests. Owner standing permission to create test accounts is recorded in PR #66; no real accounts provisioned in this run. Existing intermittent public 503 Issue #30 remains open.
- **Merge rule:** source SHA above proves code before this evidence commit. Re-run exact-final-head PR CI and staging before merging; never transfer a prior SHA's green gates as proof of a changed HEAD.


## RUN-IAM-20261103-02 — Browser role-navigation regression and authenticated QA preflight

| Test scope | Target | Observed result | Verdict | Evidence |
|---|---|---|---|---|
| IAM-USER-019 | Local Chromium 390px, seven simulated roles and forbidden session; CMS session explicitly mocked | **8 newly added UI tests PASS**, included in 38/38 total Chromium checks at source SHA `eb395141aaa052d5136797e3876b240b710a6bcf` | **PASS LOCAL_CHROMIUM_MOCK ONLY** | [Portal CI #41521921878](https://github.com/ntdung-tds/iaict-portal/actions/runs/41521921878) |
| IAM-USER-020 | Real staging Chromium with valid authorized per-role Cloudflare Access browser state | New `page.goto` UI assertion written; **no valid private per-role Access session available**, so authenticated execution did not occur | **NOT_RUN / BLOCKED** | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |
| Account provisioning preflight | Restricted Drive QA registry | Eight synthetic staging D1 fixture entries documented as **DISABLED**, no passwords, Access subject or valid session. No new user created or activated in this run; account registry read is historical status, not fresh hosted D1 verification | **BLOCKED** | [Restricted QA identities](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit) |
| External prerequisites | Connected Cloudflare management, email and credential vault | Cloudflare Access application-management reads blocked by tool safety; no connected approved encrypted password vault; no controlled dedicated QA mailbox connector usable yet. Owner's standing staging-only permission already granted in PR #66 | **BLOCKED**, not missing authorization | [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) |

The 8 new Chromium tests are browser-rendered **with API mocks** and cannot establish authenticated RBAC in deployed staging. The existing anonymous staging Chromium acceptance is an independent layer. No password, JWT, cookie, screenshot, API secret, D1 mutation, Worker deployment or production change was made. The role/browser tool is prepared for genuine Access sessions but must not be run on CI or substitute synthetic fixture addresses for real identities. No QA image required; [private evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).

**Review history:** QA verifier rejected the initial MANUAL test's automated reference; corrected to `—`. Requirements verifier rejected source changes without `thaydoi.md`; added `CHG-IAM-ACCESS-20261103-02`. Final-head CI/staging gate must be recorded after this ledger commit before merge.

## RUN-IAM-20261103-03 — live staging QA identity and Access preflight (read-only plus empty Secrets Store setup)

| Item | Scope / expected | Observed 2026-11-03 | Verdict |
| --- | --- | --- | --- |
| QA staging D1 fixtures | Registered eight test roles | **8 rows**, **0 active**, **0 v2 password credentials**, **0 Access subjects**; 10 total CMS users; aggregate-only live D1 reads | **PASS AUDIT / NOT LOGIN-READY** |
| Protected staging Access | Check current login gate without bypass | **1 staging Access app**, allow policy **Cloudflare account members**; **1** current Access user. No policy modified | **PASS READ-ONLY** |
| QA mailbox availability | Deliverable project-owned identities distinct per role | Cloudflare account **0 DNS zones, 0 Email Routing destinations**. No new controlled test inbox provisioned | **BLOCKED** |
| Encrypted secret infrastructure | Secure persistent place for future QA secret entries | Created Cloudflare Secrets Store `iaict_staging_qa_credentials`; readback **1 store present**, **0 secrets**. Account-level encrypted service exists, but no password entries and no validated retrieval/automation lifecycle | **PASS EMPTY STORE ONLY** |
| IAM-USER-020 and authenticated role matrix | Eight legitimate Access/private Chromium sessions, 7 roles and second Admin | No new user activated, no native password created, no signed-in browser run; no identity policy change | **BLOCKED / NOT_RUN** |

- **Execution:** connected Cloudflare management API; only *read* hosted staging D1 aggregates and Access/email/zone config; the **single write** created one *empty encrypted account-level Secrets Store* for later QA credential use. No Worker/D1 account writes, no Cloudflare account membership invites, no Access policy edits, no new login session, no production changes.
- **Security guard:** prior access-tool-read failure from 2026-11-03 resolved; do not keep it as current blocker. Cloudflare Access account-member-only rule means **adding D1 users alone cannot grant Access**. Do not invite personal Cloudflare account members to bypass onboarding. Creating a secret store does **not** establish an approved vault operating process or prove a secret has been saved. Owner's staging-only QA account creation permission remains in force via PR #66. Test case catalog stays **89**; prior `RUN-IAM-20261103-02` observations preserved.
- **Evidence:** API aggregate counts and configuration metadata only; no screenshot required. Private [QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp). GitHub CI/public Chromium is regression proof only, not authenticated browser E2E.

## RUN-IAM-20261103-04 — native-auth.ts with original IAM migrations and disposable local D1

| Test case / layer | Environment | Expected and observed | Verdict / limitation | Evidence |
| --- | --- | --- | --- | --- |
| IAM-AUTH-020 — actual native auth functions | Random ephemeral local Miniflare D1 populated from original committed `0001/0022/0023/0024` migrations; Vitest Node WebCrypto; 8 synthetic `example.test` role identities | **7 integration tests reported PASS in the portal-ci unit-test step** at source SHA `d380dfd451ff74e34da82c64cdd92f0f63a65721`: seeded eight roles; generated random in-process PBKDF2 credentials and validated real hashed sessions; prevented spoofed headers and malformed cookies; rotated password and revoked prior sessions; disabled and roleless account denial; 5-failure lockout; token-specific revocation | **PASS LOCAL_INTEGRATION_ONLY**, no Cloudflare Access/JWT, no hosted D1, no browser session, no real MFA | [Portal CI #41528349945](https://github.com/ntdung-tds/iaict-portal/actions/runs/41528349945) · `lib/native-auth.real-d1.test.ts` |
| Authorized staging 7 roles + Admin2 | Cloudflare Access + independent controlled QA mailboxes + private Chromium | Cloudflare Access account has **one Cloudflare IdP and no OTP provider**; staged QA D1 8 placeholders still disabled as of [RUN-IAM-20261103-03](./IAICT_TEST_RUNS.md). One connected personal Outlook.com mailbox can accept `+tag` subaddresses per Microsoft documentation, but that is **one shared inbox**, not 8 controlled independent test mailboxes; not used for staging account identities | **BLOCKED / NOT_RUN** | [Cloudflare OTP requirements](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/) · [Microsoft Outlook.com plus addressing](https://support.microsoft.com/en-us/outlook/send-email-from-a-different-address-in-outlook-com) |

- Source SHA `d380dfd451ff74e34da82c64cdd92f0f63a65721` is the **pre-evidence documentation commit**; exact final PR HEAD must pass portal CI and real public staging Chromium after these QA/PCS changes. Browser checks do NOT validate real signed-in roles in the absence of legitimate Access credentials.
- Local synthetic secrets are generated in memory, never printed, stored in GitHub/Drive/Cloudflare or reused across sessions. No production, Access policy, hosted D1, account membership or staging Worker modifications. No screenshot required for local SQL/backend tests.
- **Remaining test gap:** direct out-of-band role regrant/reactivate might revive previously minted native sessions unless handled by normal Admin API session revocation; live Worker endpoints and actual Access policy never tested here. Do not overstate the independent SQL-epoch proof as live MFA. SRS FROZEN, ADR-0002 PROPOSED. Evidence folder [restricted QA](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).

- **Cloudflare Secrets Store suitability correction (API schema checked 2026-11-03):** `secrets[].value` is **write-only**, and Cloudflare's management API never returns the stored value. The previously created `iaict_staging_qa_credentials` store is still **empty (0 secrets)**; **do not use it as a recoverable password manager** for agents/Playwright. It can only back services through authorized bindings and a separately designed secure credential lifecycle. Connect a dedicated managed password vault or isolated authorized QA browser workstation instead. Never claim credentials are retained for future browser use merely because a secret was successfully written.


## RUN-IAM-20261103-05 — full feasible staging QA: real native negative login and Cloudflare Access boundary

**Date:** 2026-11-03 (ICT). **Authorized target:** deployed `iaict-portal-staging` ONLY. **PR:** [#75](https://github.com/ntdung-tds/iaict-portal/pull/75). **Tested source before this evidence commit:** `04ca5de8bcac99d490d2370f4a520b5265dcb8e0`.

| Layer / registered cases | What ACTUALLY ran | Measured | Verdict |
| --- | --- | --- | --- |
| `IAM-AUTH-021` real Chromium negative sign-in | Actual staging `/login` DOM filled with one randomized absent `example.test` address and an unusable synthetic password, submitted through UI to real POST `/api/auth/login` | **401**, native login error alert, no `__Host-iaict_session` cookie, no successful redirect, anonymous `/api/auth/session` **401** | **PASS REAL_STAGING_NEGATIVE** |
| `IAM-AUTH-022` real same-origin and activation guard | Real deployed staging API receives forged foreign Origin (no valid account); syntactically invalid activation token | Login request **403**; activation **400**; no native cookie. No invitation or credential issued | **PASS REAL_STAGING_NEGATIVE** |
| `IAM-ACC-007` real protected edge anti-spoofing | Five staging `/admin` and `/api/admin` routes receive forged client CF identity headers without a legitimate Access session | All five redirected to Cloudflare Access login and no native session cookie | **PASS REAL_STAGING_NEGATIVE** |
| Full public staging/browser suite | Real Playwright Chromium against deployed staging, unmocked; includes above 3 tests | **24/24 PASS** | **PASS PUBLIC + NEGATIVE AUTH** |
| Public staging availability | Repeated read-only probes against 24 public HTTP routes | **24/24 PASS**, 0 observed 503, 0 5xx, 0 transport errors in THIS sample | **PASS SAMPLE**, intermittent Issue #30 remains OPEN |
| Local isolated and build gates | Portal CI: Vitest real native-auth D1 integration plus other unit/security, local Chromium, workerd KDF, typecheck, build | **566/566 Vitest**, **38/38 local Chromium (some mocked)**, **4/4 portal CI jobs** | **PASS LOCAL / CI**, not protected login acceptance |
| Staging hosted D1 readback after live Chromium | Read-only Cloudflare D1 `PRAGMA quick_check`, foreign key check and aggregate counts | **quick_check=ok**, **0 FK violations**; 10 total CMS accounts, 8 QA fixtures of which **0 active**, **0 QA passwords** and **0 QA Access subjects**; 1 credential overall in a non-QA account (not touched); 0 active native sessions. Login attempt counter table had 3 cumulative rows, cannot attribute all to this run. | **PASS INTEGRITY / QA ACCOUNT UNCHANGED** |
| Worker, Access and secret scope | Cloudflare read-only staging/production deployment inventory + Access policy and Secrets Store | Staging latest deployment `754b0509-e754-410c-8dff-46015d162a89`; production readback `a01a3743-ac78-4a19-a990-581fe9235751`. Staging Access still account-member-only / Cloudflare IdP; account-level QA Secrets Store **empty, write-only values** | **NO RELEASE / NO POLICY CHANGE** |
| Live authorized `IAM-USER-020`, 7 roles + second Admin | Actual signed-in Access and native CMS sessions and positive/negative permission/IDOR matrix | **NOT_RUN**: existing eight `example.test` QA users are disabled and no controlled independent QA mailboxes, approved reusable credential vault or valid Access browser state. Test credentials **not** created | **BLOCKED**, **NOT ACCEPTED** |

- **Evidence:** [portal-ci #41533428400](https://github.com/ntdung-tds/iaict-portal/actions/runs/41533428400) (all four PASS; 566 Vitest; 38 local Chromium); [public staging #41533428059](https://github.com/ntdung-tds/iaict-portal/actions/runs/41533428059) (24 Chromium and 24 HTTP probes PASS). QA media not captured, because this is a programmatic security test; only store future screenshots in the [restricted IAM evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).
- **Security/side-effect boundary:** one randomized absent synthetic email submitted to live staging login can generate a D1 failed-login counter. No real account activation, password write, Access membership, roles, invitations, MFA, Worker deploy, migration, production mutation or secret/PII export. Automated reports have screenshot/video/trace OFF. No genuine 7-role positive login performed. Native login rejection is not proof that a real authenticated user can access CMS.
- **Post-evidence gate:** because this record/PCS are new changes, final PR head must independently pass CI plus Chromium again, then merge. Never backfill an unobserved real role PASS.


## RUN-IAM-20261103-06 — actual Worker/native-cookie RBAC on disposable D1; downstream HTTP dispatcher MOCKED

| Field | Verified outcome |
|---|---|
| Date, scope and case | 2026-11-03; [PR #76](https://github.com/ntdung-tds/iaict-portal/pull/76); `IAM-ACC-008`; code SHA `3dcad1ff72038c6fc6d39ea98c38887ff4d1815b` **before this evidence/PCS commit** |
| Real implementation under test | Actual `worker.ts` ingress (native cookie verification, internal-header stripping, Origin guard), `lib/native-auth.ts` PBKDF2 credential and D1 session logic, `lib/newsroom-auth.ts` RBAC SQL, `lib/cms-roles.ts`, original unmodified `0001_core.sql`, `0022_iaict_native_auth.sql`, `0023_iaict_auth_pbkdf2_workers.sql`, `0024_iaict_activation_invites.sql` |
| Test fixture and mocked part | Eight independent randomly passworded synthetic `example.test` accounts in **disposable local Miniflare D1**. **Only** `vinext/server/fetch-handler` dispatcher is mocked for seven `/api/admin/_qa/*` synthetic routes. No deployed CMS endpoints or real Cloudflare Access are involved |
| Positive/negative role coverage | **8 roles × 7 independent permission gates = 56 allow/deny decisions**, including second Admin; actual native cookie and D1 role query on each Worker request |
| Additional negative coverage | Missing/forged cookies, client-forged internal identity header, native feature disabled, cross-origin/absent Origin on POST, role deletion and inactive user refusal |
| New integration tests | **12/12 PASS** in [portal-ci #41536511330](https://github.com/ntdung-tds/iaict-portal/actions/runs/41536511330); actual `lib/native-worker.real-d1.roles.test.ts` 12 tests |
| Entire source/CI at tested SHA | **578/578 Vitest PASS**, **38/38 local Chromium PASS** (some mocked), **4/4 portal CI jobs SUCCESS** |
| Real public staging regression | [staging-acceptance #41536511374](https://github.com/ntdung-tds/iaict-portal/actions/runs/41536511374) **24/24 real Chromium PASS** and **24/24 HTTP PASS**, 0 observed HTTP503/5xx/network errors in sample. New `IAM-ACC-008` is *local*, not among these 24 real-staging tests |
| Hosted D1 status after tests | Read-only staging D1 `quick_check=ok`, 8 legacy QA rows still disabled with zero native credentials and zero Access subjects. No hosted D1 or Cloudflare policy touched by this PR |
| Real authenticated 8-role Access acceptance | **BLOCKED / NOT_RUN**: no independent controlled QA inboxes, valid per-role Access identities/browser state or approved recoverable credential manager |
| Media and security | No password, browser cookie, Access JWT or screenshot persisted; no production/staging Worker deployment. Media folder [restricted IAM Drive QA](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) — no image required for local API assertions |

**Verdict:** **PASS LOCAL_WORKER_INGRESS_REAL_D1_WITH_MOCK_HTTP_DISPATCH**. Does **not** prove real positive Cloudflare Access enrollment, actual hosted Admin API actions, or true signed-in role-browser E2E. The source SHA above was observed green; this documentation revision must receive its own exact-head CI and public staging Chromium checks before merge. SRS remains FROZEN; no live MFA implementation.

## RUN-IAM-20261103-07 — Real CMS role mutation API and native-session non-resurrection (isolated D1)

| Item | What was executed / observed | Verdict |
| --- | --- | --- |
| New `IAM-USER-021` integration test | Actual `worker.ts` ingress, `app/api/admin/cms/users/route.ts` GET/POST, `native-auth.ts` session validation, `requireNewsroomActor` role lookup and real isolated Miniflare D1 from committed migrations. Only the vinext HTTP dispatcher maps the actual route in the test; this is **NOT** hosted CMS or live Access sign-in | **PASS LOCAL_ACTUAL_ADMIN_ROUTE_REAL_D1** |
| Admin authorization | Native Admin can read actual user list; Editor cannot read user-management data (403); forged cross-Origin mutation request rejected (403) | **PASS** |
| Role reduction and session revocation | Admin updates Editor→Viewer using actual CAS D1 batch, old Editor session immediately returns 401 and is deleted; new Viewer session can read but cannot edit CMS | **PASS** |
| Stale optimistic update | Replay of original `updatedAt` is rejected **409** without revoking the newer Viewer session | **PASS** |
| Role regrant | Admin updates Viewer→Editor using fresh CAS version; earlier Editor and Viewer sessions remain invalid (401). Newly minted Editor session receives edit permission; D1 foreign keys remain valid | **PASS** |
| First CI round (before fixture fix) | [Portal CI #41539239411](https://github.com/ntdung-tds/iaict-portal/actions/runs/41539239411) failed 1/580 due to test fixture omitting the original CMS migration `0019_v17_full_cms.sql` and its `cms_revisions` table. This was **missing local test schema**, not a proven product defect. No application security code was changed | **FIXTURE DEFECT FOUND→CORRECTED** |
| Fixed-source CI round | [Portal CI #41539487495](https://github.com/ntdung-tds/iaict-portal/actions/runs/41539487495) **4/4 jobs SUCCESS**; `lib/native-worker.real-d1.roles.test.ts` **14/14 PASS**, total Vitest **580/580**, local Chromium regression **38/38** | **PASS FIXED SOURCE** |
| Real public staging | [Staging acceptance #41539487478](https://github.com/ntdung-tds/iaict-portal/actions/runs/41539487478) runs 24 real Chromium tests including 3 negative sign-in/Access tests plus 24 public HTTP probes; report status only after run completion, no assumption that test passed before observed | **PENDING WHEN LOG FIRST WRITTEN** |
| Positive live role browser | 8 disabled `example.test` staging QA fixtures remain without controlled independent inboxes or valid Access state. Existing Cloudflare Secrets Store is empty and write-only, not a recoverable password manager | **BLOCKED / NOT_RUN** |

- Code SHA `049346fe3f6528dd2b2fd0082619bfe18471fac9` is the **post-fix pre-report HEAD**; evidence/PCS changes require another exact-head CI and real public staging Chromium run before merge. [PR #77](https://github.com/ntdung-tds/iaict-portal/pull/77). Registered QA case `IAM-USER-021`, catalog **95**.
- This is a real code+SQL Admin API test in local isolated Miniflare, with mocked vinext request dispatch ONLY. No actual hosted admin account, session, password, role, activation, Access policy, or production mutation. Test passwords generated only in process and never stored/logged. No screenshot required; [private IAM QA evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).

## RUN-IAM-20261103-08 — real CMS deactivate/re-enable and session revoke (isolated D1)

| Check | Verification boundary / observed state |
| --- | --- |
| Scope | [PR #78](https://github.com/ntdung-tds/iaict-portal/pull/78), `IAM-USER-022` and `IAM-USER-023`; actual `worker.ts` ingress, `lib/native-auth.ts` session lookup, actual CMS Users DELETE/POST API, original migrations in temporary Miniflare D1. **Only vinext HTTP dispatch is mocked**. No hosted CMS endpoint or real Cloudflare Access login. |
| Identity and data | 8 synthetic `example.test` roles + Admin2; randomly generated passwords remain in process; no staging/production D1 or Cloudflare Access changes. |
| IAM-USER-022 | Admin deactivates News Editor via DELETE; old session invalid and password login denied. Admin reactivates by POST with fresh CAS version; old token stays invalid, fresh token receives News Editor role only; stale DELETE returns 409 and must not revoke new session. |
| IAM-USER-023 | Editor must not revoke sessions, foreign-Origin Admin POST must fail, actual Admin `revokeSessions` must revoke Admin2 native token. Admin2 can obtain a **new** token with original role; old token stays invalid. |
| Initial CI gate | [Portal CI #41549451897](https://github.com/ntdung-tds/iaict-portal/actions/runs/41549451897) initially FAILED `verify:qa` because code changed before the two case definitions were committed; **not yet evidence of a product failure or successful new integration tests**. Registered both QA cases before retry. |
| Execution and exact-HEAD result | **PASS** for pre-evidence documentation HEAD `64851453512ead5871000299b6824e2b4a97e00f`: [Portal CI #41549847143](https://github.com/ntdung-tds/iaict-portal/actions/runs/41549847143) **4/4 jobs SUCCESS**, **582/582 Vitest** including **16/16** actual Worker/D1 integration tests and **38/38 local Chromium**. [Public staging #41549847028](https://github.com/ntdung-tds/iaict-portal/actions/runs/41549847028) **24/24 actual Chromium PASS** and **24/24 public HTTP PASS**, zero observed HTTP503/5xx/network errors. The new actual CMS DELETE/POST tests were **local** only; hosted role-positive acceptance NOT_RUN. This evidence commit requires new exact-HEAD gates before merge. |
| Positive Access-authenticated 8-role browser | **BLOCKED / NOT_RUN** due missing controlled independent QA mailboxes, Access identities and recoverable vault. |
| Screenshots and media | No local API screenshot needed. All future actual browser QA captures must go only in [restricted IAM QA Drive folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp), never GitHub. |

**Result boundary:** LOCAL_ACTUAL_ADMIN_ROUTE_REAL_D1 with MOCK_HTTP_DISPATCH; must not be counted as actual hosted Access/API browser acceptance. SRS **FROZEN**; production untouched.


## RUN-CMS-20261103-01 — CMS article malformed JSON and protected cache boundary

| Field | Result |
| --- | --- |
| Scope | `CMS-ART-001`, `CMS-ART-002`; first non-IAM hardening slice after Owner paused IAM |
| Source | [Issue #79](https://github.com/ntdung-tds/iaict-portal/issues/79) · [CMS article route](../../app/api/admin/cms/articles/route.ts) · [local test](../../lib/cms-articles-atomic.test.ts) |
| Environment | Original CMS migration sources in disposable Node SQLite; real CMS route handlers, **mocked authorization actor**; no Cloudflare Access session, hosted D1, Worker deploy or credential mutation |
| Planned assertions | Invalid JSON/null/scalar/array/typed ID rejected with HTTP 400 and zero D1 writes; non-JSON media type refused; authenticated CMS GET/POST/DELETE responses explicitly no-store |
| Current status | **NOT_RUN ON FINAL PR SHA** — introduced source/test; await exact-head GitHub CI; do not infer PASS from committing code |
| Hosted CMS E2E | **NOT_RUN** (Owner IAM PAUSED, no new authenticated-browser session) |
| Screenshots | NOT_CAPTURED — isolated API assertions have no visual artifacts |
| Evidence | [Private QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp); update outcome with immutable SHA and run IDs only after actual workflow |


## RUN-CMS-20261103-02 — Verified CMS API input/cache regression + deployed public staging smoke

| Field | Observed evidence |
| --- | --- |
| Date / exact source | 2026-11-03 · `979a1b41b53ba54ffc99e2586910a803592e3a1a` (complete CMS code+QA+PCS source head before append-only evidence record) |
| PR / issue | [PR #80](https://github.com/ntdung-tds/iaict-portal/pull/80), [Issue #79](https://github.com/ntdung-tds/iaict-portal/issues/79) |
| Cases and test layer | `CMS-ART-001`, `CMS-ART-002`: **PASS_LOCAL_SQLITE_MOCK_ACTOR** in real `app/api/admin/cms/articles/route.ts`; malformed input 400, zero audit/content writes, private response no-store |
| Portal CI | [run 41568024341](https://github.com/ntdung-tds/iaict-portal/actions/runs/41568024341): **4/4 jobs PASS**, 57 Vitest files / **585/585 tests PASS** (3 new CMS route assertions), **38/38 local Chromium PASS**. QA registry **99**; frozen SRS, requirements, checklist and release-safety validators PASS |
| Real public staging acceptance | [run 41568024151](https://github.com/ntdung-tds/iaict-portal/actions/runs/41568024151): **24/24 live Chromium PASS**, **24/24 HTTP PASS**, HTTP 503=0, 5xx=0, networkErrors=0 observed |
| Scope limitation | Real public staging runs against previously deployed Worker `1b8cfe71-88ef-4e21-8937-4f8590daaba4`, **NOT the PR #80 code**. No Cloudflare Access authenticated CMS browser E2E; no production/staging deployment of new CMS code. |
| Historical precursor | `RUN-CMS-20261103-01` was planning/NOT_RUN recorded before actual execution. This second immutable run captures real CI outcome, without rewriting the precursor |
| Media evidence | NO_IMAGE_REQUIRED for local API; real public test screenshots/traces not stored to GitHub. [Private Drive folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) available for sanitized visual artifacts when applicable |
| Evidence-commit status | **NOT_RUN** until exact final documentation head is retested in GitHub CI |


## RUN-CMS-20261103-03 — Newsroom source-to-public atomic SQLite lifecycle

| Field | Value |
| --- | --- |
| Issue / scope | [Issue #81](https://github.com/ntdung-tds/iaict-portal/issues/81) · `CMS-NEWS-001/002/003/004` |
| Environment | Actual `app/api/admin/news/ingest/route.ts`, `lib/news-repository.ts`, `lib/news-source-adapters.ts`, `app/api/admin/cms/articles/route.ts` and `lib/public-news.ts`, with disposable **original Core + V16/V17 migration SQLite** |
| Mock boundaries | **Only the authenticated actor and outbound RSS HTTP fixture are mocked**. No genuine Cloudflare Access login, remote D1, real external feed request or deployed Worker execution |
| Checks | RSS ingest and duplicate, manual approval CAS, stale publication/refusal, single article + provenance + audit, public visible then hidden after CMS archive, malformed JSON/Content-Type/role, upstream feed 503 failed run |
| Source SHA, CI | **PENDING** before first PR run; bind to exact immutable tested SHA, update through a separate append-only result record |
| Result | **NOT_RUN** pending actual CI. Do not infer PASS from created source and test file |
| Hosted browser acceptance | **NOT_RUN** for signed-in CMS/Newsroom; real public staging tests may run in GitHub Actions against previously deployed Worker, which is not the PR code |
| Evidence | QA data synthetic; no screenshot, cookies or secrets. Restricted [Drive QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) if a future sanitized visual reproduction requires it |
| Risk / rollback | Affected source: `app/api/admin/news/ingest/route.ts`, tests and documentation only; no staging D1 mutation or production deployment; SRS FROZEN; Owner IAM PAUSED |


## RUN-CMS-20261103-04 — Reproducible Newsroom test-fixture failure (original PR #82 head)

| Field | Observed outcome |
| --- | --- |
| Date | 2026-11-03 |
| Source SHA | `2a8c2576372ae41a54ca3e6fe3e38f495c720174` |
| CI | [portal-ci #41575273050](https://github.com/ntdung-tds/iaict-portal/actions/runs/41575273050): **FAIL verify / 588 passed, 1 failed (589 total)**; other jobs not evidence of this specific lifecycle case |
| Test case | `CMS-NEWS-001`: second RSS ingestion unexpectedly returned HTTP 500 instead of 200; `CMS-NEWS-002/003/004` passed at this tested SHA |
| Root cause | **TEST FIXTURE**, not proven product regression: `fetch` spy returned the same already-consumed `Response` on two calls (`mockResolvedValue(new Response(...))`). `fetchNewsSourceCandidates` reads response text each time; a consumed body is not reusable. |
| Fix / retest | Change RSS spy to `mockImplementation(async () => new Response(...))` so every request has a fresh independent response; committed at `32d849113d2953997ada4dc9bfa584741b0e8935`. Follow-up new run `RUN-CMS-20261103-05`. |
| Risk | No hosted Cloudflare Access/D1/Worker, RSS network or production write performed. No screenshot or credentials. |

## RUN-CMS-20261103-05 — Corrected Newsroom original-migration SQLite + live public staging (verified source SHA)

| Field | Observed outcome |
| --- | --- |
| Date and exact source SHA | 2026-11-03 · `32d849113d2953997ada4dc9bfa584741b0e8935` |
| Scope | [PR #82](https://github.com/ntdung-tds/iaict-portal/pull/82), [Issue #81](https://github.com/ntdung-tds/iaict-portal/issues/81), `CMS-NEWS-001/002/003/004` |
| Real source execution (local) | **PASS_LOCAL_ORIGINAL_MIGRATION_SQLITE** — actual Newsroom API and RSS parser, actual Core+V16+V17 SQLite migration schema, real review CAS/claims, CMS article archival and published-site DB queries. **Mock boundaries:** authorization actor and upstream RSS HTTP only |
| Corrected portal CI | [run 41575415530](https://github.com/ntdung-tds/iaict-portal/actions/runs/41575415530) **4/4 jobs PASS**, **589/589 Vitest**, **38/38 local Chromium**. QA registry **103 cases**, frozen SRS, PCS checklist, requirements and release gates PASS |
| Actual deployed public staging | [run 41575415524](https://github.com/ntdung-tds/iaict-portal/actions/runs/41575415524) **24/24 real Chromium PASS**, **24/24 HTTP probes PASS**, observed 503=0, 5xx=0, network errors=0 |
| Deployment/auth distinction | Staging Chromium/HTTP exercised **previously deployed Worker**, **not** PR #82 Newsroom ingest code. Genuine Access-authenticated CMS/Newsroom browser lifecycle **NOT_RUN** (IAM Owner PAUSED). Real remote RSS fetch was **mocked** in local integration test. |
| Evidence | [Private Drive QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp), no screenshots required for database/API assertions; no credentials, cookies or PII committed |
| Documentation-head gate | **NOT_RUN yet** at time this immutable record was written; exact post-evidence source SHA CI must pass before merge |


## RUN-CMS-20261103-06 — Second independent Newsroom adapter security review (pending CI)

| Field | Result / boundary |
| --- | --- |
| Date | 2026-11-03 |
| Reviewed baseline | Post-merge [PR #82](https://github.com/ntdung-tds/iaict-portal/pull/82) source SHA `1bf71d4dccc3cb43454202b104b217bd61990bad` |
| Findings | Unchecked automatic source-fetch 3xx redirect destinations; full `Response.text()` memory allocation before actual-byte cap check on streaming/chunked feed |
| Fix proposed | `redirect: manual` + HTTPS/source-host allowlist/URL userinfo rejection + bounded 3-hop handling; `ReadableStream.getReader` with 1.5/2.5 MB cap and cancellation on overrun |
| New cases | `CMS-NEWS-005` redirects, `CMS-NEWS-006` streamed body size; deterministic injected upstream HTTP, no external fetch or real identity |
| Execution | **NOT_RUN ON FINAL PR SHA** — source and tests committed, CI required before PASS; record actual SHA separately on next evidence run |
| Authentication / deployment | IAM PAUSED; real Access-authenticated Newsroom workflow NOT_RUN. No staging or production Cloudflare Worker deployment or D1 mutation performed |
| Evidence | Test source `lib/news-source-adapters.test.ts`; restricted Drive QA root https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp; no screenshot or private data required |
| Previous baseline | [Portal CI #41576292919](https://github.com/ntdung-tds/iaict-portal/actions/runs/41576292919) 589/589 Vitest and [public staging #41576292871](https://github.com/ntdung-tds/iaict-portal/actions/runs/41576292871) 24/24 Chromium + 24/24 HTTP PASS; those outcomes **do not cover these new two edge cases** |


## RUN-CMS-20261103-07 — Actual first green CI of independent Newsroom security fix

| Field | Observed evidence |
| --- | --- |
| Reviewed source SHA | `043b270b68aa1290bdb52bb6e7a44259cddc59fb` (first complete source + QA/PCS checkpoint before this evidence entry) |
| PR / issue | [PR #83](https://github.com/ntdung-tds/iaict-portal/pull/83), [Issue #81](https://github.com/ntdung-tds/iaict-portal/issues/81), `CHG-TIN-TUC-20261103-02` |
| Cases | `CMS-NEWS-005/006` **PASS_LOCAL_INJECTED_HTTP**. Real `fetchNewsSourceCandidates` logic checked with injected `fetch` returning controlled redirects, ReadableStream and RSS. Disallowed URL never fetched; valid same-host relative redirect parsed; redirect loop bounded; >1.5MB chunked response cancelled and declared excessive Content-Length rejected. |
| Exact source CI | [portal-ci #41584604136](https://github.com/ntdung-tds/iaict-portal/actions/runs/41584604136) **4/4 jobs PASS**, **594/594 Vitest**, **38/38 local Chromium**. QA registry **105 cases**, frozen SRS and Checklist Moment guard PASS. |
| Actual public staging | [staging #41584604067](https://github.com/ntdung-tds/iaict-portal/actions/runs/41584604067) **24/24 Chromium PASS**, **24/24 repeated HTTP probes PASS**, 503=0, 5xx=0, network errors=0 observed. |
| Environmental boundaries | This staged **public** browser suite exercises the existing Cloudflare Worker version from 2026-10-31. It is **not** a hosted run of the new redirect/stream fix. HTTP source RSS, authorized CMS browser and access session still **NOT_RUN**. No live D1/Cloudflare Access change. |
| QA media | No screenshot needed for deterministic HTTP adapter tests; no cookies, private user data or images committed. Restricted [Drive folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) retained. |
| Final documentation-head CI | **NOT_RUN when record written**; must verify final PR-head SHA again, then merge and test postmerge. |


## RUN-CMS-20261103-08 — Two independent Newsroom adapter review passes (pre-CI record)

| Field | Scope and pending result |
| --- | --- |
| Reviewed baseline | Merged PR #83, development SHA `c86ff18adfef49b5454cc71b2649aa81ae840bd1` |
| Pass 1 — findings | Source and candidate allowlisted URLs accepted nondefault HTTPS ports and credential-bearing candidate links. Malformed numeric XML entities (out-of-range/surrogate/invalid controls) could throw and abort ingestion. |
| Pass 2 — findings | Waiting on source stream cancellation could indefinitely stall redirect/oversize paths. Declared oversized responses and invalid redirect bodies needed prompt resource cancellation even when rejecting. |
| Fix | `lib/news-source-adapters.ts`: enforce default HTTPS port, no URL userinfo, XML 1.0 valid character ranges with U+FFFD replacement, and fire-and-forget cancellation with rejection handling while keeping max redirect/byte limits and fetch abort guard. |
| Case IDs | `CMS-NEWS-007`, `CMS-NEWS-008`, `CMS-NEWS-009`; source tests in `lib/news-source-adapters.test.ts`; total **108** registered test cases. |
| Test boundary | Full real Newsroom source parser/fetch adapter with injected deterministic `fetch`, controlled `Response` and `ReadableStream`; **no live network, no hosted D1/Access/session, no external RSS**. |
| Execution state | **NOT_RUN on final PR SHA**. The code/test commits exist; actual CI results must be appended as a new immutable Run after execution. No PASS claim at this point. |
| Safety | Owner IAM PAUSED; production, SRS and staged Worker unchanged; no screenshot/cookie/secret artifacts; restricted Drive root https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp |

## RUN-CMS-20261103-09 — Verified original-source double-review of Newsroom adapter

| Field | Actual observed evidence |
| --- | --- |
| Review source | PR #84 source SHA `297ba4fbcf5cfdf262e0f8593c86320be37ed068`, following 2 independent audit passes on merged PR #83 |
| Case IDs | `CMS-NEWS-007` custom HTTPS port and candidate URL userinfo; `CMS-NEWS-008` invalid XML numeric character references with fallback U+FFFD; `CMS-NEWS-009` stalled redirect stream cancellation and declared over-limit body cancellation. |
| Environment and scope | **PASS_LOCAL_INJECTED_HTTP** in actual `lib/news-source-adapters.ts` with deterministic `Response` and `ReadableStream` fixtures, no actual external RSS, Access session or hosted Worker. Existing Core+V16+V17 Newsroom SQLite lifecycle regression also passed via standard test suite (actor/upstream mock). |
| Portal CI | [run 41609011114](https://github.com/ntdung-tds/iaict-portal/actions/runs/41609011114): **4/4 jobs PASS**, **600/600 Vitest**, **38/38 local Chromium**. Registry **108 cases**, frozen SRS and PCS/checklist guards PASS. |
| Public staging | [run 41609010947](https://github.com/ntdung-tds/iaict-portal/actions/runs/41609010947): **24/24 Chromium PASS**, **24/24 repeated HTTP probes PASS**, observed HTTP 503=0, 5xx=0, network errors=0. |
| Limitations | Public staging tests run **previously deployed Worker**, not PR #84 code. Real-origin RSS redirect/timeout behavior and authenticated Newsroom CMS browser E2E **NOT_RUN**. IAM Owner PAUSED; production/staging deployments and hosted D1/Access untouched. |
| Earlier record | `RUN-CMS-20261103-08` recorded source-before-CI NOT_RUN; this append-only run reflects actual observed source SHA. |
| Final documentation commit | **NOT_RUN at record capture**; exact final SHA CI and public staging must be rerun before merge. |

## RUN-CMS-20261103-10 — Bounded iterative Newsroom HTML source review (pre-CI)

| Field | Scope and current status |
| --- | --- |
| Reviewed baseline | Merged [PR #84](https://github.com/ntdung-tds/iaict-portal/pull/84) SHA `4714a72562f3d46755170248650cc7aac3806bd9`; [Issue #81](https://github.com/ntdung-tds/iaict-portal/issues/81) |
| Loop rule | Find → reproduce on baseline → fix only the affected source/test → run full CI → independent re-review → repeat on any new reproducible defect. Stop when zero new reproducible issues **in scoped HTML source parser + Newsroom integration paths** and all exact-head gates pass; don't claim global zero defects. |
| Iteration 1 — observed | Original HTML link expression matched `data-href` and `title` text containing `href`, sometimes overriding the actual link and causing unsupported article candidates. Pure expression reproduction confirmed; full CI **NOT_RUN yet**. |
| Iteration 1 — change | Parse genuine quoted anchor attributes and require true `href`; keep source HTTPS/host/port credential validation. `CMS-NEWS-010/011`. |
| Iteration 2 — observed | HTML comments, script, style and template regions containing synthetic `<a>` sequences were interpreted as actual source article links; local reproduction confirmed. |
| Iteration 2 — change | Suppress non-visible/non-navigational HTML regions before extraction, including incomplete comments; retain legitimate visible anchors. `CMS-NEWS-012/013`. |
| Local test boundaries | Real source `parseHtmlNewsCandidates` and `fetchNewsSourceCandidates` with synthetic HTML and injected HTTP, no external feed/network. Newsroom original-migration SQLite lifecycle regression continues to run with mocked actor/upstream. |
| Catalog | **112 cases** (prior 108 + four new CMS-NEWS-010..013), no changes to historical IAM cases; IAM PAUSED. |
| Current verdict | **NOT_RUN on final PR SHA**. Source and tests committed; no PASS inferred. Append actual test run evidence with immutable SHA after GitHub CI and public staging browser results. |
| Hosted scope | Actual Worker staging with new source code, real source HTML over Internet and authenticated Newsroom CMS browser: **NOT_RUN**. Staging/production Worker versions and SRS baseline unchanged. |


## RUN-CMS-20261103-11 — Iterative Newsroom review discovered failure and third-pass correction

| Field | Observed outcome |
| --- | --- |
| First complete PR head | `7ca215f1da49912ffc22357228dbf84f2934ca06`, [PR #85](https://github.com/ntdung-tds/iaict-portal/pull/85) |
| Initial portal CI | [#41614538770](https://github.com/ntdung-tds/iaict-portal/actions/runs/41614538770): **FAIL verify**, `[qa-registry] FAIL line 113: invalid layer`; test catalog case `CMS-NEWS-013` used unsupported layer `Regression`, so the primary verify job stopped before full Vitest. |
| Initial public staging | [#41614538535](https://github.com/ntdung-tds/iaict-portal/actions/runs/41614538535) **workflow SUCCESS**. This checks an earlier deployed Worker, not new Newsroom HTML parser. |
| Fix 1 | Changed `CMS-NEWS-013` from `Regression` to supported `Integration`. Test case ID and scope preserved; no application behavior change from this fix. |
| Independent review 3 | The first `stripNonArticleHtml` pass used a single non-greedy regex for `<template>` sections. **Reproduced** that nested templates could leave a hidden outer-template `<a href>` exposed after the inner closing tag. |
| Fix 2 | Replace template removal with linear tag-depth scanning; keep link filtering inside the entire outer template, including nested and unclosed templates. Add two direct parser regressions and extend `CMS-NEWS-012` definition (same case ID, no duplicate case records). |
| Current result | **NOT_RUN on amended source/docs SHA**. Do not label the original 4/4 portal CI or 600+ Vitest PASS. Append separate actual outcome after complete retest. |
| Boundaries | Original website staging public only; synthetic Newsroom source HTML and upstream HTTP. No live authenticated admin, hosted D1/Access or production deployment. IAM remains owner-paused, SRS frozen. |


## RUN-CMS-20261103-12 — Review loop source gate PASS after QA-label fix and nested-template re-review

| Field | Observed evidence |
| --- | --- |
| Verified source commit | `5116f6e79cb9a0257ef041cbad8cbe28f17a3ee6`; [PR #85](https://github.com/ntdung-tds/iaict-portal/pull/85), [Issue #81](https://github.com/ntdung-tds/iaict-portal/issues/81) |
| Earlier failure preserved | `RUN-CMS-20261103-11` initial `verify` FAIL due unsupported QA layer `Regression`; corrected the case to `Integration`, preserving case ID `CMS-NEWS-013`. Separately fixed nested-template hidden-link leak and added two focused regression tests. |
| Test scope | **PASS_LOCAL_SOURCE_FIXTURE**. Real `parseHtmlNewsCandidates` and `fetchNewsSourceCandidates` with synthetic HTML/HTTP. Cases `CMS-NEWS-010..013` assert genuine href and reject fake `data-href`/title, hidden comments/scripts/styles/templates, nested/unclosed templates. Original Core/V16/V17 SQLite Newsroom integration (mocked actor and RSS HTTP) also runs in global Vitest. |
| Exact source CI | [portal-ci #41615306414](https://github.com/ntdung-tds/iaict-portal/actions/runs/41615306414): **4/4 jobs PASS**, **609/609 Vitest**, **25/25 source-adapter tests**, **38/38 local Chromium**. QA validator **112 cases**, SRS freeze and PCS/checklist/requirements gates PASS. |
| Real public staging | [staging #41615306400](https://github.com/ntdung-tds/iaict-portal/actions/runs/41615306400): **24/24 Chromium PASS**, **24/24 repeated HTTP probes PASS**, observed 503=0, 5xx=0, networkErrors=0. |
| Independent post-fix source re-review | Read back patched parser and 25 adapter tests at immutable SHA. No additional reproducible defect detected in explicitly scoped HTML source extraction cases after third iteration; no broader zero-bug claim or full DOM parser certification. |
| Explicit exclusions | Public staging still tests **previous deployed Worker**, not this PR code. Real external-origin HTML fetch and authenticated Newsroom browser E2E remain **NOT_RUN**; IAM PAUSED; no staging/production deployment, hosted D1/Access, SRS sync or private screenshots. |
| Final documentation HEAD and merge | **PENDING** at capture; rerun exact final-documentation SHA CI and public staging acceptance before merge, then verify postmerge SHA. |



## RUN-CMS-20261103-13 — PR #85 exact postmerge test evidence (observed)

| Field | Evidence |
| --- | --- |
| SHA and PR | `bd2ee459fd7303a7c5e7366d89732717c922c693` after [PR #85](https://github.com/ntdung-tds/iaict-portal/pull/85) MERGED, [Issue #81](https://github.com/ntdung-tds/iaict-portal/issues/81) OPEN |
| Final premerge gates | `bf301cf3eece274176a6448ba26e858fa78d31b9`: [portal CI #41616168711](https://github.com/ntdung-tds/iaict-portal/actions/runs/41616168711) PASS and [public staging #41616168612](https://github.com/ntdung-tds/iaict-portal/actions/runs/41616168612) PASS |
| Postmerge portal CI | [#41616598225](https://github.com/ntdung-tds/iaict-portal/actions/runs/41616598225) **4/4 jobs PASS**: verify, kdf-local-workerd, browser-visual, rc-ancestry. Living Master QA reports 609/609 Vitest and 38/38 local Chromium |
| Postmerge real public staging | [#41616598219](https://github.com/ntdung-tds/iaict-portal/actions/runs/41616598219): live-acceptance PASS, 24/24 public Chromium + 24/24 HTTP per QA Master; tests **previously deployed Worker**, not new parser code |
| QA sync check | [Master QA v2.12](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit) read and verified: 112-case snapshot, `CMS-NEWS-013`, postmerge SHA/CI. GitHub CSV 112 canonical case definitions, not 112 passed runs |
| Disposition | **PASS for scoped code/fixture CI plus public smoke only**; `T-NEWSROOM-REVIEW-LOOP` closed at source level. Previous FAIL `RUN-CMS-20261103-11` preserved; no global zero-bug claim |
| NOT_RUN | External RSS/HTML, real signed-in Newsroom browser, new Worker deployment/hosted D1. IAM PAUSED. Production and SRS untouched |
| Screenshots | NO_IMAGE_REQUIRED for fixture; private [Drive QA folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) only |


## RUN-MEDIA-20261103-01 — First Media/R2 threat-model and QA-gap checkpoint (NOT_RUN)

| Field | Observed state and explicit limit |
| --- | --- |
| Baseline development SHA | `844f7ddf37d2314eed55f1fe3f766e6610684226`; [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) |
| Scope | Source/config documentation audit + planned QA definitions, **no runtime upload implementation or execution** |
| Existing configuration | `cloudflare.config.ts` staging-only `MEDIA_BUCKET` points to isolated `iaict-portal-staging-media`; `app/api/admin` does not expose a dedicated media upload path in inspected tree |
| New test definitions | `CMS-MEDIA-001..012`, all **PLANNED**, `MANUAL`, **NOT_RUN**, not PASS |
| Functional/API/R2/Browser E2E | **NOT_RUN / NOT_IMPLEMENTED** (scan, upload, metadata, private read, deletion); IAM still owner-PAUSED |
| CI for this documentation PR | **NOT_RUN when recorded**; later SHA-specific automated repository CI is a documentation gate, not evidence of media API acceptance |
| Change / plan | `CHG-MEDIA-R2-20261103-01`; [Media threat model](../requirements/media-r2/MEDIA_R2_THREAT_MODEL_2026-11-03.md) |
| Screenshots and artifacts | NO_IMAGE_REQUIRED; future private [Drive media QA root](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) |
| Controls | No Worker deploy, hosted R2/D1 mutation, Access/credential change, production change, or SRS approval implied |
| Google Master readback | [v2.13](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit) verified header **124** and all 12 distinct `CMS-MEDIA-001..012` PLANNED/MANUAL/NOT_RUN after document sync; no media execution PASS implied |
| Live R2 metadata only | **PASS_READ_ONLY_BUCKET_METADATA** (Cloudflare GET only, 2026-11-03): bucket `iaict-portal-staging-media` exists APAC, `r2.dev` disabled, 0 custom domains, 1 enabled default multipart-abort lifecycle rule; no evidence of app object retention. CORS query unverified. **No object listing/read/write/delete**. Master Google QA v2.13 updated/read back; all media functional test cases remain **NOT_RUN**. |

## RUN-MEDIA-20261103-02 — B3.2 pure upload preflight code (initial, before CI)

| Field | Evidence / scope |
| --- | --- |
| Baseline | development `4b96dd1ce89de662f8ba57dd5db76268675dbd05`, [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) |
| Code | `lib/media-upload-contract.ts` isolated helper, `lib/media-upload-contract.test.ts` |
| New cases | `CMS-MEDIA-013/014/015` AUTO READY; 127 total catalog |
| Local exploratory execution | Standalone Node/TypeScript smoke: 9/9 test groups PASS using a locally constructed test shim. This is not canonical GitHub CI evidence |
| CI / Chromium / public staging | **NOT_RUN at capture**, exact PR-head QA evidence to be added after actual workflows complete |
| Hosted media upload / R2 scan / login | **NOT_IMPLEMENTED / NOT_RUN**; 12 earlier `CMS-MEDIA-001..012` remain PLANNED |
| Product policy | Required explicit policy, test MIME and size are fixtures, **no Owner-approved runtime settings** |
| SRS / production / secrets | Untouched; IAM PAUSED, no Worker deployed, no R2/D1 mutations, no screenshot generated |
| Drive | https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3 |

## RUN-MEDIA-20261103-03 — B3.2 exact source CI and public staging smoke PASS

| Field | Actual observed result |
| --- | --- |
| Exact tested source SHA | `139ea0b1aee543fbe328dab7c4ebbded10ba905c`, [PR #88](https://github.com/ntdung-tds/iaict-portal/pull/88), Issue #39 |
| Canonical Portal CI | [#41629737599](https://github.com/ntdung-tds/iaict-portal/actions/runs/41629737599) **4/4 jobs PASS** (verify, browser-visual, rc-ancestry, local workerd KDF); new `lib/media-upload-contract.test.ts` belongs to full Vitest verification. 9 local test definitions; no independent count from CI logs claimed |
| Public real staging | [#41629737613](https://github.com/ntdung-tds/iaict-portal/actions/runs/41629737613) live-acceptance job **PASS**. Tests previously deployed public Worker; **not** newly written Media preflight or upload |
| QA cases | `CMS-MEDIA-013/014/015` **PASS_LOCAL_CODE_CI** (pure function scope only); `CMS-MEDIA-001..012` **PLANNED/NOT_RUN** (backend, scan, RBAC, real R2) |
| Master Doc sync | [QA v2.14](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit) **readback VERIFIED** header 127 cases (97 IAM + 30 CMS); 15 unique CMS-MEDIA cases including 3 AUTO/READY, 12 PLANNED; title updated |
| Not proved | No full image decoder or scanner, no stream memory cap, no D1/R2 objects, no real authenticated CMS browser, no MIME/size production approval, no Worker deployment |
| Follow-up | Final **documentation HEAD CI/staging still PENDING** at capture; rerun on exact final PR SHA, merge only if green and independently verify postmerge |
| QA media | NO_IMAGE_REQUIRED for unit suite; [private Drive evidence](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) only. IAM PAUSED; SRS/production unchanged |


## RUN-MEDIA-20261103-05 — Media preflight dynamic-policy TOCTOU test-first reproduction

| Field | Evidence / status |
| --- | --- |
| Source baseline | `74792c91e6e2e9a77bea02e95dddabec3941dfe9`, merged PR #88, PCS canonical rev51 |
| Defect | Pure helper re-reads policy size/MIME getters after nominal validation; a changing getter can bypass initially validated policy. Throwing getter propagates an exception. No hosted Media/API implication |
| Test-first SHA | `02d5c7f930e1c7c7e82ccfdfae3353b180e16755`: 3 new negative regression test definitions under existing `CMS-MEDIA-015` |
| Initial CI | **PENDING** (test-first PR gate not complete at record creation); do not claim test-failure CI until observed |
| Synthetic local proof | Dynamic maxBytes getter: first read 1 and later 100 permits 6-byte candidate; dynamic MIME getter: validated image/png then later image/jpeg allows claimed JPEG. This is confined to adversarial configuration getters |
| Fix strategy | Copy validated fields once into immutable primitives/local Set and return structured `POLICY_NOT_CONFIGURED` for failing getters. Preserve previous PASS after separate rerun `RUN-MEDIA-20261103-06` |
| Security scope | `CMS-MEDIA-015` only; existing 127-case catalog unchanged, Media 001..012 PLANNED/NOT_RUN, no real R2 or Worker upload |
| Evidence | No screenshots needed; [QA private Drive](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) reserved for real browser |


## RUN-MEDIA-20261103-06 — Three bounded review-loop cycles: FAIL → FIX → PASS_LOCAL_FIXTURE

| Stage | Exact SHA and observed result |
| --- | --- |
| Baseline | PR #88 merged at `74792c91e6e2e9a77bea02e95dddabec3941dfe9`, original postmerge CI [#41630834586](https://github.com/ntdung-tds/iaict-portal/actions/runs/41630834586) PASS |
| RED #1 policy getter | Test-first SHA `ed0afd1110165ca95e0e79032a103f7a2fb7fe3e`, [portal CI #41633762844](https://github.com/ntdung-tds/iaict-portal/actions/runs/41633762844): **FAIL Unit tests** |
| GREEN #1 | Fix `f9dab556f59720458774af67046df4f4623981f8`, [portal CI #41633986765](https://github.com/ntdung-tds/iaict-portal/actions/runs/41633986765) PASS: policy snapshot once |
| RED #2 input getter | Test-first SHA `7dc4bc5edfc230503afc468f032055a84ca9232b`, [portal CI #41634251463](https://github.com/ntdung-tds/iaict-portal/actions/runs/41634251463): **FAIL Unit tests** |
| GREEN #2 | Fix `09599e899641142ce819344b2bc776c28b9b394c`, [portal CI #41634397290](https://github.com/ntdung-tds/iaict-portal/actions/runs/41634397290) PASS: single candidate snapshot and safe invalid-input rejection |
| RED #3 typed-array size | Test-first SHA `9838c230c1d62d104d246e42b66ad461103fe4eb`, [portal CI #41634825650](https://github.com/ntdung-tds/iaict-portal/actions/runs/41634825650): **FAIL Unit tests** |
| GREEN #3 | Fix SHA `7b85189dbd11d119677aaef3dae7a8661e34ff13`, [portal CI #41635067760](https://github.com/ntdung-tds/iaict-portal/actions/runs/41635067760) **4/4 PASS**, [public staging #41635067742](https://github.com/ntdung-tds/iaict-portal/actions/runs/41635067742) **PASS**: intrinsic typed-array length, not overrideable subclass properties |
| Case registry | Existing `CMS-MEDIA-015` refined to include accessor/size spoofing; **127** total (15 Media); [Google Master QA v2.15](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit) readback verified |
| Scoped independent review | No further reproducible issue observed after three fixes in these source fixture paths; **not** a guarantee of global zero bugs |
| Explicit exclusions | Live upload API, malware scanner, real R2/D1 read/write, CMS account browser, streaming body cap, IAM/Access and production changes remain **NOT_RUN/NOT_IMPLEMENTED**; `CMS-MEDIA-001..012` PLANNED |
| Last documentation SHA | **PENDING exact CI** when recorded; rerun both workflows after final docs and PCS checkpoint, then postmerge |



## RUN-MEDIA-20261103-07 — PR #89 postmerge CI, public staging and Worker deployment readback

| Field | Observed evidence and boundary |
| --- | --- |
| Merge | [PR #89](https://github.com/ntdung-tds/iaict-portal/pull/89) MERGED on 2026-11-03, development SHA `9dc3bfc88c84d1548c3de907f9bdb8b28314aa2a`; source review fixes in `RUN-MEDIA-20261103-06` |
| Postmerge Portal CI | [#41636778451](https://github.com/ntdung-tds/iaict-portal/actions/runs/41636778451): **PASS 4/4** jobs `verify`, `kdf-local-workerd`, `browser-visual`, `rc-ancestry` |
| Public staging smoke | [#41636778629](https://github.com/ntdung-tds/iaict-portal/actions/runs/41636778629): **PASS 1/1** `live-acceptance` against *previously deployed* staging Worker; NOT Media upload E2E |
| Cloudflare read-only deployments | staging `iaict-portal-staging`: deployment `754b0509-e754-410c-8dff-46015d162a89`, version `1b8cfe71-88ef-4e21-8937-4f8590daaba4` (100%, deployed 2026-10-31); production `iaict-portal` version `e7c703f7-fc4c-4313-b14c-0a2c94e0613d` (100%, deployed 2026-10-15). GET only, no deploy/modify |
| Exact scope | B3.2 isolated preflight helper and regression + CI PASS after merge. Existing 127 QA case definitions (15 Media); 3 pure-helper cases `013..015` source CI PASS; `001..012` remain PLANNED / NOT_RUN |
| Still NOT_RUN | Authorized CMS media browser, real API upload, hosted R2/D1 mutations, size/stream enforcement, scanning/quarantine, image decode, full RBAC/security acceptance. No new staging Worker deployment |
| Next decision | B3.3 format/size, scanner/quarantine, private object ownership and lifecycle, approval before hosted implementation. IAM owner-PAUSED; SRS FROZEN; production HOLD |
| QA media | NO_IMAGE_REQUIRED for this GitHub CI and Worker metadata check; future browser evidence ONLY in private [Drive QA folder](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) |



## RUN-MEDIA-20261103-08 — B3.3 grouped Media lifecycle fixture FAIL → FIX → RETEST (source only)

| Field | Exact evidence and limitations |
| --- | --- |
| Source scope | [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39), [PR #91](https://github.com/ntdung-tds/iaict-portal/pull/91), `CHG-MEDIA-R2-20261103-04`: proposed policy decisions + **pure unwired** lifecycle graph/CAS revision pair and negative fixtures. No hosted API |
| Initial RED SHA | `7202f84c6cb36c96be93f223efc0a6f925a7d3e2`, [Portal CI #41672527992](https://github.com/ntdung-tds/iaict-portal/actions/runs/41672527992): verify **FAIL**, Vitest **631 PASS / 2 FAIL** (633 total). Defect 1: revoked Proxy made Array.isArray throw outside try. Defect 2: test-helper default parameter coerced explicit undefined revision to zero (fixture bug, not product security bypass). |
| Fixes | `375fd429a9963645aa08894ca929981a5098148e` moves Array.isArray under catch; `12dd8c1cd83bff603d0fbca090c37119d0228ee0` corrects explicit undefined test fixture. Historical RED source run retained and separately retested GREEN |
| Retest fixed code SHA | `12dd8c1cd83bff603d0fbca090c37119d0228ee0`: [Portal CI #41672877119](https://github.com/ntdung-tds/iaict-portal/actions/runs/41672877119) **4/4 PASS**, 60 Vitest files / **633/633 PASS**, local Chromium job PASS. This verifies only pure unconnected B3.3 helper on that immutable source SHA; final docs-HEAD and postmerge checks remain separate |
| Public staging Chromium | [Staging acceptance #41672877117](https://github.com/ntdung-tds/iaict-portal/actions/runs/41672877117) **PASS** for public/browser smoke on *previous Worker deployment*; not evidence that B3.3 media code is running on staging. Postmerge readback separately required |
| Real CMS Media | `CMS-MEDIA-001..012` remain **PLANNED/NOT_RUN**. No scanner, actual D1 CAS, R2 write, permitted MIME-size policy, real role login or upload E2E |
| Registry and synchronization | **127** canonical case definitions unchanged / **15** Media; Google Master QA v2.15 previously readback; no case content changes |
| CI governance regression | On docs HEAD `63a29e5b8197f87cdfb6122406b70f84a054f633`, [CI #41673147492](https://github.com/ntdung-tds/iaict-portal/actions/runs/41673147492) verify FAIL **INVALID_MOMENT_ID**; revised live/snapshot ID separator in commits `d5e599f9` and `0ff68b55`. Original documentation failure preserved; exact final HEAD CI still required |
| Owner/environment | All MED-DEC-01..07 **PROPOSED / NOT APPROVED**. IAM PAUSED, SRS FROZEN, no Worker deploy, staging/production/D1/R2/Access mutation or screenshots. QA media private [Drive](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3), **NOT_CAPTURED / NO_IMAGE_REQUIRED** |



## RUN-MEDIA-20261103-09 — B3.3 merge readback and independent postmerge gates

| Field | Evidence and strict scope |
| --- | --- |
| PR/merged SHA | [PR #91](https://github.com/ntdung-tds/iaict-portal/pull/91) MERGED to development at `79e401e00b7f7426ba4cc9d1047734d21a7a007a` |
| Final premerge gate | `9961978df0696da2e1fc6e582aab91fe86aa1dff`: [portal-ci #41673789698](https://github.com/ntdung-tds/iaict-portal/actions/runs/41673789698) **4/4 PASS**, [public staging #41673789867](https://github.com/ntdung-tds/iaict-portal/actions/runs/41673789867) **PASS** |
| Postmerge source CI | [portal-ci #41674297770](https://github.com/ntdung-tds/iaict-portal/actions/runs/41674297770) **4/4 PASS** on exact merge SHA, including verify, local workerd, browser-visual, ancestry |
| Postmerge public staging | [staging-acceptance #41674297780](https://github.com/ntdung-tds/iaict-portal/actions/runs/41674297780) **PASS 1/1**, both real public Chromium and repeated public HTTP availability probe succeeded; public old deployed Worker smoke only, never B3.3 helper live E2E |
| QA/regressions | Original `RUN-MEDIA-20261103-08` preserves red→fix→green source CI (633/633). **127 canonical cases / 15 Media**, no new case IDs; `CMS-MEDIA-001..012` hosted scanner/API/D1/R2 and authorized browser remain **PLANNED/NOT_RUN** |
| Operational changes | No new Worker deployment, D1 migration, hosted R2 object read/write/delete, IAM/Access, SRS, production or handover. All seven MED-DEC decisions remain PROPOSED. No screenshot required |



## RUN-MEDIA-20261104-01 — B3.4 bounded async stream source-only RED → FIX → RETEST

| Field | Actual evidence / strict boundary |
| --- | --- |
| Workstream | [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39), [PR #93](https://github.com/ntdung-tds/iaict-portal/pull/93), `CHG-MEDIA-R2-20261104-01`; pure unconnected `lib/media-stream-contract.ts` + `lib/media-stream-contract.test.ts` |
| Initial RED | Source SHA `a61e668efdeeaa6493dc799f591633b325b51c52`, [Portal CI #41723161906](https://github.com/ntdung-tds/iaict-portal/actions/runs/41723161906) verify **FAIL**: **645 PASS / 2 FAIL** of 647 Vitest. Case 1: intrinsic `byteLength` also accepts `Uint16Array` but stream contract requires byte chunks. Case 2: local fixture helper's default parameter replaced an explicit undefined policy; test harness mismatch, not a live security bypass. |
| First repairs | Source `c8d232ab4944558cf76f96b1b7474a73ec18fa6c` rejects all non-`Uint8Array` chunks before intrinsic length read. Fixture SHA `bc5bcad89c9c663bd32c627e49154ec3cfd977a4` passes explicit undefined directly to function under test. Original RED result preserved; **final exact-head retest pending** at initial checkpoint |
| Actual source test coverage | 14 local synthetic Vitest assertions cover maxBytes/maxChunks, split/chunked over limit, zero chunk loops, invalid policy/input, Proxy/getters, native typed array length, async iterator cancellation. No HTTP/R2 service or scanner invoked |
| Public browser | Real public staging Chromium workflow for PR #93 is a separate check against the **previously deployed** Worker. It does **not** demonstrate B3.4 behavior because the new helper is unwired |
| Existing QA baseline | **127 cases** / **15 Media**; no new/edited canonical case. `CMS-MEDIA-001..012` (including `CMS-MEDIA-004` hosted stream enforcement) **PLANNED/NOT_RUN**; Google Master v2.15 remains unchanged |
| Mutation / approvals | **NONE** to Worker, R2/D1, Access, IAM, production or SRS. All `MED-DEC-01..07` still PROPOSED; owner release/policy approval NOT_GIVEN. No screenshot required; future private QA evidence only in [Drive folder](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3) |

