# Hạ tầng, D1, vận hành, release — thaydoi.md

**Module:** `platform-release` | **Status:** OPEN_CHANGE_LOG | **SRS integration:** PENDING USER SIGN-OFF

**Nguồn tham chiếu:** Đề cương chi tiết IAICT 2026, §13, §15, §17; ND07, ND10. Chỉ là tham chiếu về yêu cầu; chưa tự coi là SRS đã được duyệt.

**Đối chiếu code hiện có (cần kiểm tra theo commit, không mặc nhiên nghiệm thu):** `worker.ts`, `cloudflare.config.ts`, `docs/STAGING_CMS_V17_RELEASE_GATE_2026-10-30.md`.

## Nhật ký thay đổi

| CHG ID | Ngày | Mô tả ngắn | Trạng thái | PR/Commit | Test/Run | Quyết định đưa vào SRS |
|---|---|---|---|---|---|---|
| CHG-PLATFORM-RELEASE-20261031-01 | 2026-10-31 | Khởi tạo nhật ký theo phân hệ để tập hợp thay đổi; cần đối chiếu lịch sử implementation trước khi nhập các thay đổi cũ | RECORDED — DOCUMENTATION ONLY | PR #36 | NOT_RUN — không có thay đổi runtime | CHƯA_CHỐT |

| CHG-PLATFORM-RELEASE-20261031-02 | 2026-10-31 | Hồi cứu staging deployment pin SHA, rollback/HOLD, đối chiếu production | BACKFILLED / STAGING_DEPLOY_VERIFIED / AUTH_E2E_PENDING | PR #36 · `2a76deb5` | IAM-REL-004/005/006/007; RUN-IAM-20261031-01 | CHƯA_CHỐT |

## Thay đổi chi tiết

### CHG-PLATFORM-RELEASE-20261031-01 — Khởi tạo sổ theo dõi phân hệ
- **Trạng thái:** RECORDED — DOCUMENTATION ONLY, không phải bằng chứng feature đã được triển khai hay chủ dự án đã phê duyệt.
- **Trước:** chưa có sổ `thaydoi.md` riêng trong repository cho phân hệ này.
- **Sau:** sử dụng file này làm bản ghi thay đổi liên tục, tách khỏi `docs/requirements/SRS.md`.
- **Phạm vi:** quản trị tài liệu, không thay đổi API, D1, UI, quyền, bảo mật hay production.
- **Nguồn:** yêu cầu trực tiếp của chủ dự án ngày 31/10/2026; đề cương (§13, §15, §17; ND07, ND10).
- **Quyết định/SRS:** CHƯA_CHỐT; không cập nhật SRS cho tới khi có yêu cầu chốt.
- **Test:** NOT_RUN/NO_RUNTIME_CHANGE; chỉ xác minh cấu trúc file, link và CI tài liệu ở PR.

### CHG-PLATFORM-RELEASE-20261031-02 — Hồi cứu staging release gate và trạng thái triển khai
- **Nguồn:** [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36), [RUN-IAM-20261031-01](../../qa/IAICT_TEST_RUNS.md), tài liệu release v17 đã lập. Đây là bản ghi hồi cứu, **không cấp quyền tự deploy**.
- **Trước → Sau:** staging deployment theo SHA `2a76deb5642d6f60a89c894fa91c7c30a42953c8` với Cloudflare Build one-shot, Worker deployment `754b0509-e754-410c-8dff-46015d162a89` / version `1b8cfe71-88ef-4e21-8937-4f8590daaba4` ở 100%. Đường rollback `bf2a0bfd-0e08-492c-9853-de6b35498b1b` đã ghi; Cloudflare Builds được trả về **HOLD**.
- **Kết quả theo từng lớp:** [portal-ci #41186058883](https://github.com/ntdung-tds/iaict-portal/actions/runs/41186058883) PASS unit/build/browser mock; [staging acceptance #41186058888](https://github.com/ntdung-tds/iaict-portal/actions/runs/41186058888) PASS **trước** lần deploy này; hậu deploy Browser Rendering HTTP 429 là **BLOCKED**; real-role authenticated QA **NOT_RUN**. Test case liên quan `IAM-REL-004/005/006/007` cần run record riêng cho kết luận từng case.
- **Đối chiếu trạng thái ngày 2026-10-31:** Cloudflare API đọc lại deployment staging `754b0509-e754-410c-8dff-46015d162a89`, production `a01a3743-ac78-4a19-a990-581fe9235751` / Worker `e7c703f7-fc4c-4313-b14c-0a2c94e0613d`. Không có hành động write production.
- **D1/Access/R2:** theo [RUN-IAM-20261031-01](../../qa/IAICT_TEST_RUNS.md), 24 migrations, `quick_check=ok`, bốn đường Access staging được giữ; không đồng nghĩa đã hoàn tất E2E API quản trị với tài khoản thật.
- **Ảnh:** [Drive QA evidence](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp) — **NOT_CAPTURED** đối với real-browser hậu deploy. **SRS:** CHƯA_CHỐT.
- **Tiếp theo:** trước khi phát hành staging mới phải khóa immutable source SHA, kiểm tra CI/rollback/Build HOLD; không đưa lên production khi thiếu nghiệm thu thực tế và phê duyệt riêng.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-PLATFORM-RELEASE-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
