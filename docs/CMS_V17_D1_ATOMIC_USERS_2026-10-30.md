# CMS v17 — Kiểm thử giao dịch D1 và quyền người dùng

**Ngày:** 30/10/2026 (giờ Việt Nam); **phạm vi:** repository/GitHub Actions, database SQLite trong bộ nhớ.
**Trạng thái:** PR #9 Draft, test PASS; **chưa deploy staging/production**.

## 1. Phát hiện gốc

Tại `app/api/admin/cms/users/route.ts`, phiên bản trước thực hiện:
- ghi `cms_revisions` trước kiểm tra `LAST_ACTIVE_ADMIN`;
- cập nhật `admin_users`, xóa `admin_user_roles` rồi `db.batch` chỉ những INSERT vai trò;
- ghi audit cuối cùng bằng câu lệnh riêng.

Nếu INSERT vai trò hoặc INSERT audit lỗi, các thay đổi đã ghi trước đó có thể còn nguyên trong D1. Kết quả: người dùng mất quyền, metadata đã đổi hoặc revision lệch với dữ liệu thực tế dù API trả lỗi.

## 2. Thay đổi

Nhánh `fix/cms-v17-atomic-user-roles-20261030` (base `release/staging-v17-hardened-20261029`, snapshot đã deploy lên staging).

- Cấu trúc lại API quản lý user để gom `snapshot → UPDATE/INSERT user → DELETE roles → INSERT roles → INSERT audit` vào **một `db.batch` D1**.
- Di chuyển kiểm tra quản trị viên cuối cùng **trước mọi lệnh ghi**, không tạo revision cho request bị từ chối.
- Vô hiệu hóa tài khoản (DELETE HTTP) cũng dùng batch bao trùm snapshot, UPDATE active và audit.
- Giữ nguyên xác thực Cloudflare Access, `CMS_ADMIN_ROLES`, kiểm tra tự mất quyền admin, email duplicate và dữ liệu phản hồi.
- Không có migration, secrets hoặc thay đổi cấu hình Worker.

## 3. Kiểm thử thực tế

**GitHub CI:** https://github.com/ntdung-tds/iaict-portal/actions/runs/40920542386 — **30 test files, 316/316 Vitest PASS**, TypeScript, build và Cloudflare dry-run PASS.

**11 regression tests mới:** `lib/cms-users-atomic.test.ts` với Node.js `DatabaseSync(':memory:')`, schema D1 và adapter hỗ trợ transaction rollback. Đã chạy:
1. đọc danh sách user và role;
2. cập nhật thành công account + role + revision + audit;
3. trigger lỗi SQL khi thay role → rollback account/role/revision/audit;
4. trigger lỗi SQL ở bước audit cuối cùng → rollback tất cả;
5. trigger lỗi tạo vai trò đầu tiên → không để lại user mồ côi;
6. tạo người dùng mới thành công;
7. trigger lỗi audit khi vô hiệu hóa tài khoản → rollback;
8. vô hiệu hóa thành công và lưu revision;
9. chặn bỏ quản trị viên cuối cùng **không tạo revision thừa**;
10. viewer không được quản lý tài khoản;
11. chặn tự vô hiệu hóa.

**Browser Chromium:** 7/7 PASS trong CI gồm 3 kiểm thử UI/SEO cũ và **4 kịch bản giao diện quản lý tài khoản** tại `e2e/cms-users-atomic.spec.ts`. Chromium chạy ứng dụng Next/Vinext thực với **mock API phiên đăng nhập và dữ liệu người dùng**, thử sửa tài khoản, server 500 vẫn giữ bản nháp, cấm tự vô hiệu hóa, và API 403 không hiển thị dữ liệu tài khoản. Đây không phải phiên đăng nhập Cloudflare Access thật.

**Live staging:** workflow `staging-acceptance` tiếp tục kiểm tra Worker đã deploy ở phiên trước, không sử dụng tài khoản thật và không viết D1. Bản vá PR #9 chưa hiện diện trên Worker staging.

## 4. Giới hạn và rủi ro còn mở

- `D1.batch` có đảm bảo transaction ở tầng Cloudflare, còn adapter test dùng transaction SQLite trong bộ nhớ. Chưa cố tình gây lỗi trên database remote.
- **Chưa có optimistic concurrency/CAS** để chống hai quản trị viên cập nhật cùng user dựa trên snapshot cũ; kiểm tra `LAST_ACTIVE_ADMIN` trước batch vẫn có cửa sổ race khi hai yêu cầu đồng thời. Cần cơ chế transaction/constraint bổ sung cho invariants.
- `lib/cms-repository.ts` (ghi nội dung/trang, site settings) và một số API bài viết còn thực hiện nhiều lệnh ngoài một batch; sẽ kiểm thử và sửa ở PR tiếp theo.
- Chưa chạy đăng nhập Cloudflare Access thật và E2E tài khoản admin/editor/reviewer trên staging, nên không khẳng định đã nghiệm thu CMS toàn diện.
- Không triển khai production trước khi staging được thử nghiệm có kiểm soát và chủ dự án chấp thuận.

## 5. Quy trình tiếp theo

1. Rà soát PR #9; giữ Draft khi chưa có nghiệm thu chức năng quản lý user.
2. Kiểm thử D1 sandbox (không dùng DB staging đang hoạt động), kiểm thử race condition với hai session.
3. Sửa transaction trên CMS content và settings; bổ sung revision/optimistic locking.
4. Sau CI và bản backup/rollback, lên kế hoạch deploy staging riêng và chạy lại Playwright live; production giữ nguyên.
