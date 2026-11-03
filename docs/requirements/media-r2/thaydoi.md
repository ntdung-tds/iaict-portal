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
| CHG-MEDIA-R2-20261103-03 | 2026-11-03 | Rà soát lặp lớp preflight: lỗi TOCTOU đọc lại getter policy và ngoại lệ getter | REVIEW_LOOP / TEST_FIRST | Issue #39, PR review-loop | CMS-MEDIA-015, RUN-MEDIA-20261103-05..06 | CHƯA_CHỐT |
| CHG-MEDIA-R2-20261103-04 | 2026-11-03 | Gộp B3.3: phương án quyết định về định dạng/size/scan/ownership, hợp đồng state transition thuần và fixture negative tests; không kết nối upload | PROPOSED / LOCAL_CODE_ONLY / NO_DEPLOYMENT | Issue #39 · PR B3.3 batch | RUN-MEDIA-20261103-08 — CI PENDING | CHƯA_CHỐT |

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
- **Bằng chứng kiểm thử code:** exact source SHA `139ea0b1aee543fbe328dab7c4ebbded10ba905c`, [portal CI](https://github.com/ntdung-tds/iaict-portal/actions/runs/41629737599) 4/4 PASS và [public staging](https://github.com/ntdung-tds/iaict-portal/actions/runs/41629737613) PASS trên Worker cũ. `RUN-MEDIA-20261103-03` là PASS_LOCAL_CODE_CI, KHÔNG phải upload E2E; Master QA v2.14 127 case đã readback.
- QA: 3 case mới `CMS-MEDIA-013..015` AUTO/READY; 12 case `CMS-MEDIA-001..012` vẫn PLANNED/MANUAL/NOT_RUN. `RUN-MEDIA-20261103-02` chỉ được coi PASS khi CI trên exact SHA thực sự thành công.
- Drive QA: https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3 — NO_IMAGE_REQUIRED cho helper unit.


### CHG-MEDIA-R2-20261103-03 — Lặp rà soát policy snapshot
- **Phát hiện tái lập:** policy object có getter thay đổi `maxBytes` hoặc `allowedMimeTypes` theo lần đọc; helper ban đầu kiểm tra chính sách rồi truy xuất lại từng thuộc tính và có thể quyết định sai theo giá trị mới. Getter ném lỗi có thể làm helper thoát bằng exception thay vì trả mã từ chối. Phạm vi: preflight thuần, không phải API upload.
- **Test-first:** mở rộng `CMS-MEDIA-015` với ba regression case dùng getter thay đổi theo lần đọc và getter ném lỗi; ghi lần FAIL gốc ở `RUN-MEDIA-20261103-05` khi kiểm thử thực thi thực tế.
- **Hướng khắc phục:** chuẩn hóa `maxBytes` và `allowedMimeTypes` vào snapshot primitive/Set một lần; nếu đọc/duyệt chính sách thất bại, trả `POLICY_NOT_CONFIGURED`. Rà soát và chạy lại trên immutable SHA; ghi riêng `RUN-MEDIA-20261103-06`.
- **Ba vòng CI tái lập / retest:** 3 source-test Unit FAIL từ getter policy, getter input, override byteLength; lần lượt test-first SHAs `ed0afd11`, `7dc4bc5e`, `9838c230`. Bản sửa lần 3 `7b85189d`: [Portal CI #41635067760](https://github.com/ntdung-tds/iaict-portal/actions/runs/41635067760) 4/4 PASS và [public staging #41635067742](https://github.com/ntdung-tds/iaict-portal/actions/runs/41635067742) PASS trên Worker cũ; chi tiết [RUN-MEDIA-20261103-06](../../qa/IAICT_TEST_RUNS.md). Google Master QA **v2.15** đã đồng bộ, đọc lại **127 cases / 15 Media**; không bổ sung case ID mới.
- **Giới hạn:** không chốt định dạng MIME/dung lượng live; không nối API, IAM/Access, R2/D1, Worker, production; SRS CHƯA_CHỐT. 12 case live Media 001..012 vẫn NOT_RUN.


### CHG-MEDIA-R2-20261103-04 — B3.3 gated lifecycle, recovery design and source-only planner

- **Nguồn/đề cương:** Owner request 2026-11-03 gộp nhiều task phù hợp; [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39), §5.3, §8, §10, §13 của đề cương IAICT. **SRS chưa chốt**.
- **Trước → sau:** Trước chỉ có preflight MIME/filename thuần chưa nối runtime và threat-model B3.1. Sau có [bảng đề xuất quyết định B3.3](./MEDIA_R2_B3_3_DESIGN_DECISIONS_2026-11-03.md) và `lib/media-lifecycle-contract.ts`/unit tests cho các cạnh chuyển trạng thái có thể/không thể, snapshot accessor và cặp revision để dùng **khi có CAS thực**.
- **Thực thi:** Pure TypeScript module **không được import vào Worker/API/UI**, không thực hiện identity/role checks, scanner verification, database CAS, R2 reads/writes hoặc production changes. Việc có graph hợp lệ **không cho phép** tự động phục vụ file.
- **Chưa chốt:** MAX_FILE_SIZE / MIME policy, scanner/provider, quota, dimensions, ownership role matrix, status expiry, retention, CDN/public policy, budget và các quyết định Owner; mọi số trong tài liệu là **đề xuất**, không phải cấu hình đã duyệt.
- **Tác động:** API/UI/D1 migration/Cloudflare Access và IAM/production **NONE**; chỉ thêm thư viện/test thuần và tài liệu; không thay đổi file SRS.
- **Bằng chứng:** `RUN-MEDIA-20261103-08` phân biệt local source CI với public staging (old deployed Worker). Các case `CMS-MEDIA-001..012` vẫn `PLANNED/NOT_RUN`; QA CSV vẫn 127 case và Google Master v2.15 không cần sửa.
- **Rollback:** revert file/module/docs ở nhánh dev; không có hosted schema/runtime state để hoàn tác.
- **SRS:** CHƯA_CHỐT; không tự đồng bộ vào baseline.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-MEDIA-R2-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
