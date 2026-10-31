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
