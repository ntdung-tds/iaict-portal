# B3.15 — Media staging E2E nghiệm thu thật (chỉ QA có xác thực)

Ngày: 05/11/2026 ICT. Trạng thái: **HARNESS_PREPARED / LIVE_AUTHENTICATED_NOT_RUN**.

## Baseline thực tế (read-only)
- PCS revision 70, development branch feat/staging-native-login-r2-20261030.
- Staging deployment c43e105c-f978-426f-b42c-f515238c2252; Worker version 4ab3ecef-9ebd-485e-afb0-eac55136751d, 100%.
- Production deployment a01a3743-ac78-4a19-a990-581fe9235751 không thay đổi.
- Cloudflare D1 staging: SELECT COUNT(*) FROM media_r2_quarantine_uploads = **0** (kiểm tra độc lập 05/11/2026).
- PR #114: 28/28 Chromium staging anonymous PASS, không chứng minh upload có xác thực.
- Tám tài khoản QA example.test hiện disabled, không có native password, Cloudflare Access identity hay phiên đăng nhập. Không biến chúng thành tài khoản thật bằng việc giả mạo header.
- ClamAV hosted scanner chưa triển khai được trên Cloudflare Containers với gói hiện tại. Chỉ lưu private QUARANTINED, không xuất bản.

## Bộ kiểm thử độc lập

- playwright.staging-media-authenticated.config.ts: chỉ chạy bằng lệnh thủ công trên staging, từ chối CI; buộc storageState nằm ngoài repo và quyền riêng tư; chặn reporter hình ảnh, video và trace; cấm retry tự động.
- e2e-private/media-b315.spec.ts: GET readiness, upload ảnh tổng hợp trên trình duyệt mobile thật, API HTTP 201 QUARANTINED, retry HTTP 200 cùng ID, Viewer bị từ chối, Origin sai, MIME giả và tùy chọn kiểm tra quá 10 MiB.
- scripts/verify-auth-acceptance-safety.mjs: kiểm tra tĩnh các chốt an toàn trong CI.
- Ảnh tổng hợp PNG 1x1 RGB, đúng 69 byte. SHA-256 cần đối chiếu: **7c382843aa8f9f7985f88a8cc7e0651c90ab9c0885a1b2d5e2e8526048e1992e**.

## Tiền điều kiện bắt buộc

Tạo hoặc tái sử dụng hộp thư QA do IAICT kiểm soát và thành viên Cloudflare Access hợp lệ, sau đó kích hoạt tài khoản CMS đúng vai trò bằng luồng chính thức. Mỗi role có một storageState riêng trên máy cô lập, đặt ngoài Git/Drive và cấp chmod 600. Mật khẩu và recovery phải ở kho mã hóa có thể khôi phục, không ghi vào GitHub, Drive, CI, ảnh chụp hoặc hội thoại.

Cho phép kiểm thử Media riêng trên staging không đồng nghĩa mở lại toàn bộ phát triển IAM đang PAUSED; không sửa Access policy để cho phép mọi email, không cấp quyền Cloudflare toàn tài khoản cho user QA và không chạy trên production.

## Lệnh chạy (chỉ trên máy QA được phép, khi đã có phiên hợp lệ)

~~~sh
IAICT_MEDIA_E2E_APPROVED=staging-only \
IAICT_MEDIA_QA_ROLE=admin \
IAICT_ACCESS_STORAGE_STATE=/private/qa/admin.json \
npx playwright test --config playwright.staging-media-authenticated.config.ts

# Chạy lại với editor và viewer, mỗi vai trò có storageState riêng.
# Oversize là bài gửi >10 MiB, phải chủ động cho phép:
IAICT_MEDIA_B315_OVERSIZE=true IAICT_MEDIA_E2E_APPROVED=staging-only \
IAICT_MEDIA_QA_ROLE=editor IAICT_ACCESS_STORAGE_STATE=/private/qa/editor.json \
npx playwright test --config playwright.staging-media-authenticated.config.ts -g oversized
~~~

Không chạy các lệnh trên CI; không cung cấp session hoặc token thật cho agent.

## Đối chiếu D1/R2 độc lập sau upload

1. Pin exact code SHA, Worker version/deployment, D1 migration ledger, R2 bucket binding và snapshot số object/bản ghi trước test. Kiểm tra production không đổi.
2. Chạy từng role. Chỉ ghi metadata không nhạy cảm: role, Case ID, HTTP, timestamp, QA Run ID, SHA; mã object nội bộ chỉ sử dụng trong bản ghi hạn chế quyền.
3. Cloudflare D1 staging truy vấn các bản ghi filename b315-ui-synthetic.png hoặc b315-api-synthetic.png: state QUARANTINED, mime_type image/png, byte_length 69, content_sha256 trùng hash trên, role/scope và audit chính xác, không có public URL; retry chỉ tạo một logical asset.
4. Từ storage_key sinh phía server trong D1, dùng đường đọc R2 **riêng tư** có quyền truy cập. Tải đúng bytes, tính lại SHA-256 độc lập, so với 69 bytes/hash trên. Không bật r2.dev, CDN hoặc URL công khai.
5. Với viewer, Origin sai, MIME giả và oversize: kiểm tra cả HTTP lỗi và **không phát sinh** bản ghi QUARANTINED hay object R2 ngoài dự kiến.
6. Giữ bằng chứng QA riêng trong Drive đã phân quyền. Không xóa đối tượng không thuộc QA. Chỉ sử dụng quy trình cleanup được duyệt.
7. Ghi append-only RUN-MEDIA với trạng thái từng case PASS / FAIL / BLOCKED / NOT_RUN, kèm exact Worker version, SHA, bằng chứng kiểm tra R2/D1 và link Drive hoặc NOT_CAPTURED.

## Ánh xạ chuẩn kiểm thử

- CMS-MEDIA-001: phần role Viewer / anonymous.
- CMS-MEDIA-002: phần Origin/CSRF.
- CMS-MEDIA-003: phần magic bytes/MIME.
- CMS-MEDIA-004: phần overlimit.
- CMS-MEDIA-008: phần idempotent retry (chưa kiểm thử concurrent race).
- CMS-MEDIA-012: browser thật và readback SHA D1/R2 (chưa nghiệm thu).

Các test trên là **subcheck**, không tự động chứng minh toàn bộ CMS-MEDIA-001..012 PASS. Quét antivirus thật, công khai derivative, IDOR, cleanup, quota burst và các bài còn lại vẫn BLOCKED/NOT_RUN theo đúng phạm vi.

**Hiện tại:** chuẩn bị source và kiểm tra D1 read-only PASS; live authenticated upload, role E2E và R2 hash **NOT_RUN/BLOCKED** vì chưa có QA session thực; scanner/publish **BLOCKED**; production HOLD.

Tham chiếu: [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39), [QA identities](IAICT_TEST_IDENTITIES.md), [QA Drive](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3).
