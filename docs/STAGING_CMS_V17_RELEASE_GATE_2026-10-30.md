# IAICT Portal — Cổng nghiệm thu trước triển khai CMS v17 lên staging

**Ngày rà soát:** 30/10/2026. **Trạng thái:** NOT APPROVED / KHÔNG TRIỂN KHAI.

## 1. Hiện trạng xác minh (chỉ đọc)

| Hạng mục | Bằng chứng thực tế |
|---|---|
| Staging Worker | `iaict-portal-staging`; version `21ef7ce9-6f82-4381-a474-a3fa9678beb6`, 100% traffic |
| Production Worker | `iaict-portal`; version `e7c703f7-fc4c-4313-b14c-0a2c94e0613d`, không đổi |
| Staging D1 | `aa4a97e7-60c5-4da4-9f0b-d469ece811b4`; **21/21** records `d1_migrations`, 0001…0021 |
| Staging Cloudflare Access | `/admin`, `/admin/*`, `/api/admin/*` enabled |
| Production Cloudflare Access | `/admin/*` và `/api/admin/*`; **chưa liệt kê riêng exact `/admin`** |
| Access app AUD | Khác nhau giữa staging và production; signed JWT verifier ở PR #19 |
| Media QA | PNG độc lập trong [Google Drive](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3); không ZIP, không GitHub Actions QA artifact |

## 2. Các thay đổi chưa phát hành

Các thay đổi CMS/Newsroom bảo mật và D1 concurrency nằm trong **chuỗi PR Draft chưa merge**: #9 → #10 → #11 → #12 → #14 → #15 → #17 → #18 → #19 → #20 → #21. Cần so sánh commit ancestry, merge-base và các diff thực tế trước khi tạo nhánh phát hành cuối. Không suy ra rằng code đang chạy staging đã chứa các bản sửa này.

PR #8 là baseline riêng, có quan hệ với nhánh `cms/v17-full-admin`; **kiểm tra lại quan hệ với `release/staging-v17-hardened-20261029`** trước khi tích hợp. Không merge đại trà từ các PR chồng nhau bằng click; xác nhận head cuối có đúng 21 migrations và mọi regression test.

## 3. Kiểm tra tự động, không triển khai

- `npm run verify` bao gồm `verify:release-safety`, migration integrity, vinext, TypeScript, Vitest và build.
- `verify:release-safety` chạy trên mọi PR, từ chối bất kỳ `actions/upload-artifact` nào trong QA workflow; staging release không được phép tự kích hoạt theo push/PR/schedule.
- Hai workflow staging chỉ được khởi chạy **thủ công**, trên exact release branch, với GitHub environment `staging` và input `expected_worker_version`.
- `node scripts/verify-staging-release.mjs` xác minh quyền tài khoản Cloudflare, DB ID, tất cả migration, trạng thái split-deploy và so sánh phiên bản Worker hiện hành với UUID nhập thủ công. Preflight không ghi vào D1.
- Quy trình staging **không** tự chạy `npm run deploy:staging`, `migrate:staging` hoặc `migrate:production`; chỉ triển khai Worker staging sau khi đã xác thực D1 cùng 21 migration.
- Nội dung thay đổi của PR #21 chỉ có hiệu lực khi được tích hợp vào nhánh workflow phát hành; nhánh release cũ hiện còn logic tự động cũ, nên không push trực tiếp vào nhánh release khi chưa xử lý gating.

## 4. Điều kiện bắt buộc trước khi cho phép triển khai staging

1. Người phụ trách **cho phép rõ ràng** triển khai staging; xác định SHA của head được phê duyệt. **Không bao giờ triển khai production trong bước này.**
2. Kiểm tra lại ancestry/diff của toàn bộ chuỗi PR, đảm bảo không lược bỏ hotfix bảo mật.
3. Trước deployment: lưu thông tin rollback Worker version, xác nhận snapshot/Time Travel D1, bảo đảm 21 migrations khớp và không có pending migration.
4. Xác minh Access app staging cấu hình chính xác 3 đường dẫn; JWT issuer/AUD của staging đúng và mạng runtime lấy JWKS được. Đánh giá rủi ro tạm gián đoạn CMS nếu origin kiểm JWT bị lỗi.
5. Xác minh thủ công workflow dispatch theo đúng release SHA, đúng Worker UUID hiện hành, môi trường staging, tài khoản và secrets.
6. Sau triển khai: `/api/health`, 17+ Chromium public/Access-negative, responsive, SEO, routing; kiểm thử **CMS thật với phiên Cloudflare Access hợp lệ** cho role admin/editor/reviewer/viewer và phân quyền theo D1; invalid JWT/issuer/AUD/expired/forged identity bị từ chối.
7. Newsroom: tạo nguồn tin QA phù hợp trong D1 QA **hoặc** dữ liệu staging được cấp phép; thử concurrent review CAS, last-admin guard, lease mất quyền, auto-publish bị tắt giữa ingest, rollback giao dịch. Không ảnh hưởng dữ liệu production.
8. Lưu từng ảnh nghiệm thu PNG vào Drive riêng, không upload ảnh/trace/video/HTML QA lên GitHub. Tự động upload cần credential Drive dành riêng cho CI, chưa cấu hình.
9. Lập biên bản PASS/FAIL, ghi Worker version mới và chuẩn bị rollback nếu có lỗi. **Production chỉ xem xét sau staging được ký nghiệm thu và sửa exact-root `/admin` tại Access production**.

## 5. Giới hạn bằng chứng

- Browser QA dùng staging Worker cũ **không chứng minh** CMS/JWT/scheduler mới đã chạy đúng trên staging.
- Unit tests dùng RSA local signed tokens và SQLite regression không thay thế E2E đăng nhập Access hợp lệ và Cloudflare D1 thật sau deploy.
- Chưa có dịch vụ tự động chuyển PNG từ runner lên Drive; GitHub chỉ chạy QA và không lưu ảnh.
- Tài liệu này không cấp quyền merge/deploy và không yêu cầu sửa production.

**Decision: HOLD** cho đến khi hoàn tất điều kiện triển khai và người phụ trách phê duyệt rõ ràng.
