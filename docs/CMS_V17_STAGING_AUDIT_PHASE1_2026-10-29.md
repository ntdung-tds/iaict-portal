# IAICT Portal — CMS v17 / Staging Audit — Đợt 1

> **Ngày thực hiện:** 29/10/2026, giờ Việt Nam.
> **Hệ thống kiểm tra:** Cloudflare Worker `iaict-portal-staging`; D1 `iaict-portal-staging-db`.
> **Ứng viên mã nguồn phù hợp:** GitHub branch `cms/v17-full-admin`, commit `482392113d40592e0499f4e850defb937c367318` (17/10/2026). **Chưa chứng minh khớp 100% với Worker bundle**.
> **Worker đang phân phối:** version **42**, deployment ngày **2026-10-17T10:25:31Z**, tỷ lệ **100%**.
> **Phạm vi thao tác:** GET Cloudflare config và SQL truy vấn chỉ đọc trong D1 staging; đọc mã nguồn GitHub; không ghi database, không đổi Cloudflare, không deploy, không chạm production.
> **Phân loại bằng chứng:** `ĐÃ XÁC MINH` = có kết quả runtime/SQL; `RỦI RO CÓ CĂN CỨ` = suy ra từ code nhánh v17, cần test trên deployment; `CHƯA KIỂM CHỨNG` = chưa có dữ liệu/khả năng truy cập cần thiết.

## 0. Đính chính biên bản ban đầu

Biên bản `docs/STAGING_AUDIT_2026-10-29.md` trước đó phân tích nhánh `main` ở commit `a077777e500a0a152f647361f3cc2c3366c16c4f`, chứa migration 0001–0011 và lớp CMS dùng Vercel Blob. Tuy nhiên D1 staging **đã áp migration 0001–0021**, và GitHub có nhánh `cms/v17-full-admin` chứa chính xác bộ tệp migration này, API CMS dựa trên D1, Cloudflare Access và giao diện CMS mở rộng.

**Do đó: không được tiếp tục xem nhận định về Blob và CMS cũ trên `main` là mô tả bản đang chạy ở staging.** Báo cáo này ưu tiên nhánh v17. Mã deployed chưa được xác thực bằng SHA/build artifact, nên những phát hiện từ code phải giữ nhãn rủi ro đến khi kiểm chứng đúng phiên bản.

## 1. Kết quả kiểm chứng thực tế

| Kiểm tra | Kết quả | Trạng thái |
|---|---|---|
| Cloudflare Worker | `iaict-portal-staging`, workers.dev enabled | ĐÃ XÁC MINH |
| Version | v42, 100% traffic; deployed via Cloudflare CLI ngày 17/10/2026 | ĐÃ XÁC MINH |
| Binding | `ASSETS` (assets), `DB` (D1) | ĐÃ XÁC MINH |
| D1 staging | `iaict-portal-staging-db`, 44 bảng | ĐÃ XÁC MINH |
| Migration đã chạy | 21 bản, cuối `0021_v17_admin_role_normalization.sql` | ĐÃ XÁC MINH |
| SQLite `PRAGMA quick_check(1)` | `ok` | ĐÃ XÁC MINH |
| `pragma_foreign_key_check` | 0 vi phạm | ĐÃ XÁC MINH |
| Cloudflare Access app (staging) | Bao phủ `/admin/*` và `/api/admin/*` | ĐÃ XÁC MINH |
| Access policy | Allow Cloudflare account members; app RBAC kiểm tra thêm D1 roles | ĐÃ XÁC MINH cấu hình policy; hiệu lực thực tế chưa test HTTP |
| Cron | `*/15 * * * *` | ĐÃ XÁC MINH |
| Observability issue summary | 0 active issues (không thay thế request error monitoring) | ĐÃ XÁC MINH |
| Source bundle = nhánh `cms/v17-full-admin` | Commit 17/10 10:24Z gần deployment 10:25Z; migration khớp | **CHƯA KIỂM CHỨNG đối chiếu artifact** |

### Số liệu tổng hợp staging D1 (không đọc dữ liệu cá nhân)

| Nhóm | Số liệu |
|---|---|
| `articles` | 80, toàn bộ có `status='published'` |
| `news_review_queue` | 282 pending, 80 published |
| `admin_users` | 1 |
| `products`, `solutions`, `courses`, `projects`, `partners`, `experts`, `events`, `pages` | 0 mỗi bảng |
| `leads`, `course_registrations`, `media` | 0 mỗi bảng |
| `audit_logs` | 1.597 |
| `cms_revisions` | 0 |
| Auto-published audits | 78 `news.publish.auto`, 2 `news.publish.manual` |
| Workflow auto-publish | Enabled; min trust `official`; max 3/run; yêu cầu attribution và source published date |
| Scheduler lịch sử | 120 succeeded; 1 partial; 18 failed; 1.245 skipped |
| Scheduler 7 ngày gần nhất | 56 succeeded, 616 skipped, 0 failed/partial |

**Lưu ý:** `skipped` thường có thể là không có nguồn đến lịch; chưa kết luận là lỗi. Các lỗi lịch sử 18 failed đều có lần gần nhất vào 22/10/2026. Cần xem cơ chế quan sát/tái thử trước khi nghiệm thu.

## 2. Phát hiện ưu tiên

### V17-01 — Nguy cơ thay nhầm phiên bản đang chạy khi deploy từ `main` (CAO, xác minh lệch nguồn)

**Bằng chứng:** `main`: 11 migrations; D1 staging và nhánh `cms/v17-full-admin`: 21 migrations; Worker v42 có timestamp deploy gần thời điểm commit branch v17. `main` còn dùng lớp Vercel Blob và luồng CMS khác.

**Ảnh hưởng:** nếu deploy staging từ `main` có thể đưa giao diện/backend về kiến trúc cũ, mất tính năng mới, gây không tương thích database. Việc apply migration cũ không nhất thiết xóa dữ liệu, nhưng application code có thể không xử lý các bảng và luồng v17.

**Hành động:** khóa deploy staging tới khi xác định release commit/artifact đang chạy; chuẩn hóa đường phát triển từ branch v17 → PR → CI → staging; giữ tag/rollback version 42.

### V17-02 — Editor có thể đặt trạng thái `published` qua API lưu CMS (CAO, rủi ro RBAC có căn cứ)

**Bằng chứng:**
- `lib/cms-roles.ts` mô tả `editor` được tạo/sửa nội dung, `reviewer` có nhiệm vụ duyệt/xuất bản.
- `app/api/admin/cms/collection/route.ts`: `POST` dùng `CMS_EDIT_ROLES = ['admin','editor']`, gọi `prepareCmsData` và `saveCmsRecord`; không thấy kiểm tra riêng khi chuyển trạng thái sang `published`.
- `app/api/admin/cms/articles/route.ts`: `POST` cũng dùng `CMS_EDIT_ROLES`, và cho phép `status='published'` trong payload.

**Ảnh hưởng:** ở cấp code v17, editor có khả năng xuất bản trực tiếp, không bắt buộc bước reviewer; cần xác định đây có phải chính sách nghiệp vụ được duyệt hay không. Nếu bắt buộc 4 mắt, đây là lỗ hổng phân quyền/quy trình.

**Hành động:** triển khai state machine và quyền chuyển trạng thái ở backend (không dựa vào UI); thêm negative E2E editor → published = 403, reviewer/authorized publisher → published = hợp lệ; lưu audit đầy đủ.

### V17-03 — Nhiều thao tác ghi D1 liên tiếp chưa được gom trong giao dịch nguyên tử (CAO, rủi ro toàn vẹn)

**Bằng chứng:** `lib/cms-repository.ts` (`saveUser`, `saveCmsRecord`, `deleteCmsRecord`) thực hiện `recordRevision`, `UPDATE`/`INSERT`/`DELETE`, `writeAudit` qua các lệnh riêng; ở user role còn `DELETE FROM admin_user_roles` rồi `db.batch(INSERT roles)`. `app/api/admin/cms/users/route.ts` làm tương tự.

**Ảnh hưởng:** thất bại giữa các lệnh có thể để metadata/revisions/roles lệch trạng thái. Đồng thời, chưa thấy `expectedVersion`/CAS đối với thao tác lưu nội dung chung nên có thể mất thay đổi khi nhiều biên tập viên cùng sửa.

**Hành động:** thiết kế mutation theo giao dịch hoặc batch nguyên tử trong phạm vi D1, xác minh semantics, dùng version column/conditional UPDATE và regression test failpoint/concurrency.

### V17-04 — Ranh giới quyền xem dữ liệu cá nhân chưa đủ chi tiết cho CRM (TRUNG BÌNH–CAO, cần chốt policy)

**Bằng chứng:** `CMS_READ_ROLES` gồm `viewer`, `reviewer`, `editor`, `admin`. `app/api/admin/cms/collection/route.ts` cho phép GET module không `adminOnly` bằng nhóm quyền này. `lib/cms-schema.ts` mục `leads` và `registrations` không có `adminOnly`; các bảng chứa email, số điện thoại, yêu cầu liên hệ. `app/api/admin/cms/revisions/route.ts` có thể trả `snapshot_json` cho loại dữ liệu không `adminOnly`.

**Ảnh hưởng:** vai trò chỉ đọc nội dung CMS có thể có phạm vi đọc rộng hơn cần thiết đối với PII CRM. Chưa kiểm chứng lộ thông tin cho người ngoài: Cloudflare Access và D1 user roles vẫn được áp dụng.

**Hành động:** xác định quyền `crm.read`, `crm.assign`, `crm.export`, `cms.read` riêng; lọc trường dữ liệu theo vai trò; hạn chế snapshot revisions đối với PII, kiểm tra consent/retention.

### V17-05 — Kiểm thử acceptance staging chưa nằm trong bộ E2E mặc định (TRUNG BÌNH–CAO, xác minh code)

**Bằng chứng:** `playwright.config.ts` chứa `testIgnore: /staging-acceptance\\.spec\\.ts/`; `e2e/staging-acceptance.spec.ts` có kiểm tra Cloudflare Access, trang công khai, responsive và tin tức; GitHub `.github/workflows/ci.yml` trên nhánh v17 không chạy toàn bộ acceptance suite cho staging. Workflow push CI chỉ liệt kê `main`, `ui-wow-production`, `ui-v15-consolidation`; branch CMS v17 cần PR hoặc workflow thủ công để được kiểm chứng CI.

**Hành động:** tạo smoke/acceptance workflow **đọc-only** chạy trên staging URL với quyền tối thiểu; chỉ chạy kiểm thử đột biến trên DB/Worker sandbox riêng. Lưu kết quả CI, screenshot, logs.

### V17-06 — Health endpoint chưa kiểm tra D1/readiness (TRUNG BÌNH)

**Bằng chứng:** `app/api/health/route.ts` trả `status:'ok'` và version/environment, không query D1. `app/api/public/cms-search/route.ts` trả HTTP 200 cùng `items:[]` khi lỗi, làm khó phát hiện storage/search outage.

**Hành động:** tách liveness và readiness, trả lỗi đúng trạng thái ở API dữ liệu, bổ sung metrics+alert và cache policy rõ.

### V17-07 — Auto-publish đã bật ở staging; cần policy trước khi đưa lên production (TRUNG BÌNH–CAO, xác minh runtime)

**Bằng chứng:** D1 staging `auto_publish_enabled=1`, `auto_publish_min_trust='official'`, `auto_publish_max_per_run=3`, yêu cầu attribution/source publication time. Đã ghi 78 sự kiện `news.publish.auto`; Cron 15 phút.

**Hành động:** kiểm tra nguồn tin, provenance, bản quyền/attribution, chính sách biên tập tự động, chống trùng lặp; chạy thử cơ chế duyệt độc lập trước khi áp dụng production. Không tự ý tắt hay chỉnh policy khi chưa phê duyệt.

### V17-08 — Cloudflare Access đã có, song kiểm tra JWT trong ứng dụng chưa độc lập (TRUNG BÌNH, defense-in-depth)

**Bằng chứng:** Staging Access app bảo vệ `/admin/*` và `/api/admin/*`; policy cho Cloudflare account members. `lib/newsroom-auth.ts` yêu cầu hai headers `Cf-Access-Authenticated-User-Email` và `Cf-Access-Jwt-Assertion` có giá trị, đối chiếu email với user D1 và roles, nhưng không trực tiếp xác minh chữ ký/audience/issuer JWT ở code.

**Ý nghĩa:** chưa có bằng chứng khai thác hay bypass, vì edge Access đang bảo vệ các route. Tuy nhiên độ an toàn hiện phụ thuộc cấu hình Access. Nếu route mới không được bảo vệ đúng, chính sách có nguy cơ bị bỏ qua.

**Hành động:** bổ sung JWT verification (hoặc cơ chế chuẩn Access binding) ở backend, kèm integration test chống spoofed header và test route coverage.

## 3. Kết quả tích cực

- D1 thực sự tồn tại với đầy đủ 21 migration phù hợp ứng viên code v17; `quick_check` OK, không có lỗi khóa ngoại.
- Cấu hình runtime sử dụng D1 và Assets, không có bằng chứng cho thấy phải sử dụng private Vercel Blob trong Worker hiện hành.
- Cloudflare Access bảo vệ giao diện/API admin; D1 có 7 vai trò định nghĩa trong `lib/cms-roles.ts`.
- Scheduler chạy 15 phút, có idempotency và lease; 7 ngày gần nhất không ghi nhận failed/partial scheduler runs.
- Có test framework TypeScript/Vitest/Playwright và acceptance suite đáng dùng làm nền tảng.

## 4. Giới hạn và những việc chưa thực hiện

- Chưa kiểm tra HTTP trực tiếp qua browser staging (công cụ fetch HTTP ngoài connector không truy cập được hostname `workers.dev` trong phiên này).
- Chưa xác nhận Worker bundle v42 tương đương đúng git SHA nào.
- Chưa đăng nhập CMS, không thử CRUD hoặc phá hoại trên staging vì cần bảo toàn dữ liệu.
- Chưa chạy build/test cục bộ, chưa thu latency, throughput, logs từ request-level, chưa đánh giá tất cả CSS/responsive.
- Chưa thử nghiệm bảo mật mang tính tấn công, chưa đọc secrets, chưa xem bất kỳ bản ghi PII nào; chỉ dùng số đếm tổng hợp.

## 5. Bước tiếp theo và cổng phê duyệt

1. **P0/Release:** Chốt đúng source SHA/version 42, backup metadata, pin version trước khi build/deploy; không dùng `main` cũ để ghi đè staging.
2. **P1/CMS:** Viết regression tests về quyền chuyển trạng thái xuất bản, phân quyền lead/contact, nguyên tử ghi dữ liệu, kiểm tra đồng thời.
3. **P1/Security:** Rà soát route coverage Access và xác minh JWT; phương án phân quyền CRM, retention/consent.
4. **P1/Operations:** CI acceptance riêng; D1 readiness check; audit scheduler và policy auto-publish.
5. **P2/Feature:** Đưa CMS sản phẩm/giải pháp/khóa học/dự án lên đầy đủ luồng quản trị; phát triển CRM từ `leads`, `partners`, `course_registrations` và quyền truy cập mới.
6. Chỉ sau khi staging đạt tiêu chí nghiệm thu và người dùng đồng ý bằng văn bản trong cuộc trò chuyện mới xem xét triển khai `iaict-portal` production.

## 6. Đường dẫn mã nguồn/bằng chứng

- GitHub branch: `https://github.com/ntdung-tds/iaict-portal/tree/cms/v17-full-admin`
- GitHub `main`: `https://github.com/ntdung-tds/iaict-portal/tree/main`
- Staging Worker URL: `https://iaict-portal-staging.iaict-platform.workers.dev`
- Cloudflare (READ-ONLY): GET Workers script settings, deployments, versions, schedules, Access apps/policies, D1 metadata; POST D1 `/query` chỉ với `SELECT`, `PRAGMA quick_check(1)`, `pragma_foreign_key_check`, thống kê tổng hợp. Tất cả D1 queries trả `rows_written:0`.

**Báo cáo này không phải kết luận nghiệm thu; mọi hạng mục cần test vẫn giữ trạng thái open.**


---

## Phụ lục A — Đối chiếu provenance và các kiểm tra code bổ sung (29/10/2026)

### A1. Worker v42 và nhánh CMS v17

- GitHub `cms/v17-full-admin` HEAD: `482392113d40592e0499f4e850defb937c367318`, commit timestamp `2026-10-17T10:24:15Z`, thông điệp `fix(newsroom): paginate review queue with filtered counts and recovery`.
- Cloudflare Worker v42 (version ID `293841c3-5e16-4cb2-bd10-5ae38d299f42`) tạo lúc `2026-10-17T10:25:30.40592Z`, deployment lúc `2026-10-17T10:25:31.282046Z`, `source=cf_cli`.
- Version resource script có `etag=497c4938cba77b4c0c5495e0238af94337f5608d138d00ec026c88c407e7eed8`, `last_deployed_from=cf_cli`, handlers `fetch` và `scheduled`. ETag của Cloudflare **không phải** Git commit SHA; chỉ tương quan thời gian **không chứng minh code identical**.
- API Workers version/deployment đã kiểm tra không trả Git SHA. Cần bổ sung release manifest / `APP_VERSION` được nhúng vào artifact CI và đối chiếu endpoint runtime để xác thực các lần deploy sau. **Trước khi deploy lại, phải pin snapshot v42 và lập phương án rollback**.
- Trình đọc web từ công cụ hiện tại không truy cập được URL workers.dev, nên chưa thể xác minh HTTP `/api/health` hoặc `/api/news/workflow` trong đợt này. Đây là giới hạn công cụ, **không có nghĩa website lỗi**.

### A2. Bằng chứng chính xác hơn về rủi ro quyền xuất bản

**`lib/cms-roles.ts`**: `CMS_EDIT_ROLES=['admin','editor']`, còn vai trò `reviewer` được mô tả là duyệt/xuất bản. **`app/api/admin/cms/collection/route.ts`** (`POST`) dùng `CMS_EDIT_ROLES` cho các module không phải `adminOnly` rồi gọi `prepareCmsData` và `saveCmsRecord`. **`lib/cms-repository.ts`** trực tiếp chấp nhận `status='published'` và thiết lập `published_at`. **`app/api/admin/cms/articles/route.ts`** (POST) cũng dùng `CMS_EDIT_ROLES`, chấp nhận `status='published'` không phân biệt actor roles.

**Đánh giá:** rủi ro bypass *quy trình hai người duyệt* nếu workflow đó là yêu cầu nghiệp vụ. Chưa có bằng chứng một editor đã làm việc này trên staging; không gửi POST thử vì chỉ đọc. Cần chốt policy: nếu editor được phép tự xuất bản thì đây không phải lỗi; nếu yêu cầu phê duyệt tách biệt thì triển khai state machine và chặn HTTP 403 tại backend.

### A3. Bằng chứng chính xác hơn về rủi ro giao dịch

**`lib/cms-repository.ts`**:
- Khi sửa bản ghi: `recordRevision` (INSERT độc lập) → `UPDATE`/ `DELETE` (độc lập) → `writeAudit` (INSERT độc lập).
- Khi sửa user roles: `DELETE FROM admin_user_roles` chạy độc lập trước `db.batch(INSERT...)`.
- **`app/api/admin/cms/users/route.ts`** làm tương tự: `snapshotUser` → `UPDATE admin_users` → `DELETE admin_user_roles` → `db.batch(INSERT roles)` → `writeAudit`.

**Đánh giá:** lỗi/hết hạn thực thi ở giữa có thể tạo trạng thái chỉ cập nhật một phần. Các cặp `db.batch` đã dùng trong một phần đoạn mã nhưng **chưa bao trùm toàn bộ mutation**. Nên thiết kế lại thành transaction/batch nguyên tử có xác thực, kèm rollback test và CAS/version check.

### A4. Phạm vi quyền dữ liệu CRM có căn cứ

- `lib/cms-schema.ts`: `leads` và `registrations` không đặt `adminOnly=true`; chứa các trường phone/email/message.
- `app/api/admin/cms/collection/route.ts`: GET cho module không adminOnly dùng `CMS_READ_ROLES=['admin','editor','reviewer','viewer']`.
- `lib/cms-repository.ts`: `listCmsRecords` trả `SELECT *` cho module (bao gồm leads/registrations), không thấy field-level projection theo role.

**Đánh giá:** một tài khoản viewer **đã được Cloudflare Access xác thực và có role viewer trong D1** có thể đọc thông tin liên hệ qua API. Đây là vấn đề phân quyền nghiệp vụ nội bộ, không phải bằng chứng dữ liệu công khai ra Internet. Đề xuất tách `crm.view` / `crm.manage` khỏi `cms.view`, lọc trường PII theo phạm vi việc làm và kiểm soát export/audit.

### A5. Kiểm chứng bổ sung cần triển khai ở môi trường test biệt lập

1. **RBAC negative test:** actor `editor` yêu cầu đổi trạng thái sang `published` → 403 nếu yêu cầu hai người duyệt; `viewer` chỉ đọc không thể POST; kiểm thử role tổ hợp.
2. **Transaction failure injection:** giả lập lỗi sau `recordRevision` / sau `DELETE admin_user_roles`; không được tạo snapshot hoặc mất role không tương thích.
3. **CAS/concurrent test:** hai actors cùng sửa một bản ghi → một mutation bị từ chối đúng cách (409) hoặc có merge có chủ đích, không silent lost update.
4. **PII access test:** viewer không có `crm.view` truy vấn leads/registrations → 403 hoặc dữ liệu được redaction; nếu có quyền `crm.view`, chỉ xem đúng scope.
5. **Source provenance check:** artifact build chứa commit SHA cố định; `/api/health` có build identity; đối chiếu Workers deployment versions trước/ sau release.

**Không chạy các test có ghi trên D1 đang sử dụng; sử dụng D1 test riêng và dữ liệu mẫu.**
