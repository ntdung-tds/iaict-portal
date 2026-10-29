# IAICT staging — Bản sửa UI, SEO và Cloudflare Access

**Ngày:** 29/10/2026. **Môi trường:** `iaict-portal-staging`, không áp dụng production.

## 1. Các thay đổi đã thực hiện

### SEC-01 — Cloudflare Access bảo vệ đường dẫn gốc CMS (ĐÃ ÁP DỤNG TRÊN STAGING)

Ứng dụng Access staging: `IAICT Staging Newsroom` (ID `b9d6786d-8ba8-4b72-ab7b-ebf8c29ed715`).

Trước cập nhật:
- `iaict-portal-staging.iaict-platform.workers.dev/admin/*`
- `iaict-portal-staging.iaict-platform.workers.dev/api/admin/*`

Sau cập nhật (giữ nguyên cả hai mục trên và bổ sung):
- `iaict-portal-staging.iaict-platform.workers.dev/admin`

Cập nhật bằng API `PUT /accounts/{account_id}/access/apps/{app_id}` với danh sách `destinations` và `self_hosted_domains` đầy đủ, bảo toàn tên app, loại self-hosted, domain chính, session duration, IDP, policy ID và các thuộc tính cookie. API trả HTTP 200 và GET xác nhận đủ cả ba destination, chính sách allow có ID `67488700-cdd3-4db2-ac8c-5382bb19ec18` và số IDP vẫn bằng 1. Không thay đổi production Access.

**Kiểm thử ẩn danh thực tế:** Playwright Chromium `GET /admin`, `GET /admin/news`, `GET /api/admin/cms/overview`, `GET /api/admin/news/settings` trả redirect đến trang đăng nhập Cloudflare Access, không trả nội dung quản trị. Bộ live acceptance 9/9 PASS: https://github.com/ntdung-tds/iaict-portal/actions/runs/40914865501.

**Rollback chỉ cho cấu hình Access staging:** trong Cloudflare Zero Trust → Access → Applications → `IAICT Staging Newsroom`, bỏ duy nhất đường dẫn chính xác `iaict-portal-staging.iaict-platform.workers.dev/admin`; giữ `/admin/*` và `/api/admin/*` cùng chính sách hiện hành. Không tự rollback trừ khi có bằng chứng gây gián đoạn đăng nhập.

### UI-01 — Tương phản tiêu đề hero (SẴN SÀNG TRONG PR #8, CHƯA DEPLOY)

Trong `components/public.module.css`, thêm `color:#fff` cho selector scoped `.hero h1`. Màu chữ được quy định rõ thay vì kế thừa `--ink-strong` từ `app/globals.css`, khắc phục hiện tượng màu chữ xanh đen trên nền hero xanh đậm.

Có unit regression ở `lib/public-visual-seo-regression.test.ts` và Playwright Chromium sử dụng trang dev tại `e2e/public-visual-seo.spec.ts` để kiểm tra giá trị `getComputedStyle(h1).color` trên trang `/tim-kiem` = `rgb(255, 255, 255)`.

### SEO-01 — Title trang chủ bị lặp (SẴN SÀNG TRONG PR #8, CHƯA DEPLOY)

Sửa layout public `app/(public)/layout.tsx` sử dụng helper `createPublicLayoutTitle(siteTitle, defaultSeoTitle)` tại `lib/public-metadata.ts`:
- `absolute` cho title trang chủ, tránh bị áp tiếp mẫu `%s | IAICT` từ layout gốc.
- `template` tiếp tục dùng `%s · {siteTitle}` cho các trang con.
- Giá trị mặc định và siteTitle lấy từ thiết lập CMS, không hard-code SEO title.

Unit tests kiểm tra tiêu đề trang chủ, template trang con, fallback và CSS rule. Browser tests kiểm tra title thật trên trang `/`, `/tim-kiem` khi chạy ứng dụng mới trong dev mode.

## 2. Phạm vi kiểm thử

- **Live staging Chromium:** 9/9 PASS với Worker đang chạy, bao gồm Access path root được sửa.
- **Mã nguồn đã sửa:** Vitest + TypeScript + Vite build + Cloudflare dry-run trong GitHub CI; Playwright Chromium riêng chạy dev server để kiểm tra CSS và SEO thực tế.
- Chỉ chỉnh Access staging ở edge; chưa deploy code sửa CSS/SEO lên Worker v42 và chưa deploy production.
- Code trong PR #8 vẫn `draft`, nhánh `fix/cms-v17-publish-crm-guards-20261029` dựa trên `cms/v17-full-admin`.
- Sau khi staging được phép deploy bản vá đã qua CI, cần chạy lại browser smoke trên staging để xác nhận hai lỗi UI/SEO đã khắc phục trên môi trường thật. Không dùng kết quả test local thay thế bước này.

## 3. Ranh giới quản trị

Không truy cập dữ liệu người dùng, không thay đổi D1, không sửa secrets hoặc cấu hình production. Mọi triển khai mã nguồn cần xác định chính xác version đang hoạt động, snapshot trước deploy và khả năng rollback. Riêng cấu hình Access staging là thay đổi thực tế ở lớp edge và đã được truy vấn xác minh sau khi ghi.
