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

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-IAM-ACCESS-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
