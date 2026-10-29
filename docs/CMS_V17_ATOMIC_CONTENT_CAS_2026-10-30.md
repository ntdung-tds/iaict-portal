# IAICT Portal CMS v17 — Atomic Content + Optimistic Locking

**Kiểm tra ngày:** 30/10/2026 (giờ Việt Nam). **Tình trạng:** PR #10 Draft, chưa triển khai lên Cloudflare.
**Nhánh:** `fix/cms-v17-atomic-content-cas-20261030`, base `fix/cms-v17-atomic-user-roles-20261030` (PR #9).

## 1. Lỗi được kiểm chứng trong phiên bản trước

`lib/cms-repository.ts` lưu/xóa CMS bằng các câu lệnh D1 tách rời: ghi `cms_revisions` → INSERT/UPDATE/DELETE record → ghi `audit_logs`. Lỗi DB/constraint/audit giữa chuỗi thao tác có thể tạo revision sai lệch, bản ghi chưa hoàn tất hoặc nhật ký mất đồng bộ.

Giao diện `components/admin/cms-collection-manager.tsx` trước đó không gửi dấu phiên bản dữ liệu gốc lúc người dùng bắt đầu sửa. Hai editor cùng mở một record, editor A lưu trước, editor B lưu sau có thể ghi đè thay đổi của A mà không được cảnh báo.

## 2. Giải pháp đã mã hóa

- Các thao tác tạo, cập nhật và xóa ở CMS collection được gom `content mutation + snapshot + audit` vào **một `D1Database.batch`**. Theo hành vi Cloudflare D1, batch thành công/rollback như một giao dịch.
- Thao tác sửa và xóa giờ hỗ trợ `expectedUpdatedAt` (thời điểm `updated_at` đã hiển thị khi tải record). Giao diện CMS gửi trường này trong payload POST/DELETE.
- Server so khớp `updated_at` trước batch và tiếp tục dùng `WHERE updated_at IS ?` trong transaction. Nếu stale, **HTTP 409 / code CONFLICT**, không sửa dữ liệu và không tạo audit/revision.
- Lịch sử snapshot được ghi bằng `INSERT ... SELECT` có điều kiện theo phiên bản gốc; nhật ký của chính mutation chỉ được ghi nếu **ID revision duy nhất** đã được tạo. Không dựa vào `updated_at` mới để chứng minh thành công, tránh trường hợp hai người chọn cùng mốc mili giây.
- `updated_at` được tăng tối thiểu một mili giây so với phiên bản trước, kể cả khi hai thao tác thực thi rất sát nhau. Timestamp tiếp tục giữ định dạng ISO.
- Client giữ nguyên nội dung chưa lưu và hiển thị cảnh báo xung đột thay vì ghi đè dữ liệu của người khác.
- Phục hồi một revision gọi `saveCmsRecord` với `restoreRevisionId`, ghi **audit restore trong cùng batch** với cập nhật; nếu audit thất bại, toàn bộ restore rollback.
- Cài đặt website giờ gom snapshot, upsert và audit vào một D1 batch.
- Không thêm migration, không thay đổi secrets/Cloudflare Access/Worker config.

## 3. Kết quả kiểm thử đã thực thi

**GitHub CI cuối:** https://github.com/ntdung-tds/iaict-portal/actions/runs/40923074108

- **332/332 unit tests, 31/31 tệp** PASS; trong đó **16 test mới** tại `lib/cms-content-atomic.test.ts` chạy API thực với `node:sqlite` bộ nhớ và adapter D1 có transaction rollback.
- **9/9 Chromium Playwright PASS** chạy trên mã repo đã sửa với mock auth/API, gồm hai bài mới trong `e2e/cms-content-concurrency.spec.ts` xác nhận POST/DELETE truyền đúng `expectedUpdatedAt` và giữ nguyên bản nháp khi nhận HTTP 409.
- TypeScript, migration integrity, build, Cloudflare dry-run trong CI PASS.
- Fault injection: fail audit khi tạo/sửa/xóa, fail UPDATE, fail audit khi lưu settings và phục hồi snapshot → không xuất hiện cập nhật dở dang.
- Concurrency injection: thay đổi `updated_at` sau lần đọc ban đầu nhưng trước khi transaction chạy; stale save/delete trả 409, không tạo revision/audit.
- Collision case: hai writer chọn `updated_at` mới **cùng mili giây**; request stale vẫn không thể ghi nhật ký giả do audit gắn với revision ID duy nhất.

## 4. Giới hạn quan trọng

- Live staging hiện **chưa triển khai PR #10**; live acceptance chỉ có thể xác nhận bản Worker đã deploy trước đó.
- Cơ chế CAS **chỉ được áp dụng khi client gửi `expectedUpdatedAt`**. Các client API cũ không gửi trường này vẫn có thao tác nguyên tử nhưng chưa được ngăn `lost update`. Trước khi bắt buộc token cho tất cả client cần khảo sát caller/test, đặt lộ trình chuyển đổi và thử lại.
- `redirects` không có `updated_at` trong schema nên hiện được đảm bảo transaction, **chưa dùng CAS**; cũng chưa triển khai CAS cho `site_settings`.
- `app/api/admin/cms/articles/route.ts`, phân hệ Newsroom, các endpoint khác sử dụng truy vấn D1 riêng phải được rà soát độc lập; kết quả này không thể quy cho tất cả hệ thống.
- Giao dịch `D1.batch` được thử bằng SQLite trong bộ nhớ mô phỏng đúng semantics; chưa fault-inject trực tiếp vào remote D1.
- Chưa thực hiện đăng nhập CMS qua Cloudflare Access với tài khoản thử nghiệm thật; Chromium tests dùng API auth giả lập, tuyệt đối không ghi dữ liệu staging.
- Chưa thay đổi production. PR #9 và #10 vẫn Draft và xếp tầng; không được merge #10 một mình khi PR #9 chưa được hợp nhất đúng nguồn.

## 5. Tiêu chí trước khi triển khai staging

1. Rà soát API callers và chính sách bắt buộc optimistic token, gồm cơ chế thông báo 409 cho biên tập viên.
2. Test thêm với D1 sandbox thực sự và các tác vụ ghi đồng thời; phân biệt test sandbox với staging.
3. Lập snapshot Worker trước và đối chiếu D1 migration/bindings; xác định commit build chính xác.
4. Khi được phê duyệt cập nhật staging, deploy theo quy trình rollback đã kiểm chứng và chạy lại browser acceptance cùng test CMS có xác thực.
5. Chỉ xem xét production khi staging được nghiệm thu đầy đủ và có xác nhận riêng.

**Kết luận:** Đã tái hiện, sửa và kiểm thử lỗi atomicity của CMS collection; CAS cho browser editor là cải tiến bổ sung. Chưa coi CMS/CRM đạt nghiệm thu tổng thể.