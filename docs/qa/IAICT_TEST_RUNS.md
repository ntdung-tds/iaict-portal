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
