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

| CHG-MEDIA-R2-20261104-01 | 2026-11-04 | B3.4 gộp hợp đồng kiểm tra stream có giới hạn byte/chunk, fixture test âm tính và tài liệu release gate (không nối runtime) | IN_PROGRESS / PURE_UNWIRED / NO_DEPLOY | Issue #39 · PR B3.4 | RUN-MEDIA-20261104-01 — PENDING_CI | CHƯA_CHỐT |

| CHG-MEDIA-R2-20261104-02 | 2026-11-04 | Owner ủy quyền AI Technical Lead tự chốt chính sách Media R2 v1; mã hóa hằng số, ma trận RBAC/scope và phủ kiểm thử âm tính, không tự mở upload runtime | ACCEPTED_POLICY_FOR_STAGING / SOURCE_ONLY / NO_DEPLOY | ADR-MEDIA-20261104-01 · Issue #39 · PR B3.5 | RUN-MEDIA-20261104-03 — PENDING_CI | CHƯA_CHỐT_SRS |

| CHG-MEDIA-R2-20261104-03 | 2026-11-04 | Chủ dự án yêu cầu nén ảnh và nén tệp: bổ sung kế hoạch image derivatives, gzip text có giới hạn/kiểm chứng roundtrip, ZIP nhiều tệp tương lai | ACCEPTED_FEATURE_REQUEST / SOURCE_PARTIAL / HOSTED_NOT_RUN | ADR-MEDIA-20261104-02-COMPRESSION · Issue #39 · PR B3.6 | RUN-MEDIA-20261104-05 — CI PENDING | CHƯA_CHỐT_SRS |

| CHG-MEDIA-R2-20261104-04 | 2026-11-04 | Gộp việc để hoàn tất bộ công cụ nén cục bộ: ảnh JPEG/PNG/WebP thực; ZIP đa tệp DEFLATE/STORE; gzip; UI CMS mobile; browser/negative tests | IN_PROGRESS / SOURCE_LOCAL_ONLY / NOT_HOSTED | ADR-MEDIA-20261104-02-COMPRESSION · Issue #39 · PR #98 | RUN-MEDIA-20261104-06 — PENDING | CHƯA_CHỐT_SRS |

| CHG-MEDIA-R2-20261104-05 | 2026-11-04 | B3.8: tích hợp backend upload private quarantine D1/R2 có gate staging tắt mặc định, quota CAS, idempotency, retention và unit/Miniflare D1; scanner/hosted chưa sẵn | SOURCE_IMPLEMENTATION / HOSTED_BLOCKED | MEDIA_R2_B3_8_QUARANTINE_PIPELINE_2026-11-04.md · Issue #39 · PR #100 | RUN-MEDIA-20261104-08 — PENDING | CHƯA_CHỐT_SRS |

| CHG-MEDIA-R2-20261104-06 | 2026-11-04 | B3.9: D1/R2 request-scoped isolation; quota tính cả FAILED và PURGE_PENDING; giữ scanner/upload production fail-closed | SOURCE_IN_REVIEW / NO_DEPLOY | Issue #39 · PR B3.9 | RUN-MEDIA-20261104-10 — CI PENDING | CHƯA_CHỐT_SRS |

| CHG-MEDIA-R2-20261104-07 | 2026-11-04 | B3.10 gộp isolated ClamAV/Pillow scan worker, HMAC receipt, migration 0026 evidence private, D1 CAS+R2 hash readback và dọn derivative | IN_REVIEW / SOURCE_ONLY / UNDEPLOYED | PR B3.10 · Issue #39 | RUN-MEDIA-20261104-13 PENDING CI | CHƯA_CHỐT_SRS |

| CHG-MEDIA-R2-20261104-08 | 2026-11-04 | B3.11 applied staging-only D1 migrations 0025–0026 with recovery bookmark; added real ClamAV EICAR CI; Containers API 401 blocks hosted scanner | STAGING_D1_APPLIED / AV_CI_PENDING / HOSTED_BLOCKED | Issue #39 · PR B3.11 | RUN-MEDIA-20261104-16..17 | CHƯA_CHỐT_SRS |

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


### CHG-MEDIA-R2-20261104-01 — B3.4 bounded async stream inspection (preparatory, not upload)

- **Nguồn:** yêu cầu chủ dự án gộp nhiều task trong 1 đợt; [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39), bảng quyết định B3.3; đề cương tham chiếu §5.3, §8, §10, §13. **SRS chưa chốt.**
- **Trước → sau:** trước có preflight byte-array MIME/extension và graph vòng đời thuần, chưa có fixture stream chunk. Sau bổ sung `lib/media-stream-contract.ts` kiểm tra một stream bất đồng bộ với `maxBytes` và `maxChunks` do caller cấp, giữ tối đa 12 byte đầu và từ chối input lỗi/overflow; `lib/media-stream-contract.test.ts` kiểm tra các tình huống âm tính.
- **Đảm bảo hữu hạn:** giới hạn tổng byte và số chunk, kể cả chunk rỗng; đọc intrinsic byte length; snapshot policy một lần; cố gắng đóng iterator khi từ chối. Chưa bảo đảm deadline network/backpressure hay dừng stream đang treo, không xác minh ảnh đã decode, không scan malware.
- **Tác động:** API/Worker/R2/D1/IAM/Access/production **NONE**. Code **không được import vào route**; stream bị tiêu thụ và bỏ, không thể sử dụng như một uploader. Tài liệu [B3.4](./MEDIA_R2_B3_4_STREAM_CONTRACT_2026-11-04.md) mô tả các điều kiện tích hợp trong tương lai.
- **Chưa quyết định:** chính sách live về định dạng/dung lượng/chunk, scanner, phân quyền/ownership, quota và retention; MED-DEC-01..07 vẫn **PROPOSED**.
- **Kiểm thử:** `RUN-MEDIA-20261104-01` chỉ source/unit và public Chromium trên Worker cũ nếu CI chạy. 127 case canonical (15 Media) không đổi; `CMS-MEDIA-004` hosted stream và `CMS-MEDIA-001..012` vẫn **PLANNED/NOT_RUN**. Bằng chứng ảnh: NO_IMAGE_REQUIRED; khi cần ảnh thực tế chỉ lưu tại Drive QA riêng.
- **Rollback:** revert 2 tệp lib/test và tài liệu liên quan trên nhánh phát triển; không có D1/R2 hoặc deploy nào để rollback.
- **SRS:** CHƯA_CHỐT, không tự sửa baseline.


### CHG-MEDIA-R2-20261104-02 — Owner-delegated, approved staging-only media security policy

- **Nguồn phê duyệt:** chủ dự án nêu trực tiếp ngày 2026-11-04: “Bạn tự đề xuất chính sách và hoàn thiện nhé, hợp lý là ok”. AI Technical Lead chọn phương án bảo mật hợp lý và chốt chính sách kỹ thuật **chỉ cho triển khai staging** trong [ADR-MEDIA-20261104-01](../../adr/ADR-MEDIA-20261104-01.md). Không phải lệnh “chốt SRS” hay cho phép deploy production.
- **Trước → sau:** MED-DEC-01..07 trước đó PROPOSED, chưa có giá trị cố định; sau cập nhật tình trạng **ACCEPTED_FOR_STAGING_IMPLEMENTATION** theo ADR có phiên bản, các giá trị được mã hóa `MEDIA_POLICY` (10 MiB, 25MP, 8192 px, 4096 chunks, 30s; JPEG/PNG/WebP tĩnh; quyền/quota/retention; R2 private; bắt buộc quét sạch + decode/re-encode).
- **Lựa chọn scanner:** hợp đồng ClamAV-compatible trong môi trường cô lập, chưa có service/key; policy `serviceConfigured=false`, kết quả không được tự giả lập. Chưa có scanner, bộ ảnh đã decode hoặc scan attestation: **không publish/serve**, dù mã policy unit PASS.
- **Quyền:** admin/editor upload, reviewer/admin review, admin publish/revoke/delete; viewer read approved derivative only; newsroom-only role không cấp quyền CMS Media. Đọc danh tính và scope từ backend/D1 sau xác thực; không lấy từ form/request body.
- **Nội dung tác động:** thêm `lib/media-policy.ts` và `lib/media-policy.test.ts` (hợp đồng source + test). Chưa sửa `worker.ts`, API, IAM, production, Cloudflare Access, D1 schema/row, R2 object, public serving hoặc scanner cấu hình.
- **Kiểm thử:** `RUN-MEDIA-20261104-03` theo exact SHA CI; các test áp dụng policy source-only, không thay đổi 127 case catalog/15 Media, `CMS-MEDIA-001..012` hosted real upload/role/security E2E vẫn **NOT_RUN**; Google Master giữ nguyên.
- **Rollback:** revert file policy/test/ADR/CHG qua PR; không có dữ liệu Cloudflare hay schema để khôi phục. Cần PR độc lập để kích hoạt khi scanner, quyền, quotas và D1/R2 được test đầy đủ.
- **SRS:** CHƯA_CHỐT_SRS. Chỉ được hợp nhất vào baseline sau lệnh “chốt” riêng của chủ dự án; cập nhật mọi bổ sung trong nhật ký sống.


### CHG-MEDIA-R2-20261104-03 — Nén ảnh và nén tệp (yêu cầu trực tiếp Owner)

- **Nguồn ngày 2026-11-04:** Owner: “Nhớ thêm nén ảnh, nén tệp nhé”. Yêu cầu **được tiếp nhận** và thiết kế trong [ADR-MEDIA-20261104-02-COMPRESSION](../../adr/ADR-MEDIA-20261104-02-COMPRESSION.md); không tự hiểu là “chốt SRS”.
- **Trước → sau:** trước chỉ có hạn mức upload, scan/quarantine và kế hoạch tạo derivative chưa xác định chất lượng/size. Sau có profile source-only `IAICT-IMAGE-OPT-V1`: display cạnh dài ≤1920, thumbnail ≤480, không upscale, JPEG quality 82%, WebP 80%, PNG lossless và phải xóa metadata/chuẩn orientation sau decode tin cậy. **Chưa tạo byte ảnh nén thực tế**.
- **Tệp nén:** bổ sung helper nguồn `IAICT-TEXT-GZIP-V1` nén gzip thực cho fixture UTF-8 `text/plain`, `text/csv`, `application/json` đầu vào ≤5 MiB; yêu cầu tiết kiệm ≥5% hoặc trả nguyên bản, giới hạn output. Chỉ source-local; các loại tệp này **chưa được phép upload vào CMS Media** và helper không có route/DB/R2.
- **ZIP nhiều tệp:** ghi nhận nhu cầu tải xuống dạng ZIP theo lựa chọn sau này, kiểm tra quyền từng tệp, hạn mức, tên an toàn; chưa có ZIP encoder hoặc archive upload. PDF/Office/ZIP/media nén sẵn sẽ không bị gzip tự động.
- **Tác động:** thêm hai source helpers + hai test suites + ADR + QA/PCS. Không mở rộng allowlist `MEDIA_POLICY.file.mimeTypes`, không sửa Worker, IAM, API, Cloudflare D1/R2, Access, production hoặc SRS.
- **Bảo mật:** scanner hiện `serviceConfigured=false`; không được publish/serve ảnh hoặc file do chỉ tính toán profile/nén gzip trong unit test. Không dùng mime/user-supplied decoded dims làm bằng chứng an toàn; kiểm thử tích hợp sẽ cần full decode, scan và private R2.
- **Kiểm thử:** `RUN-MEDIA-20261104-05` tại SHA/CI thực tế; kiểm thử gzip roundtrip, payload sai format, proxy, kích thước, ảnh động, kích thước; không đổi 127 canonical QA case IDs/15 Media, Master Google Doc v2.15 không đổi, `CMS-MEDIA-001..012` hosted NOT_RUN.
- **Rollback:** revert PR nguồn/ADR, không có dữ liệu thật/Worker cần rollback. Quyết định tích hợp non-image uploads và ZIP phải có CHG/ADR+negative QA riêng.
- **Trạng thái:** Feature request ACCEPTED, source helper triển khai từng phần; live feature và SRS **CHƯA_CHỐT**.


### CHG-MEDIA-R2-20261104-04 — Hoàn thiện bộ nén cục bộ (gộp 4 nhóm chức năng)

- **Yêu cầu người dùng:** 2026-11-04 “Hãy gộp các task trong phần này lại và hoàn thành nó”, tiếp nối “Nhớ thêm nén ảnh, nén tệp nhé”. Không tự xem đây là lệnh “chốt SRS” hay cho phép deploy production.
- **Trước → sau:** trước `lib/media-image-optimization.ts` chỉ trả về kế hoạch hình học, ZIP chưa có mã, gzip đã có nhưng không có UI. Sau có **bộ mã hóa ảnh thực trong trình duyệt** `lib/media-local-image.ts`, **ZIP32 DEFLATE/STORE thực** `lib/media-local-zip.ts`, giao diện **`/admin/tools/compression`** (3 thẻ ảnh / ZIP / gzip), điều hướng CMS responsive, các test nguồn và trình duyệt cục bộ.
- **Giới hạn nén ảnh:** JPEG/PNG/WebP tĩnh trong trình duyệt, byte gốc ≤10MiB, pixel ≤25M và cạnh ≤8192 được kiểm tra sau browser decode; display cạnh dài ≤1920px, thumbnail ≤480px, JPEG82%, WebP80%, PNG lossless, không upscale. Ảnh mới có byte thật; tuyệt đối KHÔNG phải backend decoder/scanner đạt chuẩn an toàn.
- **Giới hạn ZIP:** tối đa 20 file, 10MiB/file, 30MiB tổng, 40MiB archive; tên UTF-8 không chứa đường dẫn, chữ điều khiển, tên trùng hoặc traversal. Văn bản nén DEFLATE nếu tiết kiệm ≥5%; các loại khác STORE, **không giải nén** tệp ZIP tải vào. Đọc file từ input người dùng, không lấy tệp CMS/R2, không tạo công khai.
- **Gzip:** giữ helper trước đó (`lib/media-text-compression.ts`); UI tải .gz thực từ tệp text/csv/json UTF-8 cục bộ, quay về identity nếu nén không lợi.
- **Tác động:** bổ sung CMS route/UI (dưới Cloudflare Access cũ), không xây dựng API upload mới, không cấp quyền non-image Media upload, không thêm binding Worker/D1/R2, không thay IAM/production. Các thao tác nén hoàn toàn trên trình duyệt và chỉ xuất file bằng link download tạm; không tự đẩy lên R2. **D1/R2/quarantine/scanner/back-end image E2E vẫn chờ B3.6 tích hợp sau**.
- **Kiểm thử:** `RUN-MEDIA-20261104-06` ghi CI và Playwright cục bộ trình duyệt: hình ảnh định dạng đúng, ZIP chính xác/giải nén bằng fixture, gzip nội dung bảo toàn, 320px responsive, byte/MIME/animation/ZIP traversal/proxy từ chối. Lượt public staging workflow chỉ đo Worker cũ; chưa thể coi là hosted local tool QA. Số lượng canonical test case 127 không tự cập nhật nếu không bổ sung case định danh.
- **Rollback:** revert PR + route/sidebar; không có biến đổi dữ liệu Cloudflare. Điều kiện dùng trực tiếp trên staging: release/chấp thuận deployment riêng, sau đó browser kiểm thử thật trên SHA Worker mới.
- **Quyết định:** nội dung yêu cầu Owner **ACCEPTED**, code/test vẫn phải qua CI rồi mới đánh dấu source DONE; SRS `CHƯA_CHỐT`.


### CHG-MEDIA-R2-20261104-05 — B3.8 private quarantine D1/R2 source integration

- **Nguồn:** Owner “Hoàn thành phần này” ngày 2026-11-04 sau PR #98/#99. Yêu cầu triển khai phần Media R2 hosted còn thiếu, giữ policy MED-DEC-01..07 và giới hạn staging/production trước đó.
- **Trước/sau:** Trước chỉ có upload preflight, stream guard và kế hoạch admission riêng biệt, không được gọi bởi API. Sau có migration `0025_media_r2_quarantine.sql`, module `lib/media-r2-quarantine.ts`, `lib/media-r2-runtime.ts`, `lib/media-r2-cleanup.ts`, endpoint `/api/admin/cms/media/quarantine` (POST) và Worker staging binding **disabled by default**. Chỉ hướng ghi vào R2 quarantine private, không có GET file/public URL.
- **Bảo mật:** role D1 admin/editor + Origin, UUID idempotency, MIME/extension/magic, bounded byte/chunk/deadline, SHA256, quota D1 conditional INSERT + batch audit, CAS khi chuyển RESERVE→QUARANTINED, xóa bù R2 và purge theo TTL.
- **Dữ liệu & vận hành:** migration mới forward-only, không thay đổi D1 đã chạy; source không tự áp dụng migration, không ghi R2 hay deploy Cloudflare. Gate trong `cloudflare.config.ts` **false** cả staging và production, production không có R2 Media binding.
- **Giới hạn không được che giấu:** scanner `serviceConfigured=false`, backend decoder/EXIF strip/re-encode chưa triển khai, chưa có scan attestation, không xuất bản/serve ảnh. Hosted `CMS-MEDIA-001..012` vẫn NOT_RUN, IAM owner-PAUSED, SRS FROZEN, production HOLD, real QA credentials blocked.
- **Test/rollback:** `RUN-MEDIA-20261104-08` chạy Miniflare D1 thực trong runner + R2 memory fake, gồm idempotency, access/CSRF denial, MIME, bounded upload, D1 quota/reservation, compensation, TTL CAS purge; không coi là actual hosted test. Rollback của source là revert PR; nếu từng deploy sau này thì tắt feature gate và purge riêng có audit.
- **Tài liệu:** [MEDIA_R2_B3_8_QUARANTINE_PIPELINE_2026-11-04](./MEDIA_R2_B3_8_QUARANTINE_PIPELINE_2026-11-04.md). Không tự động đồng bộ baseline SRS.


### CHG-MEDIA-R2-20261104-06 — B3.9 request-context safety và quota abuse hardening

- **Nguồn:** tiếp tục PR #100 sau vòng rà soát Media R2; chính sách staging MED-DEC-01..07 không đổi.
- **Trước:** Worker dùng isolate-global mutable D1/R2 bindings, có nguy cơ cross-request khi xử lý await song song; quota theo giờ/ngày không tính FAILED, storage không tính PURGE_PENDING.
- **Sau:** dùng `AsyncLocalStorage` gắn D1/R2 riêng theo từng request; Media không fallback về bucket global. SQL atomic quota đếm cả attempted reservation trong khoảng giờ/ngày; trạng thái PURGE_PENDING còn chiếm quota lưu trữ.
- **Test & hạn chế:** `lib/media-r2-request-scope.test.ts` chứng minh cách ly luồng đồng thời và fail-closed; `lib/media-r2-quarantine.test.ts` bổ sung negative D1 quota. `RUN-MEDIA-20261104-10` ghi CI sau khi chạy thật. Không sửa 0025, không phát hành Worker, không cấu hình scanner, không sửa baseline SRS, không bật upload. Production HOLD, IAM PAUSED.
- **Tham chiếu:** [Tài liệu B3.9](MEDIA_R2_B3_9_ISOLATION_QUOTAS_2026-11-04.md).

### CHG-MEDIA-R2-20261104-07 — B3.10 gộp source scanner và attestation

- **Nguồn:** Owner yêu cầu gộp các task bước tiếp theo sau khi PCS rev64 và PR #102/#103.
- **Trước:** B3.9 chỉ có private quarantine, không có image full decoder, ClamAV, scanner proof hoặc D1 evidence; policy gate vẫn false.
- **Sau:** scanner Python one-shot cô lập (ClamAV INSTREAM, Pillow 13 decode+metadata-free WebP, scan original/derivative), signed HMAC receipt; verifier TS 15-min TTL/hash/revision/policy; thêm D1 migration **0026 forward-only** chứa private SCAN_PASSED_PRIVATE receipts; adapter kiểm tra bytes R2 thật và D1 CAS+audit; janitor xóa derivative theo cùng source.
- **Giới hạn:** chưa kết nối/triển khai service ClamAV, job runner, HMAC secrets, hosted R2, Worker hoặc D1 0025/0026; không bật Media flag và không có public GET, không chuyển REVIEW_APPROVED/AVAILABLE. Python ClamAV test chỉ dùng mock local socket, không chứng minh scan malware thật. Mọi authenticated hosted CMS-MEDIA-001..012 **NOT_RUN**.
- **QA:** RUN-MEDIA-20261104-13; unit+Miniflare D1/R2 + Python Pillow + mock local AV + CI 4 jobs và Chromium local/public old Worker (pending at creation).
- **Ảnh hưởng:** thêm backend-scanner độc lập, D1 table riêng, R2 private evidence interface, không chạm SRS hoặc production, IAM PAUSED, Cloudflare Access giữ nguyên, QA Drive chỉ chứa hình ảnh khi có.
- **Rollback:** không có hosted migration/Worker để rollback; tắt scanner/job runner và route gate vẫn false; D1 evidence table 0026 không tự xóa khi rollback code. [B3.10 design](MEDIA_R2_B3_10_SCANNER_EVIDENCE_2026-11-04.md); SRS **CHƯA_CHỐT**.

### CHG-MEDIA-R2-20261104-08 — B3.11 real scanner acceptance and hosted D1 prerequisites

- **Owner:** Đồng ý triển khai B3.11 theo 6 nhóm, staging trước và production HOLD; làm gộp theo đợt, không tự bật Media khi scanner chưa đủ.
- **Before:** Staging D1 chỉ có đến 0024, bảng quarantine/evidence chưa tồn tại; scanner chỉ được kiểm thử với socket giả lập.
- **After:** Đã thực thi và đọc lại migration 0025 (blob `c8320af6c2cc559a016858195ede064d3caa15b0`) và 0026 (blob `9688defdc38831f5caf7e88a07740bbe907ccf96`) trên **staging D1 only**. Kiểm tra thấy hai bảng, bốn index, journal đủ; 0 media records, FK check rỗng. Bookmark Time Travel **before** `0000088c-00000000-00005119-76aa9aed51901ec93f3e3c545bc7b1fd` (retention limited; **không** phải independent exported SQL backup). D1 API trả `SQLITE_AUTH` với `PRAGMA integrity_check` → NOT_RUN/UNSUPPORTED.
- **Real AV tests:** thêm workflow riêng Docker ClamAV official + socket relay (không public), test EICAR FOUND và clean image roundtrip, HMAC SHA-bound; **chỉ khi CI thực chạy PASS mới được gọi là real engine CI PASS**. CI không tiếp xúc private R2 hoặc dữ liệu người dùng.
- **Host blocker:** Cloudflare Containers application list `GET` trả HTTP 401 unauthorized, chưa có Container hosting/service identity/secrets/job runner. Worker upload flag và policy scannerConfigured false; **CMS-MEDIA-001..012 hosted real role E2E NOT_RUN**; production Worker/D1 và IAM không sửa.
- **Impacts:** Cloudflare **staging D1 schema changed**, docs, dedicated CI AV job; no app API/public serving/schema baseline SRS changes. SRS CHƯA_CHỐT; QA [run ledger](../../qa/IAICT_TEST_RUNS.md) RUN-MEDIA-20261104-16..17; [technical readiness](MEDIA_R2_B3_11_STAGING_RELEASE_GATE_2026-11-04.md).
- **Recovery:** Time Travel bookmark recorded. **Do not automatically restore**—would overwrite unrelated staging writes. Requires explicit rollback plan, validation, and backup retention. Scanner integration remains hard BLOCKED without Cloudflare Containers rights or alternate secured host.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-MEDIA-R2-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
