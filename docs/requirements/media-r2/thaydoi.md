# Media & tài liệu đính kèm — thaydoi.md

**Module:** `media-r2` | **Status:** OPEN_CHANGE_LOG | **SRS integration:** PENDING USER SIGN-OFF

**Nguồn tham chiếu:** Đề cương chi tiết IAICT 2026, §5.3, §8, §10, §13; ND02, ND07. Chỉ là tham chiếu về yêu cầu; chưa tự coi là SRS đã được duyệt.

**Đối chiếu code hiện có (cần kiểm tra theo commit, không mặc nhiên nghiệm thu):** `docs/IAICT_NATIVE_AUTH_R2_STAGING_2026-10-30.md`.

## Nhật ký thay đổi

| CHG ID | Ngày | Mô tả ngắn | Trạng thái | PR/Commit | Test/Run | Quyết định đưa vào SRS |
|---|---|---|---|---|---|---|
| CHG-MEDIA-R2-20261031-01 | 2026-10-31 | Khởi tạo nhật ký theo phân hệ để tập hợp thay đổi; cần đối chiếu lịch sử implementation trước khi nhập các thay đổi cũ | RECORDED — DOCUMENTATION ONLY | PR #36 | NOT_RUN — không có thay đổi runtime | CHƯA_CHỐT |

| CHG-MEDIA-R2-20261031-02 | 2026-10-31 | Hồi cứu bucket/binding R2 staging dành riêng; chưa có upload API | BACKFILLED / BINDING_ONLY / MEDIA_E2E_NOT_RUN | PR #36 · docs native-auth R2 | Test case media E2E: CHƯA_CÓ; kiểm tra binding trong release, chưa kiểm thử upload | CHƯA_CHỐT |

## Thay đổi chi tiết

### CHG-MEDIA-R2-20261031-01 — Khởi tạo sổ theo dõi phân hệ
- **Trạng thái:** RECORDED — DOCUMENTATION ONLY, không phải bằng chứng feature đã được triển khai hay chủ dự án đã phê duyệt.
- **Trước:** chưa có sổ `thaydoi.md` riêng trong repository cho phân hệ này.
- **Sau:** sử dụng file này làm bản ghi thay đổi liên tục, tách khỏi `docs/requirements/SRS.md`.
- **Phạm vi:** quản trị tài liệu, không thay đổi API, D1, UI, quyền, bảo mật hay production.
- **Nguồn:** yêu cầu trực tiếp của chủ dự án ngày 31/10/2026; đề cương (§5.3, §8, §10, §13; ND02, ND07).
- **Quyết định/SRS:** CHƯA_CHỐT; không cập nhật SRS cho tới khi có yêu cầu chốt.
- **Test:** NOT_RUN/NO_RUNTIME_CHANGE; chỉ xác minh cấu trúc file, link và CI tài liệu ở PR.

### CHG-MEDIA-R2-20261031-02 — Ghi nhận R2 staging và ranh giới nghiệm thu media
- **Nguồn:** [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36), [tài liệu Native Auth + R2](../../IAICT_NATIVE_AUTH_R2_STAGING_2026-10-30.md), đề cương §5.3, §8, §10, §13.
- **Trước → Sau:** nhánh staging có bucket độc lập `iaict-portal-staging-media` với binding `MEDIA_BUCKET`, không tái sử dụng bucket khác và **không có hostname public**. R2 chỉ chứa media, không lưu password/cookie/session/PII nhạy cảm.
- **Phạm vi thực tế:** Đây là **foundation/binding**, không phải hệ thống upload hoàn chỉnh. Kiểm tra MIME, malware scanning, quota, quyền đọc/ghi, lifecycle/retention và upload API vẫn là công việc riêng; **không tuyên bố E2E PASS**.
- **Bằng chứng:** tài liệu trên cùng [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36); staging Worker deployment `754b0509-e754-410c-8dff-46015d162a89` trong [RUN-IAM-20261031-01](../../qa/IAICT_TEST_RUNS.md) ghi binding không đổi. Chưa có test case media E2E chuyên biệt trong 78-case IAM registry; **TEST_GAP / NOT_RUN**.
- **Ảnh/media QA:** [Drive QA root](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3), chưa có ảnh kiểm thử upload cho entry này (**NOT_CAPTURED**).
- **Tác động:** Cloudflare R2 binding chỉ trên staging; không thay đổi production, Access, D1 hay phát sinh bucket public. Khi phát triển API upload cần bổ sung test case/runs, rollback và entry CHG mới. **SRS:** CHƯA_CHỐT.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-MEDIA-R2-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
