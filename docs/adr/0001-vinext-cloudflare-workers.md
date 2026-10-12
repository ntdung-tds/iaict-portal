# ADR-0001 — Next.js 16 + vinext trên Cloudflare Workers

- **Trạng thái:** Accepted for implementation baseline; M0 validation pending
- **Ngày:** 2026-10-13
- **Nguồn:** IAICT v3.4.3.11 frozen handoff

## Bối cảnh

Đặc tả bắt buộc repo mới dùng Next.js 16 App Router, vinext và kiến trúc Cloudflare-native. Baseline phải chứng minh stack thật trên Workers trong M0 trước khi phát triển sâu các phân hệ nghiệp vụ.

## Quyết định

1. Dùng Next.js 16 App Router làm API surface và vinext/Vite làm toolchain triển khai lên Cloudflare Workers.
2. `GET /api/health` là liveness endpoint nhẹ, không fan-out tới dependency và luôn `Cache-Control: no-store`.
3. Trang public tĩnh/ít biến động sẽ là ứng viên cho framework/CDN caching sau khi M0 xác nhận hành vi cache/hydration; admin, preview, form mutation và API nhạy cảm mặc định không cache.
4. D1/R2/Queue/Turnstile/Access không được mô phỏng thành bằng chứng PASS. Mọi gate M0 cần chứng cứ trên tài nguyên Cloudflare staging thật.
5. Không sửa hoặc tái diễn giải migrations 0001–0011 từ repo đặc tả. Việc đưa migrations vào repo triển khai sẽ là thao tác copy nguyên trạng có kiểm tra hash ở bước M0 tiếp theo.

## Hệ quả

- Có thể phát triển giao diện baseline và CI ngay, nhưng không được tuyên bố production-ready trước khi hoàn tất M0.
- Việc cấu hình resource IDs, Access, Turnstile, Queue, Email và D1 remote cần tài khoản Cloudflare staging.
