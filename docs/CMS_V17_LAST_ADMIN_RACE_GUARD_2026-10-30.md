# CMS v17 — Chặn race condition gỡ quyền quản trị viên cuối cùng

**Thời điểm:** 30/10/2026 (giờ Việt Nam)  
**Phạm vi:** PR #11, xếp tầng sau PR #10 và PR #9; **chưa merge/deploy**.

## 1. Tái hiện lỗi trên D1 thật

**Database QA:** `iaict-cms-v17-cas-qa-20261030`, UUID `0f3094b9-4ffb-4b4e-b07e-444d4308b8e4` (không bound vào Worker staging/production).

Đã sử dụng hai tài khoản giả `qa-admin` và `qa-admin-b`. Khi cả hai đang có vai trò `admin`, gọi đúng dạng tiền kiểm tra `countActiveAdmins(db, excludeId)` trong mã cũ:

- Request A xét còn admin khác → 1.
- Request B xét còn admin khác → 1.
- Cho A gỡ quyền admin thành viewer bằng một batch → thành công.
- Cho B gỡ quyền admin thành viewer bằng batch tiếp theo **dựa trên kết quả tiền kiểm tra trước đó** → thành công.
- Kết quả sau cả hai: **0 active admin**. Đây là một interleaving có thể xảy ra trong hệ thống khi hai request chạy đồng thời, dù bản thử thực thi các batch tuần tự có chủ đích sau hai lần precheck.

**Đã khôi phục toàn bộ vai trò của hai tài khoản giả** ngay sau thử nghiệm.

## 2. Bản sửa

Tại `app/api/admin/cms/users/route.ts`:

- Duy trì tiền kiểm tra để trả lỗi sớm nhưng **không còn dựa vào tiền kiểm tra để đảm bảo invariant**.
- Khi một tài khoản admin đang hoạt động bị hạ quyền hoặc vô hiệu hóa, câu `UPDATE admin_users` đặt trong *cùng* batch với revision, update role và audit sẽ tính lại:

  `EXISTS (SELECT 1 FROM admin_users JOIN admin_user_roles JOIN roles WHERE other_user.is_active=1 AND role.code='admin' ...)`

- Nếu không còn admin khác tại thời điểm thực thi trong batch, câu UPDATE cố ý đặt `is_active=NULL`, kích hoạt ràng buộc `NOT NULL` sẵn có. D1 rollback **toàn bộ transaction**, không có revision/audit/role thay đổi dở dang.
- Áp dụng cho cả `POST` sửa thông tin/vai trò và `DELETE` (vô hiệu hóa user).
- Chuyển lỗi ràng buộc trên thành phản hồi `400 INVALID_CMS_LAST_ACTIVE_ADMIN`; không cần migration.

## 3. Kiểm thử sau sửa trên D1 Cloudflare thật

Cùng hai admin giả, giữ nguyên precheck ban đầu nhưng áp dụng SQL guard trong batch:

| Tình huống | Thực tế quan sát | Kết quả |
|---|---|---|
| Demote admin A trong khi B vẫn có admin | `changes=[1,1,1,1,1]` | PASS |
| Demote admin B dựa trên precheck cũ, sau khi A đã mất quyền | `HTTP 400`, `SQLITE_CONSTRAINT_NOTNULL` | PASS — giao dịch bị từ chối |
| Sau hai lượt thử | Còn đúng **1 active admin**, không tạo orphan revision từ giao dịch B | PASS |
| Sau phục hồi QA | **2 active admin** | PASS |

Đây là hành vi D1 thật, không chỉ mô phỏng SQLite. Trong API CMS, lỗi D1 được ánh xạ sang `400 LAST_ACTIVE_ADMIN` để người quản trị biết nguyên nhân.

## 4. Kết quả CI và kiểm thử mã nguồn

- 3 regression tests mới tại `lib/cms-users-atomic.test.ts`: injected concurrent demote, concurrent deactivate và demote hợp lệ.
- **335/335 Vitest PASS, 31/31 files** trên GitHub Actions: https://github.com/ntdung-tds/iaict-portal/actions/runs/40926172220
- **9/9 Chromium Playwright PASS** trên mã nguồn mới, gồm kiểm thử UI quản lý người dùng; không sử dụng Cloudflare Access credentials thật.
- Staging acceptance vẫn chỉ kiểm thử bản Worker đã deploy trước PR #9/#10/#11; **không xác nhận code PR #11 đang chạy trên staging**.

## 5. Ranh giới còn mở

1. Sandbox D1 dùng subset schema có đủ bảng user/role/audit, không phải full 21 migration; không chạy database schema migration trong staging hoặc production.
2. Không thực hiện đăng nhập CMS thực qua Cloudflare Access. Cần tài khoản QA riêng trước E2E có xác thực hoàn chỉnh.
3. PR #11 có dependency PR #10 → PR #9; không được promote riêng PR #11. Cần lập release commit tổng hợp sau review và xác minh các schema khác.
4. Chưa thực hiện smoke test thực tế các API quản trị trên Worker mới vì **chưa deploy**.
5. Giải pháp dùng ràng buộc `NOT NULL` hiện hữu làm transaction guard; nếu schema thay đổi cần có regression test kèm theo. Để đảm bảo tuyệt đối bất kể đường cập nhật nào, có thể cân nhắc invariant ở cấp trigger DB trong một migration tương lai.

**Kết luận:** Race condition gỡ mất quản trị viên cuối cùng được tái hiện và đã có bản sửa được kiểm chứng trên D1 thật. Không thay đổi staging/production.
