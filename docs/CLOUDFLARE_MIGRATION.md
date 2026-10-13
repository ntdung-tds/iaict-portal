# Chuyển production IAICT sang Cloudflare Workers

## Kiến trúc chuyển đổi

- Production mới: Cloudflare Workers + OpenNext.
- Vercel được giữ làm rollback trong giai đoạn xác minh.
- Cloudflare build được pin ở Next.js 16.3.8 và `@opennextjs/cloudflare` 1.20.10 vì OpenNext hiện còn issue runtime với Next.js 16.4.
- CMS/Media tạm thời tiếp tục dùng private Vercel Blob để không mất dữ liệu khi đổi compute. Giai đoạn tiếp theo sẽ migrate storage sang Cloudflare R2.

## Kiểm thử bắt buộc

`portal-ci` kiểm tra cả hai runtime:

1. TypeScript + unit tests.
2. Next.js build và E2E.
3. OpenNext build.
4. E2E trên Cloudflare Workers runtime thông qua Wrangler/workerd.

Không chuyển DNS hoặc tắt Vercel nếu bước 4 chưa PASS.

## GitHub production secrets cần thiết

Trong GitHub repository, tạo Environment tên `production` và thêm các secret sau:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BLOB_READ_WRITE_TOKEN`
- `IAICT_ADMIN_PASSWORD`
- `IAICT_ADMIN_SESSION_SECRET`

Không commit giá trị secret vào repository.

`IAICT_ADMIN_USERNAME=admin`, `IAICT_ADMIN_ROLE=superadmin` và `APP_ENV=production` được khai báo dưới dạng Worker variables trong `wrangler.jsonc`.

## First deploy

Sau khi `portal-ci` xanh và các production secrets đã có:

1. GitHub → Actions.
2. Chọn `deploy-cloudflare-production`.
3. Run workflow.
4. Mở URL `*.workers.dev` mà Wrangler trả về.
5. Kiểm tra `/`, `/tin-tuc`, `/tim-kiem`, `/admin-login`, `/api/health` và đăng nhập CMS.
6. Chỉ sau khi smoke test hoàn tất mới gắn custom domain hoặc chuyển DNS.

## Rollback

Trong giai đoạn chuyển đổi, Vercel vẫn phục vụ tại deployment hiện hữu. Nếu Worker có lỗi runtime, không đổi DNS hoặc đưa DNS trở lại Vercel; dữ liệu CMS vẫn nằm trong private Vercel Blob nên không cần phục hồi dữ liệu ở bước này.

## Giai đoạn 2 — bỏ phụ thuộc Vercel

Sau khi Cloudflare compute ổn định:

1. Export các JSON CMS/users/media/notifications và media blobs hiện có.
2. Import sang Cloudflare R2.
3. Thay storage adapter từ Vercel Blob sang R2.
4. Chạy regression + E2E.
5. Xác nhận CMS ghi/đọc/upload/delete trên R2.
6. Sau đó mới bỏ `BLOB_READ_WRITE_TOKEN` và có thể tắt Vercel hoàn toàn.
