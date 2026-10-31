# CMS, xuất bản, quản lý nội dung — thaydoi.md

**Module:** `cms-workflow` | **Status:** OPEN_CHANGE_LOG | **SRS integration:** PENDING USER SIGN-OFF

**Nguồn tham chiếu:** Đề cương chi tiết IAICT 2026, §10, §14; ND06, ND09. Chỉ là tham chiếu về yêu cầu; chưa tự coi là SRS đã được duyệt.

**Đối chiếu code hiện có (cần kiểm tra theo commit, không mặc nhiên nghiệm thu):** `app/admin/page.tsx`, `app/admin/content/[module]/page.tsx`, `docs/CMS_V17_D1_ATOMIC_USERS_2026-10-30.md`.

## Nhật ký thay đổi

| CHG ID | Ngày | Mô tả ngắn | Trạng thái | PR/Commit | Test/Run | Quyết định đưa vào SRS |
|---|---|---|---|---|---|---|
| CHG-CMS-WORKFLOW-20261031-01 | 2026-10-31 | Khởi tạo nhật ký theo phân hệ để tập hợp thay đổi; cần đối chiếu lịch sử implementation trước khi nhập các thay đổi cũ | RECORDED — DOCUMENTATION ONLY | PR #36 | NOT_RUN — không có thay đổi runtime | CHƯA_CHỐT |

| CHG-CMS-WORKFLOW-20261031-02 | 2026-10-31 | Ghi user/role/revision/audit nguyên tử | IMPLEMENTED/TESTED (đúng phạm vi) | PR #36 / docs gốc | Chi tiết bên dưới | CHƯA_CHỐT |

## Thay đổi chi tiết

### CHG-CMS-WORKFLOW-20261031-01 — Khởi tạo sổ theo dõi phân hệ
- **Trạng thái:** RECORDED — DOCUMENTATION ONLY, không phải bằng chứng feature đã được triển khai hay chủ dự án đã phê duyệt.
- **Trước:** chưa có sổ `thaydoi.md` riêng trong repository cho phân hệ này.
- **Sau:** sử dụng file này làm bản ghi thay đổi liên tục, tách khỏi `docs/requirements/SRS.md`.
- **Phạm vi:** quản trị tài liệu, không thay đổi API, D1, UI, quyền, bảo mật hay production.
- **Nguồn:** yêu cầu trực tiếp của chủ dự án ngày 31/10/2026; đề cương (§10, §14; ND06, ND09).
- **Quyết định/SRS:** CHƯA_CHỐT; không cập nhật SRS cho tới khi có yêu cầu chốt.
- **Test:** NOT_RUN/NO_RUNTIME_CHANGE; chỉ xác minh cấu trúc file, link và CI tài liệu ở PR.

### CHG-CMS-WORKFLOW-20261031-02 — Ghi user/role/revision/audit nguyên tử
- **Status:** IMPLEMENTED + TESTED trong mã / SQLite mô phỏng theo báo cáo v17; live role-based staging chưa nghiệm thu; **SRS:** CHƯA_CHỐT.
- **Trước → Sau:** thay vì cập nhật từng phần gây sai lệch khi D1 gặp lỗi, tài liệu `docs/CMS_V17_D1_ATOMIC_USERS_2026-10-30.md` mô tả gom write vào `db.batch`; kiểm soát last-admin và rollback khi insert role/audit thất bại.
- **Bằng chứng lịch sử:** [CI 316/316](https://github.com/ntdung-tds/iaict-portal/actions/runs/40920542386), browser Chromium thời điểm đó dùng mock API. Mã hiện hành và D1 remote cần xác minh trong run khác trước khi tuyên bố nghiệm thu đầy đủ.
- **Test:** IAM-USER-005/011/012 (integration); IAM-USER-017/018 vẫn NOT_RUN cho live-role scenarios.
- **Tác động:** người dùng CMS, phân quyền, audit, D1 transaction; SRS impact PENDING.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-CMS-WORKFLOW-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
