# B3.13 — Mở upload Media **vào vùng cách ly**, chỉ trên staging

**Ngày:** 04/11/2026. **Trạng thái:** SOURCE/CI IN REVIEW; chưa xác nhận Worker staging đã deploy. **Không phải xuất bản Media và không thay thế scanner thật.**

## Quyết định phạm vi

Người sở hữu dự án yêu cầu tiếp tục đến khi có chức năng **upload Media**. Cloudflare Containers API trả HTTP 401 với thông báo chính xác: `Unauthorized: You do not have access to Cloudflare Containers. Deploying containers requires the Workers Paid plan.` Hiện chưa có scanner Cloudflare Containers và không có quyền tự nâng cấp gói thanh toán.

Vì vậy chia rõ hai trạng thái độc lập:

1. **Private quarantine upload:** admin/editor CMS được gửi JPEG/PNG/WebP tĩnh tối đa 10 MiB vào private R2 có quota, SHA-256, magic bytes, idempotency, CSRF Origin, D1 CAS + audit, retention 7 ngày. Phản hồi duy nhất `QUARANTINED`, `requiresScan:true`, `publicUrl:null`. Không có endpoint đọc ảnh hoặc trả key R2. **Có thể bật riêng trên staging** dù scanner chưa được host. Tệp vẫn không an toàn để dùng.
2. **Media sẵn sàng sử dụng/xuất bản:** không mở; cần engine antivirus thật + trusted decode/reencode + attestation + D1 CAS, quyền phê duyệt và nội dung công khai. `MEDIA_POLICY.scan.serviceConfigured=false`, `MEDIA_POLICY.storage.directR2PublicAccess=false`. Không dùng R2 như public file server, không lấy file chưa quét đưa vào bài viết.

**Không bật upload trên production; không thay đổi IAM đang PAUSED và không đồng bộ SRS đang FROZEN.**

## Những phần đã có trong source

- `/admin/media/upload` — giao diện responsive/320px, phiên CMS cần admin/editor, kiểm tra kích thước/loại ảnh, retries cùng idempotency key, phản hồi cảnh báo chờ quét rõ ràng. Có link trong menu CMS chỉ khi admin/editor. Không hứa ảnh đã an toàn.
- `GET /api/admin/cms/media/quarantine` — capability probe đã xác thực, không cache, thông báo gate/role/scanner/publish, không lộ R2 key/identity khác.
- `POST /api/admin/cms/media/quarantine` — giữ nguyên luồng kiểm tra quyền server, CSRF Origin, MIME/signature, 10 MiB stream bound, D1 quota và audit, private R2, 7-day janitor; không có đường xuất bản.
- `cloudflare.config.ts` — staging env `IAICT_STAGING_MEDIA_QUARANTINE_ENABLED=true` mới bật `MEDIA_R2_QUARANTINE_ENABLED`. Mọi build production cưỡng bức `false` bất kể env.
- `scripts/verify-staging-release.mjs` — preflight cho **đúng 26 migration staging**, pin SHA `0022–0026`; số admin đang hoạt động, Access destination phủ `/admin`, `/api/admin`, Worker exact previous version + D1 Time Travel bookmark và rollback Worker version phải có.
- `.github/workflows/deploy-staging.yml` — chỉ **manual workflow_dispatch**, release branch `release/staging-media-quarantine-20261104` mới bật private quarantine; yêu cầu commit SHA và old Worker version UUID trùng exact; `environment: staging`, không chạy D1 migration, không deploy production, kiểm tra binding R2/D1/gate sau deploy, /api/health và 24 Chromium public smoke.

## Trạng thái trực tiếp trên Cloudflare **trước** release

- Staging Worker deployment `754b0509-e754-410c-8dff-46015d162a89`, version `1b8cfe71-88ef-4e21-8937-4f8590daaba4`; **chưa bật** API upload nguồn mới.
- Staging D1 `aa4a97e7-60c5-4da4-9f0b-d469ece811b4`: 26 migration (có `0025`, `0026`); đếm được **3 admin đang hoạt động** (không đọc danh tính).
- Staging Access ứng dụng `b9d6786d-8ba8-4b72-ab7b-ebf8c29ed715` có đúng 4 đường dẫn `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*`, AUD staging `c21e351bf4647a54e10e65348f2cca417de5203fe606c2281d43fa8c08d007e8`.
- R2 bucket `iaict-portal-staging-media` đã tồn tại; Worker staging hiện có binding `DB`, `MEDIA_BUCKET` và Access. Rollback version cũ truy xuất được, Time Travel D1 có bookmark. **Không có SQL export độc lập**, PITR retention-limited.
- Production Worker, D1 và R2 không thay đổi.

## Manual release gates (chỉ sau khi mã nguồn + CI đủ PASS)

1. Merge source vào nhánh phát triển; chạy `portal-ci`, `media-av-real-engine-ci`, 41+ local Chromium và public staging acceptance. Đối với trình duyệt upload trong CI là **mocked CMS API**, không được báo cáo là hosted upload thực.
2. Tạo release branch **chính xác** `release/staging-media-quarantine-20261104` trỏ vào **một commit đã duyệt**; không lấy stale `main` hay PR khác.
3. Dùng GitHub Actions `deploy-staging` → **Run workflow** → chọn đúng release branch; nhập `expected_worker_version` là UUID đang live (đọc lại ngay trước phát hành) và `approved_release_sha` đúng 40-hex commit của branch. Secret staging environment `CLOUDFLARE_API_TOKEN`/ `CLOUDFLARE_ACCOUNT_ID` cần tồn tại; runner không in token. Đường deploy này không khởi động nếu token không có hoặc environment cần owner approval.
4. Preflight dừng nếu cấu hình Access, D1 26 migration, admin count, rollback version, bookmark, SHA hoặc Worker hiện tại sai. Build staging với cờ upload riêng tư bật, deploy Worker **chỉ staging** không chạy migration, xác minh config binding `MEDIA_R2_QUARANTINE_ENABLED=true`, `MEDIA_BUCKET`, `DB`, health/public browser. Khi fail phải giữ log, đánh dấu FAIL và thực hiện manual rollback Worker phiên bản đã pin (không tự restore toàn bộ D1).
5. Trước khi nghiệm thu upload thực, cần tài khoản staging có quyền **admin/editor** dưới Access. Trình duyệt có session thật phải GET readiness `quarantineEnabled:true`, POST ảnh tổng hợp hợp lệ, nhận HTTP 201 `QUARANTINED` và D1 query + R2 object private readback; thử viewer 403, Origin sai 403, MIME sai 415, >10 MiB 413 và quota/idempotency, cleanup. Ảnh test/screenshots chỉ ở Drive QA quyền hạn chế.
6. **Không** biến tệp `QUARANTINED` thành link ảnh công khai; để dùng Media trong bài viết phải thực hiện B3.14 scanner hosted thực. Nếu người dùng yêu cầu ảnh dùng ngay, cần nâng cấp Workers Paid để mở Cloudflare Containers hoặc xác nhận một hạ tầng scanner cô lập tương đương.

## Tiêu chí báo cáo

- `SOURCE_READY`: code/CI PASS, chưa có Worker mới.
- `STAGING_PRIVATE_UPLOAD_ENABLED`: deployment mới, binding chính xác và GET readiness với tài khoản thực PASS.
- `STAGING_PRIVATE_UPLOAD_ACCEPTED`: POST với admin/editor thực + R2/D1 byte readback + negative cases PASS, có bằng chứng QA.
- `STAGING_MEDIA_PUBLISH_READY`: scanner hosted và phê duyệt/xuất bản an toàn PASS; **chưa thể đạt** với Containers 401.
- Không đánh đồng một mức với mức tiếp theo.

**Liên quan:** [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) Media; [#30](https://github.com/ntdung-tds/iaict-portal/issues/30) staging HTTP 503 cũ; [#32](https://github.com/ntdung-tds/iaict-portal/issues/32) Cloudflare Preview.
