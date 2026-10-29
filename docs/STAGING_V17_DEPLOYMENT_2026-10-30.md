# IAICT CMS v17 — Biên bản triển khai staging và nghiệm thu trình duyệt

**Thời điểm triển khai:** 30/10/2026 ~00:05 (giờ Việt Nam; 2026-10-29T17:05:06Z).
**Phạm vi:** Chỉ Cloudflare Worker staging. KHÔNG triển khai production. **Kết quả:** SUCCESS, 9/9 browser acceptance PASS.

## Phiên bản và bằng chứng nguồn gốc
- Worker staging: `iaict-portal-staging`, https://iaict-portal-staging.iaict-platform.workers.dev/
- GitHub release branch: `release/staging-v17-hardened-20261029`, commit `2ca04e01c6f3274f0e7cef4b2e6076574d92828b`.
- Cloudflare Workers Build UUID: `066d417a-625f-403e-9949-380016f402fb`; outcome = success.
- Worker trước deploy (v42): `293841c3-5e16-4cb2-bd10-5ae38d299f42`.
- Worker mới: `21ef7ce9-6f82-4381-a474-a3fa9678beb6`, 100% traffic.
- Build trước v42: `722c2c44-718e-404a-b9ad-bbfca640b125`, source Git SHA `482392113d40592e0499f4e850defb937c367318` trên branch `cms/v17-full-admin`. Không phải nhánh `main` cũ.
- Production Worker `iaict-portal` giữ version `e7c703f7-fc4c-4313-b14c-0a2c94e0613d`, không thay đổi.

## Preflight và triển khai an toàn
- Đối chiếu 21 migration local với 21 migration thực trong D1 staging: PASS; không có migration mới.
- D1 staging UUID: `aa4a97e7-60c5-4da4-9f0b-d469ece811b4`.
- D1 Time Travel bookmark trong build: `000005ec-00000000-00005113-a0ee2058096bd9cc847b330bb8a16118` (chỉ làm chứng cứ, không tự phục hồi).
- GitHub Actions run `40916953619` dừng an toàn do thiếu secrets CLOUDFLARE_API_TOKEN và CLOUDFLARE_ACCOUNT_ID; không deploy qua Actions.
- Triển khai qua Cloudflare Workers Builds vốn đã kết nối GitHub, dùng token hiện có trên staging. Tạm cập nhật trigger staging `5a7a1bc4-2fec-4cca-8286-0881f63f1fa2`, preflight kiểm tra Worker v42 và D1 migration 21/21 trước deploy.
- 305/305 unit tests PASS trong Cloudflare build; TypeScript/production build/staging build PASS.
- Deploy command CHỈ cập nhật Worker: `IAICT_DEPLOY_TARGET=staging npx vinext-cloudflare deploy --env staging --skip-build`. KHÔNG gọi migrate:staging, KHÔNG ghi D1.
- 18 asset mới/đổi, 54 asset tái sử dụng, cron giữ `*/15 * * * *`.
- Đã khôi phục cấu hình trigger staging nguyên trạng: tên IAICT V16 controlled staging, branch ui-v16-functional, path .github/staging-trigger, build npm run build:staging, deploy npm run deploy:staging, cache enabled.
- Sau deploy xác minh D1 binding DB đúng UUID và PRAGMA quick_check(1) = ok; 0 dòng ghi bởi truy vấn kiểm tra.

## Kiểm thử thực tế trên bản Worker mới
- GitHub Playwright Chromium (rerun attempt 2): https://github.com/ntdung-tds/iaict-portal/actions/runs/40915447721 — **9/9 PASS trong 51,2 giây**.
- Bao phủ 12 route public, responsive 320/390/768 px, tìm kiếm Trâm rừng, tin có provenance, menu mobile, nhập và Enter truy vấn tiếng Việt, Cloudflare Access bảo vệ /admin, /admin/news và admin API.
- Browser Rendering mobile: trang chủ có title `IAICT`, không còn `IAICT | IAICT`; `/tim-kiem` title `Tìm kiếm · IAICT`, heading trắng nổi bật trên hero tối.
- Unit/visual regression mới trên mã sửa: https://github.com/ntdung-tds/iaict-portal/actions/runs/40915342214.

## Phương án rollback
- Nếu có lỗi nghiêm trọng, chỉ phục hồi deployment staging về Worker version `293841c3-5e16-4cb2-bd10-5ae38d299f42` (100%) bằng Cloudflare Workers Versions/Deployments.
- Không tự ý restore D1 theo bookmark: Cron vẫn có thể nhập tin mới và restore sẽ làm mất các thay đổi hợp lệ sau thời điểm bookmark.
- Không thay đổi Worker production trong mọi trường hợp khi chưa có chấp thuận mới.

## Giới hạn nghiệm thu
- Chưa có CMS E2E với tài khoản đăng nhập thật, quyền editor/reviewer/admin, thao tác CRUD và rollback workflow.
- Chưa khắc phục hoàn toàn lỗi nguyên tử D1, CAS/concurrent writes, xác minh JWT tại tầng ứng dụng, phân quyền CRM chi tiết, load test và toàn bộ WCAG.
- PR #8 còn là draft, chưa merge; deployment staging dùng Git commit cố định riêng.

**Kết luận:** Bản vá CMS v17 đã deploy thành công lên staging, browser smoke PASS, production nguyên trạng. Chưa đủ điều kiện promote production.