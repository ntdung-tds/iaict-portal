# IAM, người dùng, phiên đăng nhập, RBAC — thaydoi.md

**Module:** `iam-access` | **Status:** OPEN_CHANGE_LOG | **SRS integration:** PENDING USER SIGN-OFF

**Nguồn tham chiếu:** Đề cương chi tiết IAICT 2026, §10.1, §13; ND06, ND07. Chỉ là tham chiếu về yêu cầu; chưa tự coi là SRS đã được duyệt.

**Đối chiếu code hiện có (cần kiểm tra theo commit, không mặc nhiên nghiệm thu):** `app/admin/users/page.tsx`, `app/login/page.tsx`, `docs/adr/0002-iaict-native-mfa-totp-staged.md`.

## Nhật ký thay đổi

| CHG ID | Ngày | Mô tả ngắn | Trạng thái | PR/Commit | Test/Run | Quyết định đưa vào SRS |
|---|---|---|---|---|---|---|
| CHG-IAM-ACCESS-20261031-01 | 2026-10-31 | Khởi tạo nhật ký theo phân hệ để tập hợp thay đổi; cần đối chiếu lịch sử implementation trước khi nhập các thay đổi cũ | RECORDED — DOCUMENTATION ONLY | PR #36 | NOT_RUN — không có thay đổi runtime | CHƯA_CHỐT |

| CHG-IAM-ACCESS-20261031-02 | 2026-10-31 | Hồi cứu: thư viện TOTP và bộ test RFC 6238, chỉ ở mức thuật toán, **chưa có luồng MFA hoàn chỉnh** | BACKFILLED / UNIT_TESTED_ONLY | [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36), SHA `645a98d50bd132278733f6676ebc7c72aa88cb06` | IAM-FUT-007, RUN-IAM-20261031-02 (53 test files / 533 unit tests suite, không phải MFA live) | CHƯA_CHỐT |
| CHG-IAM-ACCESS-20261031-03 | 2026-10-31 | Hồi cứu: 8 QA identity staging theo vai trò, tất cả disabled, không password/Access; đăng nhập thật theo vai trò chưa thực hiện | BACKFILLED / D1_FIXTURE_ONLY | [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36), [Issue #34](https://github.com/ntdung-tds/iaict-portal/issues/34) | IAM-AUTH-017, IAM-USER-017, RUN-IAM-20261031-03; 7-role live NOT_RUN | CHƯA_CHỐT |

| CHG-IAM-ACCESS-20261031-04 | 2026-10-31 | Hồi cứu phiên tự quản lý, revoke invitation, lọc mật khẩu yếu | BACKFILLED / CI_TESTED / LIVE_AUTH_PENDING | PR #36 / `2a76deb5` | IAM-SESS-004/008, IAM-INV-006/007/008/011; RUN-IAM-20261031-01 | CHƯA_CHỐT |
| CHG-IAM-ACCESS-20261031-05 | 2026-10-31 | Hồi cứu optimistic concurrency khi sửa user/role: HTTP 428/409, atomic rollback | BACKFILLED / CI_TESTED / LIVE_ROLE_NOT_RUN | PR #36 / `16e08bc2` | IAM-USER-005/006/007/017/018; RUN-IAM-20261031-03 | CHƯA_CHỐT |

## Thay đổi chi tiết

### CHG-IAM-ACCESS-20261031-01 — Khởi tạo sổ theo dõi phân hệ
- **Trạng thái:** RECORDED — DOCUMENTATION ONLY, không phải bằng chứng feature đã được triển khai hay chủ dự án đã phê duyệt.
- **Trước:** chưa có sổ `thaydoi.md` riêng trong repository cho phân hệ này.
- **Sau:** sử dụng file này làm bản ghi thay đổi liên tục, tách khỏi `docs/requirements/SRS.md`.
- **Phạm vi:** quản trị tài liệu, không thay đổi API, D1, UI, quyền, bảo mật hay production.
- **Nguồn:** yêu cầu trực tiếp của chủ dự án ngày 31/10/2026; đề cương (§10.1, §13; ND06, ND07).
- **Quyết định/SRS:** CHƯA_CHỐT; không cập nhật SRS cho tới khi có yêu cầu chốt.
- **Test:** NOT_RUN/NO_RUNTIME_CHANGE; chỉ xác minh cấu trúc file, link và CI tài liệu ở PR.

### CHG-IAM-ACCESS-20261031-02 — Hồi cứu TOTP foundation (chưa chốt)
- **Trước:** chưa có primitive RFC 6238 TOTP trong mã nguồn theo đợt này.
- **Sau:** `lib/totp.ts` và `lib/totp.test.ts` trong nhánh phát triển; không tạo database/schema, không bật MFA, không sửa Cloudflare Access.
- **Lý do:** chuẩn bị kiểm thử thuật toán trước khi làm enrollment, encryption, throttle, CAS replay và recovery.
- **Ảnh hưởng:** code unit/security; không đổi chức năng đăng nhập được triển khai trên Worker.
- **Bằng chứng:** `RUN-IAM-20261031-02`, CI [#41192956639](https://github.com/ntdung-tds/iaict-portal/actions/runs/41192956639). Kiểm thử live MFA **NOT_RUN**.
- **SRS:** PENDING_OWNER_CHOT; không tự coi đã được duyệt.

### CHG-IAM-ACCESS-20261031-03 — Hồi cứu QA fixture theo vai trò (chưa chốt)
- **Trước:** staging D1 chưa có bộ tài khoản QA tách vai trò.
- **Sau:** 8 user fixtures trong staging D1, 8 role links và audit; tất cả khóa (`is_active=0`), không password, không Cloudflare Access identity.
- **Lý do:** chuẩn bị kiểm thử 7 vai trò và hai Admin tranh chấp; không được coi đây là test thành công của API onboarding hoặc đăng nhập thật.
- **Bằng chứng:** `RUN-IAM-20261031-03`, [QA identities on Drive](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit); live role E2E vẫn **NOT_RUN**.
- **SRS:** PENDING_OWNER_CHOT; không sửa SRS.

### CHG-IAM-ACCESS-20261031-04 — Hồi cứu quản lý phiên, thu hồi invitation, mật khẩu yếu
- **Nguồn:** [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36); source SHA `2a76deb5642d6f60a89c894fa91c7c30a42953c8`, staging deployment `754b0509-e754-410c-8dff-46015d162a89`.
- **Trước → Sau:** không có thao tác tự thu hồi các phiên native khác; chưa có Admin revoke activation invitation đang chờ. Nay `GET/POST /api/account/sessions` đếm phiên còn hoạt động và `revokeOthers` mà không trả token; revoke invitation nguyên tử + audit; kiểm tra mật khẩu mới chặn tập nhỏ mật khẩu dễ đoán, giữ tối thiểu **8 ký tự**.
- **Tác động:** `/account/security`, session/invite API, D1 sessions, audit; same-origin checks; không sửa Cloudflare Access hay production.
- **Traceability:** `IAM-SESS-004/008`, `IAM-INV-006/007/008/011`; [RUN-IAM-20261031-01](../../qa/IAICT_TEST_RUNS.md) và [CI #41186058883](https://github.com/ntdung-tds/iaict-portal/actions/runs/41186058883), suite **526/526 PASS**. [Staging acceptance #41186058888](https://github.com/ntdung-tds/iaict-portal/actions/runs/41186058888) là **pre-deploy PASS trên Worker cũ**, không phải kiểm thử chức năng này live sau deploy. Không quy đổi suite PASS thành từng case PASS.
- **Giới hạn:** real-auth multi-device NOT_RUN, browser post-deploy BLOCKED HTTP 429. [Drive IAM QA](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) — ảnh NOT_CAPTURED. **SRS:** CHƯA_CHỐT; rollback staging `bf2a0bfd-0e08-492c-9853-de6b35498b1b` nếu triển khai quy trình khôi phục.

### CHG-IAM-ACCESS-20261031-05 — Hồi cứu xung đột ghi sửa người dùng
- **Nguồn:** [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36), SHA `16e08bc20b06c4cb7b7b2cc54857bade322d333a`.
- **Trước → Sau:** sửa/deactivate user dễ bị ghi đè hoặc sai lệch ở các lần sửa đồng thời. Bản code mới dùng `updatedAt` guard, thiếu precondition trả **428**, stale edit trả **409**; transaction D1 thực hiện đồng bộ user/roles/audit/session/invitation và bảo vệ bản nháp UI khi gặp conflict.
- **Tác động:** Admin UI và API quản lý users, roles, session revoke, audit; không tạo D1 migration mới ở đợt optimistic concurrency.
- **Traceability:** `IAM-USER-005/006/007` được nhắm tới trong integration; `IAM-USER-017/018` yêu cầu live role/browser, hiện **NOT_RUN** ở [RUN-IAM-20261031-03](../../qa/IAICT_TEST_RUNS.md). Không coi CI của mã hiện hành là bằng chứng thực nghiệm 2-admin trên staging.
- **Giới hạn / bằng chứng:** 8 QA fixtures trên staging vẫn disabled, [private role registry](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit); live Access RBAC/IDOR pending. **SRS:** CHƯA_CHỐT; không deploy hay mở Access bằng ghi nhận hồi cứu này.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-IAM-ACCESS-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.

### CHG-IAM-ACCESS-20261102-01 — Thực nghiệm KDF local workerd (QA only)
- **Trạng thái:** TEST_EVIDENCE_ONLY / CHƯA_CHỐT; 2026-11-02.
- **Trước:** 100000 được giả định là hard cap; local workerd boundary NOT_RUN.
- **Sau:** bổ sung 2 QA case `IAM-AUTH-018/019`, `scripts/kdf-workerd/` và [RUN-IAM-20261102-01](../../qa/IAICT_TEST_RUNS.md) thực nghiệm tại SHA `82380adafceaa239f24438ee85fa8ef10cc9d343`: 100000 và 100001 đều thành công, source app giữ nguyên.
- **Traceability:** [PR #42](https://github.com/ntdung-tds/iaict-portal/pull/42), [CI #41384536088](https://github.com/ntdung-tds/iaict-portal/actions/runs/41384536088), isolated local workerd PASS. Các job khác phải kiểm tra trên final SHA.
- **Ảnh hưởng:** chỉ QA/CI/tài liệu; không sửa UI/API/D1/R2/Access/Worker deployed/production. 600000 và live-auth E2E NOT_RUN. Không có ảnh (NO_IMAGE_REQUIRED).
- **SRS:** FROZEN, chưa duyệt; ADR-0002 vẫn PROPOSED, không tự đổi KDF.

### CHG-IAM-ACCESS-20261102-02 — Thử nghiệm thư viện mã hóa MFA F2
- **Trạng thái:** PROPOSED / CHƯA_CHỐT, ngày 2026-11-02.
- **Trước:** chưa có lớp lưu trữ mã hóa yếu tố TOTP.
- **Sau:** thư viện AES-GCM độc lập `lib/mfa-secret-crypto.ts`, kèm kiểm thử `lib/mfa-secret-crypto.test.ts` và QA case `IAM-FUT-008`; không tích hợp vào API hoặc cơ sở dữ liệu.
- **Tác động:** thư viện và kiểm thử nội bộ; không sửa giao diện, D1, Access, staging hay production.
- **Đối chiếu:** Issue #37, ADR-0002 PROPOSED. CI/Run: PENDING tại thời điểm ghi; không tuyên bố chức năng MFA đã hoàn thành.
- **SRS:** CHƯA_CHỐT. Không sửa SRS hiện hành.

### CHG-IAM-ACCESS-20261102-03 — Local workerd AES-GCM runtime compatibility (QA-only)
- **Trạng thái:** PENDING_CI / CHƯA_CHỐT, 02/11/2026; task CMS-08/S3 (`T-IAM-MFA-F2`), Issue #37.
- **Trước:** `IAM-FUT-008` có Node/Vitest AES-256-GCM unit PASS nhưng chưa có bằng chứng chạy cùng thư viện trong Workers runtime.
- **Sau:** `scripts/mfa-workerd/` sử dụng esbuild có sẵn để bundle **đúng `lib/mfa-secret-crypto.ts`** vào workerd local `127.0.0.1:19388`; một bước trong GitHub PR job đã có chạy 11 kiểm tra với dữ liệu tổng hợp, chỉ xuất tên kiểm tra + verdict; `IAM-FUT-009` trong QA CSV. `probe.bundle.mjs` tạo tạm rồi xóa. Chỉ cập nhật PASS sau CI thật.
- **Ảnh hưởng:** CI + test + tài liệu; không đổi thư viện encryption đang dùng, route, Cloudflare bindings, tài khoản, D1, Access, staging hoặc production; không có secrets.
- **QA:** `IAM-FUT-009` READY; chưa phải MFA enrollment/login E2E (`IAM-FUT-001` vẫn NOT_RUN). Evidence local CI log, ảnh NO_IMAGE_REQUIRED.
- **Kiến trúc:** ADR-0002 tiếp tục PROPOSED; thiết kế vòng đời khóa, factor D1, CAS replay và recovery cần review trước bất kỳ tích hợp thực tế.
- **SRS:** FROZEN / CHƯA_CHỐT.


### CHG-IAM-ACCESS-20261102-04 — Review PR #45: độc lập trạng thái workerd crypto probe
- **Trạng thái:** QA_ONLY / CHƯA_CHỐT, 02/11/2026. [PR #46](https://github.com/ntdung-tds/iaict-portal/pull/46).
- **Trước:** `IAM-FUT-009` 11/11 PASS tại SHA `23c0960d` nhưng biến `checks` nằm ở phạm vi module, có thể dùng lại giữa các HTTP request trên cùng Worker isolate; lỗi ngoại lệ được cắt chuỗi thay vì cho phép tên lỗi an toàn.
- **Sau:** gom kết quả theo từng request, trả mã lỗi cho phép; cùng workerd local gửi hai request liên tiếp và thử path/method không hợp lệ. Không sửa `lib/mfa-secret-crypto.ts`, key, dữ liệu hay luồng MFA.
- **Kiểm thử:** `RUN-IAM-20261102-04` / `IAM-FUT-009`, [CI #41390187476](https://github.com/ntdung-tds/iaict-portal/actions/runs/41390187476), source SHA `702ce448ae1a63a6ab3e768a01104f14d16a183c`: 11/11 mỗi lượt (2 lượt), HTTP 404 cho path/method sai, **LOCAL_WORKERD PASS**. Final PR head gate xác minh riêng.
- **Giới hạn:** Không có Worker deployed, D1, Access, secret binding, MFA E2E hoặc production thay đổi. ADR-0002 PROPOSED, SRS FROZEN, hình QA NO_IMAGE_REQUIRED.


### CHG-IAM-ACCESS-20261102-05 — Chứng minh CAS chống dùng lại OTP trên D1 cô lập (chưa tích hợp MFA)
- **Ngày / trạng thái:** 02/11/2026, QA_ONLY / CHƯA_CHỐT; PR [#47](https://github.com/ntdung-tds/iaict-portal/pull/47); Issue #37; ADR-0002 PROPOSED.
- **Trước:** nguyên tắc D1 atomic `last_accepted_counter` chỉ nằm ở ADR, chưa có kết quả thực thi với D1 mô phỏng; MFA enrollment/session/replay thật NOT_RUN.
- **Sau:** thêm duy nhất bộ test `scripts/mfa-d1-cas/run-local.mjs`, chạy với Miniflare v5 `convertV4MiniflareOptions` và D1 SQLite **in-memory/ephemeral**. Tạo schema factor **chỉ trong test**; không thêm migration thật hoặc API. `IAM-FUT-010` và `RUN-IAM-20261102-05` ghi lại 15 nhóm kiểm tra, 16 yêu cầu đồng thời cùng counter chỉ 1 thành công trên D1 cục bộ.
- **Bằng chứng đúng SHA:** `2bee360c3552e9dcfe60c94e7719b9d8ae7d33a5`; [CI #41393225236](https://github.com/ntdung-tds/iaict-portal/actions/runs/41393225236), job `kdf-local-workerd` PASS. Các lần thử đầu thất bại do cấu hình Miniflare 5 được giữ trong lịch sử CI, không được gọi PASS.
- **Ảnh hưởng thực tế:** chỉ mã test/CI/QA/ADR/PCS. Không đổi UI/API, TOTP, session, D1 staging/production, Cloudflare Worker, Access, R2, khóa thật hay người dùng. D1 remote, mã OTP thật, recovery và E2E **NOT_RUN**.
- **SRS:** FROZEN / chưa có lệnh “chốt”. Không tự coi thiết kế D1 là yêu cầu hoặc schema được duyệt.


### CHG-IAM-ACCESS-20261102-06 — Thiết kế hợp đồng tích hợp MFA với phiên đăng nhập thực tế (CHƯA_CHỐT)

- **Nguồn quyết định:** yêu cầu tiếp tục CMS-08/S3; Issue [#37](https://github.com/ntdung-tds/iaict-portal/issues/37); [ADR-0002](../../adr/0002-iaict-native-mfa-totp-staged.md) PROPOSED; [PR #49](https://github.com/ntdung-tds/iaict-portal/pull/49) (đề xuất, không triển khai).
- **Trước (đọc trực tiếp mã):** `lib/native-auth.ts` cấp full `iaict_auth_sessions` sau mật khẩu; `app/api/auth/login/route.ts` trả cookie `__Host-iaict_session` khi thành công; `nativeActorEmail()`, `nativeSessionPrincipal()`, `app/api/auth/session/route.ts` không phân biệt MFA assurance. Không có MFA native tích hợp. **Đây là rủi ro bypass nếu chỉ thêm UI OTP**, không phải tuyên bố lỗi production hiện đang bật MFA.
- **Sau (CHỈ THIẾT KẾ):** hợp đồng first-factor → pre-MFA challenge giới hạn (TTL/one-time/bind credential) → xác minh OTP + D1 CAS + challenge consume + session/audit nguyên tử → full-session nhận diện `auth_level` tại tất cả middleware đọc phiên. Key binding riêng môi trường, recovery độc lập, revoke session trên reset, migration forward-only/rollback và pilot theo vai trò với Cloudflare Access giữ nguyên.
- **API/UI:** chỉ vẽ luồng dự kiến; **không thêm endpoint, cookie, header, frontend, công tắc enforce hoặc redirect** trong PR này.
- **D1/secret/security:** nêu logical schema `iam_mfa_factors`, `iam_mfa_challenges`, `iam_mfa_recovery_codes` và nâng assurance của session ở mức proposal; **không tạo migration, không provision key, không cập nhật binding/Access/Worker, không sửa D1 thật**.
- **QA:** cập nhật phạm vi dự kiến cho các case `IAM-FUT-001`, `IAM-FUT-002`, `IAM-FUT-004`; `IAM-FUT-010` local CAS PASS vẫn chỉ giới hạn test; **các luồng MFA đăng nhập/recovery/7-role hosted NOT_RUN**. Danh mục giữ **83 case**. Kết quả CI cho chính PR sẽ ghi sau khi chạy, tuyệt đối không coi CI tài liệu là E2E.
- **Trạng thái:** `T-IAM-MFA-F2` IN_PROGRESS / QA PARTIAL, Owner MFA security acceptance NOT GIVEN. **SRS FROZEN**; chủ dự án quyết định lúc hoàn tất có đồng bộ SRS hay không.


### CHG-IAM-ACCESS-20261102-07 — Isolated pre-MFA challenge and session assurance

- Date/status: 2026-11-02; ISOLATED FOUNDATION / NOT APPROVED. PR #50, Issue #37; ADR-0002 PROPOSED.
- Before: Native login grants a full D1 session immediately on successful password. The application has no native MFA assurance checks.
- After: Add standalone, unimported `lib/native-mfa-preauth.ts` and Vitest. The module generates a 256-bit random challenge token, returns a separate SHA-256 record digest, supplies a distinct Secure/HttpOnly five-minute pending cookie, checks challenge candidate eligibility against user, credential fingerprint, expiry, attempts and disabled state, and models a fail-closed server session assurance predicate.
- Boundaries: The eligibility function is READ ONLY, not challenge redemption. It neither matches an OTP nor issues or authorizes any session. Existing login/API/Worker/session readers are unchanged. No live D1 schema, migration, factor, key binding, user or Cloudflare setting modified. Real MFA E2E remains NOT_RUN.
- QA: New P0 security case IAM-FUT-011, synthetic local Vitest. Registry 84 cases. Record actual exact-SHA results separately, never claim hosted MFA.
- SRS remains FROZEN pending an explicit owner decision; implementation and Access cutover require separate security approval.


### CHG-IAM-ACCESS-20261102-08 — Double review of isolated MFA challenge guard

- Date/status: 2026-11-02, REVIEW_CORRECTION / LOCAL_ONLY; proposed PR #51. The original module was introduced by merged PR #50, `IAM-FUT-011`.
- Review pass 1 (static security/boundary): check source against D1 and native session semantics. Existing login and Worker do **not** import the isolated module. A future reader must not accept unvalidated account/role booleans; TypeScript does not validate D1/JSON runtime data.
- Review pass 2 (adversarial data): correct `pendingChallengeEligibleForCas` and `nativeSessionMeetsAssurance` to require `accountActive === true` and `hasActiveRole === true`; reject truthy `"false"`, numeric `1`, Boolean objects and malformed data. Require primitive strings before token/digest regexp and constant-time hash comparison, preventing implicit object coercion or exceptions.
- Compatibility requirement: D1 SQLite active/role numbers must be explicitly normalized to strict booleans by the **future trusted server-side caller**. Current module remains unimported by login/session/Worker; no migration, no live auth behavior change, no alternate authentication path or MFA activation.
- QA: Extend existing `IAM-FUT-011` by four negative test scenarios, no new test case, total registry **84**. The prior 16/16 PASS stays historical; new count and exact SHA require new CI evidence, and full hosted MFA remains NOT_RUN.
- SRS FROZEN, ADR-0002 PROPOSED, Owner MFA security approval NOT GIVEN. No remote D1, Access, production, or staging Worker updates.


### CHG-IAM-ACCESS-20261102-09 — Atomic first-factor challenge CAS, disposable local D1 only
- **Date/status:** 2026-11-02, QA_ONLY / CHƯA_CHỐT. [PR #53](https://github.com/ntdung-tds/iaict-portal/pull/53); Issue #37; ADR-0002 PROPOSED.
- **Before:** `IAM-FUT-011` tests a read-only pre-MFA candidate in Node; `IAM-FUT-010` tests local factor replay counter CAS. Neither proves that a first-factor challenge can be consumed once with account/credential changes checked in D1.
- **After:** add **test-only** `scripts/mfa-preauth-d1-cas/run-local.mjs` with two disposable synthetic tables and one conditional `UPDATE` of challenge's consumed timestamp/revision, requiring `success === true` and `meta.changes === 1`. SQL checks current server-owned user record: active account, current role, credential fingerprint **and monotonic revision**, plus challenge owner, purpose, expiry, TTL, failed attempts and lockout. New QA case `IAM-FUT-012` P0, increasing registry **84 → 85** cases.
- **Security boundary:** A successful challenge CAS is only a **storage primitive**; it does not validate a real OTP, update factor counter, issue session, write audit, implement transaction across all three, or protect an actual login route. Never claim that this is hosted D1 parity or MFA enrollment/acceptance.
- **API/UI/D1:** no changes to existing login/session/Worker/API/UI, no forward migration, no hosted D1 binding, no real credential/secret, no staging or production deployment, no Access/R2 change.
- **QA and trace:** append-only `RUN-IAM-20261102-10` after actual CI evidence; test historical failures and exact SHAs remain separate. SRS **FROZEN**, Owner/security approval **NOT GIVEN**, ADR-0002 **PROPOSED**.


### CHG-IAM-ACCESS-20261102-10 — Two-pass review: prevent pre-MFA challenge revival after access restoration
- **Date/scope:** 2026-11-02; QA_ONLY, synthetic Miniflare D1 only; Issue #37; PR #54 (proposed). ADR-0002 still PROPOSED and SRS FROZEN.
- **Pass 1 source finding:** PR #53's single-row CAS checked current `is_active` and `has_active_role` as binary state but the synthetic SQL did not bind a challenge to a monotonic **account/authorization security revision**. If a role was removed then restored, or the account disabled then reactivated within TTL, the old pending challenge could become redeemable again. It remains a **future implementation threat**, not evidence of a live MFA exploit (no login route imports these synthetic scripts).
- **Pass 2 correction:** add `security_revision` to **synthetic user and challenge test tables**; require equality inside the same conditional `UPDATE`. Revocation and disable update the synthetic security revision, so restoring the role/active bit does not revive old challenges. Credential fingerprint/revision checks stay in place. Only the new independently minted challenge at the current security revision can pass. Tighten primitive token/fingerprint exact length and retain per-user revision isolation.
- **QA:** extend existing `IAM-FUT-012`; do **not** create a duplicate case (85-case registry unchanged). Record exact CI after it runs; preserve any original initial failures. Test is storage-only, not real OTP verification, multi-table factor/session transaction, remote D1, or rollout.
- **Implementation dependency:** any future real backend MUST persist/increment a trusted monotonic security revision (or reliably revoke challenge rows atomically) on account disabling, role removal, privilege/policy changes and security resets. This test's synthetic revision does not create a production security control.
- **No runtime mutation:** no actual D1 migration, Worker, native-auth/session/API, Access, KMS, R2 or production changes. Owner security approval NOT GIVEN.
