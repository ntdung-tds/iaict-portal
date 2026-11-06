# Sản phẩm & Nền tảng — thaydoi.md

**Module:** `san-pham` | **Status:** OPEN_CHANGE_LOG | **SRS integration:** PENDING USER SIGN-OFF

**Nguồn tham chiếu:** Đề cương chi tiết IAICT 2026, §5.3, §14; ND02, ND09. Chỉ là tham chiếu về yêu cầu; chưa tự coi là SRS đã được duyệt.

**Đối chiếu code hiện có (cần kiểm tra theo commit, không mặc nhiên nghiệm thu):** `app/(public)/san-pham-nen-tang/page.tsx`.

## Nhật ký thay đổi

| CHG ID | Ngày | Mô tả ngắn | Trạng thái | PR/Commit | Test/Run | Quyết định đưa vào SRS |
|---|---|---|---|---|---|---|
| CHG-SAN-PHAM-20261031-01 | 2026-10-31 | Khởi tạo nhật ký theo phân hệ để tập hợp thay đổi; cần đối chiếu lịch sử implementation trước khi nhập các thay đổi cũ | RECORDED — DOCUMENTATION ONLY | PR #36 | NOT_RUN — không có thay đổi runtime | CHƯA_CHỐT |

## Thay đổi chi tiết

### CHG-SAN-PHAM-20261031-01 — Khởi tạo sổ theo dõi phân hệ
- **Trạng thái:** RECORDED — DOCUMENTATION ONLY, không phải bằng chứng feature đã được triển khai hay chủ dự án đã phê duyệt.
- **Trước:** chưa có sổ `thaydoi.md` riêng trong repository cho phân hệ này.
- **Sau:** sử dụng file này làm bản ghi thay đổi liên tục, tách khỏi `docs/requirements/SRS.md`.
- **Phạm vi:** quản trị tài liệu, không thay đổi API, D1, UI, quyền, bảo mật hay production.
- **Nguồn:** yêu cầu trực tiếp của chủ dự án ngày 31/10/2026; đề cương (§5.3, §14; ND02, ND09).
- **Quyết định/SRS:** CHƯA_CHỐT; không cập nhật SRS cho tới khi có yêu cầu chốt.
- **Test:** NOT_RUN/NO_RUNTIME_CHANGE; chỉ xác minh cấu trúc file, link và CI tài liệu ở PR.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-SAN-PHAM-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
