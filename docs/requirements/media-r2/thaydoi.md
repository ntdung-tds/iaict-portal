# Media & tài liệu đính kèm — thaydoi.md

**Module:** `media-r2` | **Status:** OPEN_CHANGE_LOG | **SRS integration:** PENDING USER SIGN-OFF

**Nguồn tham chiếu:** Đề cương chi tiết IAICT 2026, §5.3, §8, §10, §13; ND02, ND07. Chỉ là tham chiếu về yêu cầu; chưa tự coi là SRS đã được duyệt.

**Đối chiếu code hiện có (cần kiểm tra theo commit, không mặc nhiên nghiệm thu):** `docs/IAICT_NATIVE_AUTH_R2_STAGING_2026-10-30.md`.

## Nhật ký thay đổi

| CHG ID | Ngày | Mô tả ngắn | Trạng thái | PR/Commit | Test/Run | Quyết định đưa vào SRS |
|---|---|---|---|---|---|---|
| CHG-MEDIA-R2-20261031-01 | 2026-10-31 | Khởi tạo nhật ký theo phân hệ để tập hợp thay đổi; cần đối chiếu lịch sử implementation trước khi nhập các thay đổi cũ | RECORDED — DOCUMENTATION ONLY | PR #36 | NOT_RUN — không có thay đổi runtime | CHƯA_CHỐT |

| CHG-MEDIA-R2-20261031-02 | 2026-10-31 | Hồi cứu bucket/binding R2 staging dành riêng; chưa có upload API | BACKFILLED / BINDING_ONLY / MEDIA_E2E_NOT_RUN | PR #36 · docs native-auth R2 | Test case media E2E: CHƯA_CÓ; kiểm tra binding trong release, chưa kiểm thử upload | CHƯA_CHỐT |
| CHG-MEDIA-R2-20261103-01 | 2026-11-03 | Model hóa rủi ro upload và bổ sung 12 case CMS-MEDIA-001..012 ở trạng thái PLANNED; chưa phát triển API | DESIGN_ONLY / NO_RUNTIME_CHANGE | Issue #39 · Media threat model PR | RUN-MEDIA-20261103-01 NOT_RUN | CHƯA_CHỐT |
| CHG-MEDIA-R2-20261103-02 | 2026-11-03 | Tạo lớp kiểm tra file thuần và test âm tính; không kết nối upload | LOCAL_HELPER_ONLY / NO_HOSTED_CHANGE | Issue #39, PR B3.2 | CMS-MEDIA-013..015, RUN-MEDIA-20261103-02 | CHƯA_CHỐT |

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

### CHG-MEDIA-R2-20261103-01 — Threat model và QA contract đầu vào
- **Nguồn:** [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) và kiểm tra thực tế `cloudflare.config.ts`, danh sách routes ở SHA `844f7ddf37d2314eed55f1fe3f766e6610684226`.
- **Trước:** binding R2 staging-only; chưa có upload API/scan/quarantine và chưa có `CMS-MEDIA` case trong CSV 112 cases.
- **Sau (chỉ tài liệu):** [Threat model](./MEDIA_R2_THREAT_MODEL_2026-11-03.md) đề xuất kiểm soát auth, Origin/CSRF, MIME+bytes+extension, giới hạn stream, key, quarantine/scan, D1/R2 recovery, idempotency, IDOR, retention, quotas, browser staging. 12 test cases `CMS-MEDIA-001..012` là `PLANNED/NOT_RUN`.
- **Chưa có quyết định:** kiểu media, size/quota, scanner, role matrix, metadata/retention, public delivery. Không sửa SRS hoặc tự coi các đề xuất đã được duyệt.
- **R2 thực tế (chỉ đọc 03/11/2026):** Cloudflare API xác nhận bucket APAC có thật, `r2.dev` disabled, 0 custom domain; 1 rule `Default Multipart Abort Rule` (không phải retention dữ liệu). CORS chưa xác minh. **PASS_READ_ONLY_BUCKET_METADATA**, không có upload/đọc/xóa object, không làm thay đổi Cloudflare.
- **Phạm vi:** không Worker route, schema, Access, hosted R2/D1, IAM, production hay ảnh QA. `RUN-MEDIA-20261103-01` chỉ là checkpoint không thực thi chức năng.
- **Drive QA:** [evidence root](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3), NO_IMAGE_REQUIRED.


### CHG-MEDIA-R2-20261103-02 — Preflight contract độc lập, chưa kết nối runtime
- Trước: chưa có bộ kiểm tra file upload R2; CMS hiện hỗ trợ media từ URL HTTPS bên ngoài.
- Sau: `lib/media-upload-contract.ts` kiểm tra chính sách đầu vào bắt buộc, MIME/extension/chữ ký JPEG/PNG/WebP, kích cỡ mảng byte, tên file và khóa riêng `quarantine/v1/UUID4`. Thêm test âm tính `lib/media-upload-contract.test.ts`.
- **Chưa chốt:** định dạng, dung lượng, loại file thật, quét virus, EXIF, quota, vai trò, retention, D1/R2 consistency. Kích cỡ và format trong test chỉ là **fixture**, không phải chính sách live.
- **Không thực hiện:** không nối API, CMS media cũ, R2/Worker, D1, Access, IAM, production hay SRS. Kiểm thử stream upload và E2E vẫn NOT_RUN.
- QA: 3 case mới `CMS-MEDIA-013..015` AUTO/READY; 12 case `CMS-MEDIA-001..012` vẫn PLANNED/MANUAL/NOT_RUN. `RUN-MEDIA-20261103-02` chỉ được coi PASS khi CI trên exact SHA thực sự thành công.
- Drive QA: https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3 — NO_IMAGE_REQUIRED cho helper unit.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-MEDIA-R2-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
