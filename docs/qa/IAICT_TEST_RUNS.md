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
