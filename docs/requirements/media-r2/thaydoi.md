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

| CHG-MEDIA-R2-20261104-09 | 2026-11-04 | B3.12 gộp real ClamAV/Pillow Python HMAC sang verifier TS và R2/D1 CAS + purge với fixture tổng hợp CI | SOURCE_IN_REVIEW / HOSTED_BLOCKED | PR B3.12 · Issue #39 | RUN-MEDIA-20261104-20 PENDING CI | CHƯA_CHỐT_SRS |

| CHG-MEDIA-R2-20261104-10 | 2026-11-04 | B3.13 upload ảnh vào quarantine-only staging dù chưa có scanner hosted; UI role-aware, GET capability, release manual 26 D1 migration, prod gate OFF | SOURCE_IN_REVIEW / HOSTED_NOT_ENABLED | PR B3.13 · Issue #39 | RUN-MEDIA-20261104-23 PENDING CI | CHƯA_CHỐT_SRS |

| CHG-MEDIA-R2-20261105-01 | 2026-11-05 | B3.15: bộ test Media E2E có xác thực staging-only, chặn CI/cookies, QA checklist R2-D1 SHA; chưa có phiên QA hợp lệ, chưa chạy POST thật | TEST_HARNESS_PREPARED / LIVE_AUTH_BLOCKED | B3.15 PR · Issue #39 | RUN-MEDIA-20261105-01; read-only D1 PASS, authenticated E2E NOT_RUN | CHƯA_CHỐT_SRS |

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

### CHG-MEDIA-R2-20261104-09 — B3.12 kiểm thử thông luồng real AV/private ledger

- **Mục tiêu:** chứng minh B3.11 ClamAV thật → Pillow xử lý ảnh/receipt HMAC → TS verifier → private R2/D1 readback/CAS/cleanup hoạt động xuyên suốt trên cùng mẫu tổng hợp, khác kiểm thử tách đôi trước đây.
- **Thay đổi:** Python chỉ khi được cấu hình CI mới ghi fixture ảnh mẫu + WebP + receipt có chữ ký vào tệp tạm mode 0600; workflow ClamAV thật kiểm tra EICAR FOUND trước, chạy test Miniflare local cho dữ liệu thật đã quét: chữ ký Python hợp lệ, phát hiện derivative R2 sai SHA, chống replay, lưu bằng chứng **private only**, janitor xóa cả 2 tệp.
- **Ranh giới:** chỉ là CI disposable Miniflare D1/R2, không hosted R2, không scanner container Cloudflare (API 401), không dùng dữ liệu thật, không deploy Worker, không bật Media gate. Chưa có hosted IAM/CMS role E2E; production HOLD. [Thiết kế B3.12](MEDIA_R2_B3_12_REAL_AV_PRIVATE_BRIDGE_2026-11-04.md).
- **Test:** RUN-MEDIA-20261104-20, GH ClamAV dedicated CI pending, Portal CI pending. SRS không chỉnh, chỉ lưu thay đổi CHƯA_CHỐT.

### CHG-MEDIA-R2-20261104-10 — B3.13 upload cách ly riêng tư, không phải xuất bản

- **Owner:** yêu cầu tiếp tục cho đến khi chức năng upload Media mở. Phạm vi triển khai **staging**; production vẫn HOLD.
- **Quyết định:** tách upload vào vùng cách ly `QUARANTINED` khỏi bước antivirus/chuyển ảnh/duyệt/xuất bản. Cho phép admin/editor tải JPEG/PNG/WebP tối đa 10 MiB vào **private R2** dù scanner hosted chưa hoạt động; response `requiresScan:true,publicUrl:null`, không cung cấp bytes/key hoặc public URL. Không thay đổi chính sách quét trước khi dùng ảnh; scanner `serviceConfigured=false` giữ nguyên.
- **Thực hiện trong source:** UI `/admin/media/upload`, role-aware navigation, GET readiness endpoint đã xác thực không lộ private keys, POST bảo toàn quota/idempotency/Origin/D1 CAS; config chỉ mở staging khi cờ `IAICT_STAGING_MEDIA_QUARANTINE_ENABLED=true`; bổ sung quy trình manual deploy pin SHA/version, kiểm tra 26 migration + Access + admin + rollback bookmark; production flag false.
- **Cloudflare account:** Containers API 401 thông báo `Deploying containers requires the Workers Paid plan`; không tự thay đổi billing hoặc bỏ qua scanner. D1 0025/0026, Access và R2 bucket staging đã tồn tại. Chưa deploy Worker staging khi lập bản ghi; không làm hosted E2E hoặc coi scanner đã hoạt động.
- **Nghiệm thu cần:** source CI, mock Chromium, deploy staging đúng branch+SHA, GET readiness với user thật, POST synthetic file + R2/D1 byte readback, âm tính/quota/ownership, rollback; ảnh test chỉ Drive QA riêng.
- **Ảnh hưởng:** thay đổi staging UI và release workflow/preflight source, không thay SRS baseline (CHƯA_CHỐT), không IAM, không production. [Runbook B3.13](MEDIA_R2_B3_13_QUARANTINE_ONLY_STAGING_RELEASE_2026-11-04.md).

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-MEDIA-R2-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.

> **B3.11 evidence update, 2026-11-04:** [PR #106](https://github.com/ntdung-tds/iaict-portal/pull/106) source MERGED `c6c5d3e4`; [Real ClamAV #41775549025](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775549025) **3/3 EICAR/Pillow PASS CI ONLY**; [Portal #41775549028](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775549028) **4/4**; [public OLD Worker #41775549127](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775549127) 24/24 Chromium and HTTP PASS. Staging D1 0025/0026 actually applied, no hosted Worker deploy; scanner Containers HTTP 401 still BLOCKED and true CMS role Media E2E NOT_RUN. See [RUN-MEDIA-20261104-18](../../qa/IAICT_TEST_RUNS.md). SRS CHƯA_CHỐT.

### CHG-MEDIA-R2-20261104-11 — B3.13 staged rollout executed, private quarantine only

- [GitHub Actions #41815504208, attempt 4](https://github.com/ntdung-tds/iaict-portal/actions/runs/41815504208) **successful actual staging deploy** of source `1ed8038c4886c8218b4f9d94c8d94dac9f7f7e81` after owner fixed missing CI secrets then Access apps API token HTTP403. Failed attempts retained in same run history.
- Cloudflare live independent readback: staging Worker version `4ab3ecef-9ebd-485e-afb0-eac55136751d` 100%, private R2 bucket, existing D1, `MEDIA_R2_QUARANTINE_ENABLED=true`; production unchanged. NO production promotion or SRS baseline synchronization.
- **Separation of outcomes:** staging feature flag and interface DEPLOYED; authorized real CMS image upload POST/hosted R2 SHA and role-negative E2E still **NOT_RUN**. D1 source row count and scan evidence count zero at check. Hosted scanner requires Workers Paid or alternative isolated runtime; never mark raw media public.
- **QA**: RUN-MEDIA-20261104-26. **SRS decision** CHƯA_CHỐT. **Follow-up** B3.14 genuine controlled Admin/Editor browser and private R2/D1 byte proof; Issue #39 remains OPEN.

### CHG-MEDIA-R2-20261104-12 — B3.14 live anonymous Access edge guard automation (source QA only)

- Added **three narrow automated QA cases CMS-MEDIA-016..018**, exercised as **four actual anonymous staging Chromium/API requests**: Media upload UI GET, Media readiness GET, synthetic PNG POST with no login, forged incoming Access/native header POST.
- No privileged login, no R2 object probe, no staged Worker deploy, no production change, no new publicly available bytes. Results remain **PENDING CI** until exact reviewed SHA returns green; do not reclassify CMS-MEDIA-001..012 or authenticated CSRF/roles as PASS.
- Existing user authorization to create QA accounts does not waive Cloudflare Access authentication or justify printing passwords/secrets. Full B3.14 hosted E2E remains blocked until controlled Admin/Editor session and private D1/R2 readback.
- Linked to QA RUN-MEDIA-20261104-27 and PCS checkpoint continuation; **SRS sync CHƯA_CHỐT**.

### CHG-MEDIA-R2-20261104-13 — B3.14 four real staging unauthenticated negatives verified

- Source regression fixed RED→GREEN: [original CI #41847513261](https://github.com/ntdung-tds/iaict-portal/actions/runs/41847513261) malformed regexp TypeScript FAIL; fixed `24fea7f`, [source CI #41847866827](https://github.com/ntdung-tds/iaict-portal/actions/runs/41847866827) 4/4 PASS. [real staging Chromium #41847866607](https://github.com/ntdung-tds/iaict-portal/actions/runs/41847866607) 28/28 PASS, public HTTP 24/24 PASS. Four new Media requests prove anonymous/forged identities Access-denied.
- Independent live Cloudflare D1 media records **still 0** and staging Worker remains unchanged after tests. This is exactly an **anonymous edge-only negative test**; real authorized upload, R2 byte readback and role/CSRF E2E are **NOT_RUN**.
- See RUN-MEDIA-20261104-28; source PR #113; SRS sync CHƯA_CHỐT; scanner still requires isolated paid/alternative host, production HOLD.


### CHG-MEDIA-R2-20261105-01 — B3.15 protected real-session Media acceptance harness
- **Nguồn:** Owner đồng ý thực hiện đợt B3.15 ngày 05/11/2026, Issue #39, PCS rev70.
- **Trước:** staging Media quarantine gate ON, anonymous Access negative PASS nhưng không có live Admin/Editor upload, private R2/D1 SHA proof hoặc viewer role E2E.
- **Sau (source):** tạo Playwright manual-only isolated runner + mobile UI/API post/replay/CSRF/MIME/viewer/overlimit subcases, gắn mã CMS-MEDIA chính xác và kế hoạch độc lập D1/R2 SHA (docs/qa/IAICT_MEDIA_B315_HOSTED_QA.md). CI static safety guard ngăn truyền session thật vào CI. **Không thay đổi Worker, D1, Access, R2, IAM, SRS hay production.**
- **Quan sát thực 05/11:** read-only Cloudflare staging deployment không đổi, production không đổi, D1 media quarantine COUNT=0. Không có real QA credential/Access session; POST và R2 SHA **NOT_RUN/BLOCKED**, scanner hosted **BLOCKED**.
- **Tính chất thay đổi:** tests/runbook only; ảnh fixture tổng hợp 1×1, không dữ liệu khách hàng. Exact CI SHA và test PASS chỉ được ghi sau khi workflow hoàn tất. Không suy diễn feature hoàn tất.
- **SRS:** FROZEN / CHƯA_CHỐT. Chờ Owner nói “chốt SRS”.


### CHG-MEDIA-R2-20261106-01 — Thư viện Media cách ly, thu hồi có kiểm toán, không mở xuất bản thiếu scanner

- **Nguồn:** Chủ dự án yêu cầu hoàn thiện toàn bộ Media trong một lượt, staging-first, theo PCS. Lõi upload D1/R2/quota/idempotency/quarantine, bộ công cụ nén tại thiết bị, janitor có lịch và xác minh SHA-256 ảnh thật đã tồn tại. Phần quản lý tệp riêng tư sau upload chưa có trong CMS.
- **Bổ sung:** `/admin/media/library` (desktop/mobile, phân trang tối đa 20, lọc trạng thái, theo dõi bằng chứng scan riêng tư, link sang upload/nén), `/api/admin/cms/media/library` GET metadata **không trả byte, R2 key, SHA-256 hay public URL**. Admin/Reviewer xem metadata cùng scope, Editor chỉ thấy tệp mình tạo, Viewer và các role Newsroom độc lập bị 403; giữ phân biệt Media nội dung CMS cũ và Media R2 quarantine.
- **Thu hồi:** Admin xác nhận hành động bằng UI → POST cùng Origin, ID UUID v4, D1 revision, chỉ từ `QUARANTINED` → `REVOKED`, CAS + audit transaction. Không xoá bytes trực tiếp; janitor hiện có xử lý sau 24 giờ theo chính sách; phản hồi không bao giờ có public URL. Không hỗ trợ khôi phục/xuất bản đối tượng chưa quét.
- **Kiểm thử:** `CMS-MEDIA-020/021` sử dụng Miniflare D1 tổng hợp; `CMS-MEDIA-022` kiểm thử HTTP401 trên staging khi thiếu phiên (không giả mạo tài khoản). Owner upload thực tế và SHA ở RUN-MEDIA-20261106-01; không tự xóa hay sửa bản ghi người dùng.
- **Chốt bảo mật:** Quét ClamAV/Pillow và receipt HMAC có mã nguồn độc lập trước đó, nhưng **chưa có scanner hosted được cấp quyền/cấu hình**. Không cài Container Paid, không tạo chi phí, không dùng dịch vụ AV bên thứ ba khi chưa được phê duyệt; publication/preview unscanned tiếp tục OFF. Theo tài liệu Cloudflare Containers, Workers Free không bao gồm Containers. Có thể triển khai scanner riêng sau khi có máy chủ/Workers Paid được phê duyệt. Không đồng nhất phần quản trị Media hoàn thiện với vòng xuất bản an toàn đã được nghiệm thu.
- **Giới hạn thay đổi:** Source/UI/API/test trên branch staging; không IAM mới, không migration D1, không đổi R2 key hoặc bucket, không sửa SRS baseline, production HOLD. **Trạng thái ban đầu:** SOURCE_IMPL / CI_PENDING / STAGING_DEPLOY_PENDING / AV_HOST_BLOCKED / OWNER_FINAL_ACCEPTANCE_PENDING.


**Execution follow-up — CHG-MEDIA-R2-20261106-01 (2026-11-06):** PR #126 merged exact source SHA `3cdc2f1ffc409d0798a6e399c53fad1b454a5135` after PR-head Portal CI 4/4 PASS (run 42183654989) and staging-acceptance PASS (42183654991); 3 postmerge workflows Portal/real-engine ClamAV CI/staging-acceptance all SUCCESS. Manual Cloudflare Workers Build `79c82147-8fe3-4554-9679-f06effc20428` finished SUCCESS, deployed staging Worker `2ec96e89-7258-4f5d-bc73-b391af9a586c` 100% (deployment `d8f0e338-5825-4e87-899e-c1ea69719061`). Trigger restored HOLD. Actual Chrome anonymous Media private library UI navigation goes to native /login; GET/POST new API 401 no-store. Independently verified one existing owner-uploaded 463656-byte R2 PNG still QUARANTINED with exact D1 byte-size and SHA-256 match, no public R2 access. **Operational hosted ClamAV still BLOCKED on Workers Free until approved isolated host; scanner tests PASS in CI only.** User's protected Admin role E2E remains NOT_RUN without a legitimate agent browser session. See `RUN-MEDIA-20261106-04`; SRS FROZEN / CHƯA_CHỐT; production unchanged.
