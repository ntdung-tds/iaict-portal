# CMS v17 — Kiểm thử D1 sandbox thực tế (Cloudflare)

**Ngày thực hiện:** 30/10/2026 (giờ Việt Nam).  
**Môi trường kiểm thử:** Cloudflare D1 qua API thật (`/accounts/{account_id}/d1/database/{database_id}/query`), không giả lập `node:sqlite`.  
**Kết quả:** Các tình huống giao dịch và xung đột trọng yếu dưới đây đều đáp ứng kỳ vọng. **Không thử ghi lên staging/production.**

## 1. Phạm vi và bằng chứng cách ly

- D1 sandbox mới tạo: `iaict-cms-v17-cas-qa-20261030`.
- D1 QA UUID: `0f3094b9-4ffb-4b4e-b07e-444d4308b8e4`.
- D1 staging UUID: `aa4a97e7-60c5-4da4-9f0b-d469ece811b4` (không thay đổi).
- D1 production UUID: `81b73540-7d81-4ca1-a332-2be15039d630` (không thay đổi).
- Đã đọc lại Worker settings sau thử nghiệm: `iaict-portal-staging` chỉ bind DB staging; `iaict-portal` chỉ bind DB production. **Không có Worker nào trong hai Worker nói trên trỏ đến database QA.**
- Schema QA sử dụng **7 bảng liên quan** từ chính migration IAICT: `admin_users`, `roles`, `admin_user_roles`, `products`, `cms_revisions`, `audit_logs`, `site_settings`. D1 còn có bảng hệ thống `_cf_KV`.
- **Lưu ý:** sandbox dùng *subset* schema trích đúng từ `0001_core.sql` và `0019_v17_full_cms.sql`, **không phải** database có đủ 21 migration/bảng trong staging. Không dùng kết quả này để khẳng định mọi endpoint hoặc migration đầy đủ đã được kiểm thử.
- Chỉ dữ liệu QA tổng hợp (`qa-admin`, `qa-editor`, `qa-product`, các email `example.test`) được đưa vào sandbox.

## 2. Các kịch bản thực thi trên D1 thật

| STT | Tình huống | Quan sát / bằng chứng | Kết quả |
|---|---|---|---|
| QA-01 | CAS: biên tập viên A lưu bản cũ và commit cả revision, UPDATE, audit | `changes=[1,1,1]`; dữ liệu thành `Biên tập viên A`; 1 revision, 1 audit | PASS |
| QA-02 | Biên tập viên B dùng token `updated_at` cũ | `changes=[0,0,0]`; title vẫn là A, revision và audit không tăng | PASS |
| QA-03 | Cố tình gây UNIQUE error ở câu lệnh audit cuối batch UPDATE | Cloudflare trả `HTTP 400 / SQLITE_CONSTRAINT_PRIMARYKEY`; title và timestamp vẫn là A; 0 revision mồ côi | PASS (rollback) |
| QA-04 | Ghi lại quyền user, cố tình cho audit cuối batch lỗi | Tài khoản `qa-editor` giữ tên và vai trò `editor`, 0 revision mồ côi | PASS (rollback) |
| QA-05 | Thay quyền user và audit thành công trong một batch | `changes=[1,1,1,1,1]`; vai trò mới `reviewer`; đúng 1 revision và audit | PASS |
| QA-06 | Site settings: cập nhật settings rồi audit lỗi | Tên tổ chức vẫn `QA sandbox`, JSON `{}`, 0 revision mồ côi | PASS (rollback) |
| QA-07 | Race sau pre-read, trước batch; writer A đặt `updated_at` bằng chính timestamp writer B dự định dùng | CAS của writer B trả `changes=[0,0,0]`; không tạo revision/audit; bản của A giữ nguyên | PASS |
| QA-08 | Kiểm tra tính toàn vẹn database sau tests | `PRAGMA quick_check(1)` → `ok`; `PRAGMA foreign_key_check` → 0 dòng | PASS |

**Chú ý semantics:** D1 HTTP API vẫn trả 200 khi một batch gồm các câu SQL *thành công nhưng cập nhật 0 dòng*. Mã trong PR #10 có kiểm tra `meta.changes === 0` ở câu UPDATE/DELETE và đổi thành lỗi **HTTP 409** ở API CMS. Phần chuyển trạng thái HTTP 409 đã được kiểm tra bằng route tests của repository, **không khẳng định đã chạy route CMS thật trên Worker staging**.

**Tính nguyên tử:** batch lỗi ở câu cuối đã khiến các câu INSERT revision và UPDATE trước đó cùng được rollback trong Cloudflare D1 thực tế; đây là điểm khác với unit test mô phỏng SQLite.

## 3. Kết quả CI liên quan

- PR #9, kiểm thử quản lý user và rollback bằng SQLite in-memory + Playwright mock auth: https://github.com/ntdung-tds/iaict-portal/pull/9.
- PR #10, CAS và content transactions: https://github.com/ntdung-tds/iaict-portal/pull/10.
- CI trên commit chứa **16 regression tests**: https://github.com/ntdung-tds/iaict-portal/actions/runs/40923074108 — 332/332 Vitest + 9/9 Chromium PASS.
- Live staging (bản Worker hiện hành, **chưa có PR #9/#10**): https://github.com/ntdung-tds/iaict-portal/actions/runs/40923387564 — 9/9 PASS.

## 4. Điểm chặn nghiệm thu / khuyến nghị

1. **Chưa xác thực giao diện CMS bằng tài khoản thật thông qua Cloudflare Access.** Không tự tạo/bỏ qua chính sách Access để thử; trước triển khai cần tài khoản QA được cấp đúng quyền hoặc môi trường auth sandbox biệt lập.
2. CAS hiện áp dụng **khi client gửi `expectedUpdatedAt`**. Client cũ không gửi token có thể tạo lost update; cần kế hoạch bắt buộc version trên mutation endpoint và tương thích API.
3. Module `redirects` chưa có `updated_at`; settings mới đảm bảo atomic nhưng chưa có CAS; `articles`/Newsroom còn đường ghi riêng.
4. PR #9 và #10 là *stacked PR*, chưa merge. Cần đóng gói một commit phát hành staging có đầy đủ dependency, pin Worker version, nắm bookmark D1 mới và chạy lại Playwright khi triển khai.
5. Chưa chạy các thao tác ghi thật qua Worker binding; D1 API batch là bằng chứng về semantics của Cloudflare D1 nhưng không thay thế kiểm thử endpoint + Cloudflare Access đầu-cuối.
6. Bảo vệ invariant **luôn có ít nhất một admin** trong PR #9 hiện còn khả năng race giữa hai yêu cầu demote đồng thời vì kiểm tra số admin nằm ngoài transaction. Cần kiểm chứng và xử lý trước khi coi quản lý vai trò đạt mức production.
7. Database QA **được giữ lại có chủ đích** để lặp lại kiểm thử, tên ghi rõ `qa` và chưa có Worker binding. Không dùng database này cho staging hoặc production, không đưa PII thực vào.

## 5. Quyết định kỹ thuật

**D1 sandbox đã PASS các tình huống trọng yếu, nhưng CHƯA đủ cơ sở để triển khai tự động PR #9 + #10 lên staging đang hoạt động** khi chưa có nghiệm thu auth UI thật, lộ trình enforce CAS và xử lý last-admin race. Các thay đổi vẫn nằm trên nhánh GitHub; production nguyên trạng.
