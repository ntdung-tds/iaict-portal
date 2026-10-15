# IAICT Portal — Production Operations Runbook

**Baseline:** V16 production  
**Ngày chốt vận hành:** 2026-10-15  
**Trạng thái rollout:** `CLOSED / FROZEN`  
**Nguyên tắc:** không mở lại rollout V16 nếu không có lỗi production mới được xác nhận.

## 1. Baseline production đã chốt

- Worker production: `iaict-portal`.
- D1 production: `iaict-portal-db`.
- V16 migrations: `0012`–`0018`; kiểm tra production đã đạt **18/18**.
- Cloudflare Cron Trigger: `*/15 * * * *` (UTC), đã chạy thực tế thành công.
- Hai nguồn tin chính thức đang hoạt động:
  - `mst-gov-vn` — Bộ Khoa học và Công nghệ — chu kỳ 30 phút, retry 15 phút.
  - `chinhphu-vn` — Cổng Thông tin điện tử Chính phủ — chu kỳ 60 phút, retry 15 phút.
- Cloudflare Access cho khu vực quản trị đang hoạt động.
- `auto_publish_enabled` phải giữ **OFF (`0`)** cho đến khi có quyết định bật riêng theo quy trình tại mục 9.

Các thay đổi giao diện/chức năng sau V16 được triển khai như công việc sản phẩm thông thường; không coi đó là lý do chạy lại rollout V16.

---

## 2. Checklist vận hành nhanh hằng ngày

Thực hiện tối thiểu một lần/ngày làm việc hoặc khi có cảnh báo:

- [ ] Public site truy cập bình thường.
- [ ] `GET /api/health` trả HTTP `200`, body có `status: "ok"`, không cache.
- [ ] Cron Trigger production vẫn là `*/15 * * * *`.
- [ ] Có `news_scheduler_runs` mới trong 30 phút gần nhất.
- [ ] Run gần nhất không ở trạng thái `failed`; nếu `partial`, xác định nguồn lỗi.
- [ ] `mst-gov-vn` có `last_success_at` mới trong ngưỡng vận hành.
- [ ] `chinhphu-vn` có `last_success_at` mới trong ngưỡng vận hành.
- [ ] Không có `last_error` lặp lại liên tục ở cùng một nguồn.
- [ ] Hàng đợi `pending`/`editing` không tăng bất thường.
- [ ] `auto_publish_enabled = 0`.
- [ ] `/admin/*` vẫn yêu cầu Cloudflare Access.
- [ ] API quản trị không được trả dữ liệu khi thiếu danh tính Access.

### Ngưỡng cảnh báo ban đầu

| Hạng mục | Bình thường | Cảnh báo | Sự cố |
|---|---|---|---|
| Scheduler | run mới <= 30 phút | không có run > 30 phút | không có run > 60 phút hoặc run liên tiếp `failed` |
| Bộ KH&CN | success <= 60 phút | > 60 phút | > 120 phút |
| Chính phủ | success <= 120 phút | > 120 phút | > 240 phút |
| Một nguồn lỗi | retry tự động 15 phút | 2–3 lần liên tiếp | kéo dài quá ngưỡng nguồn |
| Auto-publish | OFF | — | ON ngoài change request = dừng ngay |

Các ngưỡng này là ngưỡng vận hành ban đầu, không phải thay đổi logic scheduler. Có thể tinh chỉnh sau khi có dữ liệu vận hành thực tế.

---

## 3. Kiểm tra Cron và scheduler trong D1

### 3.1. 20 lần chạy scheduler gần nhất

```sql
SELECT
  id,
  scheduled_key,
  cron_expression,
  status,
  due_count,
  claimed_count,
  succeeded_count,
  failed_count,
  skipped_count,
  started_at,
  finished_at
FROM news_scheduler_runs
ORDER BY started_at DESC
LIMIT 20;
```

Diễn giải:

- `succeeded`: các nguồn đến hạn đã xử lý thành công.
- `partial`: có nguồn thành công và có nguồn thất bại; không coi là site outage.
- `failed`: các nguồn đã claim đều thất bại; cần xem ingest run và `last_error`.
- `skipped`: hợp lệ khi không có nguồn đến hạn hoặc delivery trùng đã được idempotency chặn.

### 3.2. Trạng thái lịch từng nguồn

```sql
SELECT
  id,
  name,
  is_active,
  schedule_enabled,
  schedule_interval_minutes,
  schedule_retry_minutes,
  last_scheduled_at,
  next_scheduled_at,
  last_fetched_at,
  last_success_at,
  last_error,
  publication_mode
FROM news_sources
ORDER BY name;
```

Không dùng việc `last_scheduled_at` tăng làm bằng chứng duy nhất rằng nguồn khỏe; ưu tiên `last_success_at` và `news_ingest_runs`.

### 3.3. Ingest run gần nhất của từng nguồn

```sql
SELECT
  r.source_id,
  s.name,
  r.status,
  r.fetched_count,
  r.new_count,
  r.duplicate_count,
  r.queued_count,
  r.error_count,
  r.error_summary,
  r.started_at,
  r.finished_at
FROM news_ingest_runs r
JOIN news_sources s ON s.id = r.source_id
ORDER BY r.started_at DESC
LIMIT 30;
```

### 3.4. Audit scheduler/newsroom

```sql
SELECT
  action,
  entity_type,
  entity_id,
  metadata_json,
  created_at
FROM audit_logs
WHERE action LIKE 'news.%'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 4. Theo dõi hai nguồn tin

### Bộ Khoa học và Công nghệ — `mst-gov-vn`

- Adapter: RSS.
- Chu kỳ bình thường: 30 phút.
- Retry: 15 phút.
- Nếu lỗi một lần: để scheduler retry, không redeploy.
- Nếu lỗi kéo dài > 60 phút: kiểm tra feed/host, `last_error`, ingest run và adapter.
- Nếu > 120 phút không có success: xử lý như incident nguồn P2.

### Cổng Thông tin điện tử Chính phủ — `chinhphu-vn`

- Adapter: HTML discovery.
- Chu kỳ bình thường: 60 phút.
- Retry: 15 phút.
- Nếu lỗi một lần: để scheduler retry, không redeploy.
- Nếu lỗi kéo dài > 120 phút: kiểm tra markup/host, `last_error`, ingest run và adapter.
- Nếu > 240 phút không có success: xử lý như incident nguồn P2.

Một nguồn lỗi không được làm dừng nguồn còn lại và không được ảnh hưởng public request handling.

---

## 5. Access và API quản trị

### Kiểm tra thường xuyên

1. Truy cập `/admin/news` ở phiên chưa xác thực phải đi qua Cloudflare Access.
2. Người dùng hợp lệ sau Access phải vào được newsroom theo role trong D1.
3. Gọi `/api/admin/news/settings` khi không có danh tính Access phải **fail-closed** (`401/403` hoặc Access challenge), tuyệt đối không trả dữ liệu quản trị.
4. Với phiên đã xác thực, API phải nhận được `Cf-Access-Authenticated-User-Email` và `Cf-Access-Jwt-Assertion`, sau đó backend tiếp tục kiểm tra user active + newsroom role trong D1.

### VERIFY-ONCE sau khi chuyển sang vận hành

Kiểm kê Cloudflare ngày 2026-10-15 cho thấy Access application production hiện có domain scope `iaict-portal.iaict-platform.workers.dev/admin/*`. Trong khi backend newsroom được thiết kế để `/api/admin/*` cũng nằm sau Access và tự fail-closed nếu thiếu Access headers.

Do đó cần **một lần xác minh hardening**, không tự động coi là reopen rollout:

- [ ] request chưa xác thực tới `/api/admin/news/settings` không thể lấy dữ liệu;
- [ ] request đã xác thực từ UI tới `/api/admin/*` thực sự nhận Access identity headers;
- [ ] nếu edge Access chưa bao phủ `/api/admin/*`, tạo change request riêng để bổ sung policy/app scope trước khi mở rộng quyền quản trị.

Chỉ nếu xác minh cho thấy dữ liệu quản trị có thể truy cập trái phép mới nâng thành production security incident.

---

## 6. Logs và tín hiệu cần tìm

Scheduler ghi hai event chính:

- `IAICT newsroom scheduler completed`
- `IAICT newsroom scheduler failed`

Khi điều tra, ưu tiên ghép 3 nguồn bằng chứng:

1. Worker logs/tail — lỗi runtime và event scheduler.
2. `news_scheduler_runs` — trạng thái delivery, due/claimed/succeeded/failed/skipped.
3. `news_ingest_runs` + `audit_logs` — lỗi nguồn, số bài fetch/queue/duplicate và hành động newsroom.

Không dùng Worker log làm nguồn sự thật duy nhất vì dữ liệu vận hành bền vững đã được ghi vào D1/audit.

### Tín hiệu cần cảnh báo

- scheduler không có run mới quá 30 phút;
- `newsroom scheduler failed` xuất hiện liên tiếp;
- `failed_count > 0` lặp lại cho cùng một nguồn;
- một nguồn vượt ngưỡng `last_success_at` tại mục 2;
- ingest `error_count` tăng bất thường;
- queue `pending` tăng nhanh mà không có biên tập;
- auto-publish chuyển ON ngoài change request;
- request quản trị thiếu Access identity nhưng vẫn nhận dữ liệu.

---

## 7. Phân loại và xử lý sự cố

### P1 — nghiêm trọng

Ví dụ:

- public site không truy cập được diện rộng;
- D1/runtime lỗi ảnh hưởng public request;
- API quản trị lộ dữ liệu khi chưa xác thực;
- auto-publish bật ngoài kiểm soát và đã tự xuất bản nội dung không mong muốn.

Hành động:

1. giữ/tắt ngay auto-publish về OFF;
2. cô lập chức năng gây lỗi thay vì chỉnh nhiều hệ thống cùng lúc;
3. lưu run ID, thời điểm, log và audit liên quan;
4. rollback deployment chỉ khi lỗi có quan hệ với deployment mới;
5. khi đó mới được phép mở lại gate production tương ứng với lỗi thật.

### P2 — chức năng vận hành suy giảm

Ví dụ:

- Cron ngừng chạy > 60 phút;
- một nguồn vượt ngưỡng sự cố nhưng public site vẫn bình thường;
- adapter nguồn thay đổi cấu trúc và ingest thất bại.

Hành động:

1. giữ nguồn còn lại hoạt động;
2. không redeploy nếu chỉ là lỗi origin tạm thời;
3. kiểm tra `last_error` + ingest run;
4. nếu adapter hỏng, sửa riêng adapter, test staging, rồi promote theo change bình thường;
5. có thể tạm `schedule_enabled=0` cho đúng nguồn lỗi nếu cần cô lập.

### P3 — vận hành thông thường

Ví dụ: một lần fetch timeout, duplicate tăng, backlog biên tập nhỏ. Theo dõi, để retry tự xử lý và ghi nhận nếu lặp lại.

---

## 8. Checklist hằng tuần

- [ ] Xem 7 ngày `news_scheduler_runs`: tỷ lệ `failed/partial` và khoảng trống Cron.
- [ ] Xem `last_success_at`, `last_error` của hai nguồn.
- [ ] Rà queue `pending`, `editing`, `approved`, `rejected`, `published`.
- [ ] Kiểm tra article provenance cho một mẫu bài đã publish.
- [ ] Kiểm tra audit settings/publication.
- [ ] Xác nhận `auto_publish_enabled = 0` khi chưa có change request bật.
- [ ] Rà user/role newsroom còn đúng người, đúng quyền.
- [ ] Kiểm tra Access policy không bị mở rộng ngoài dự kiến.
- [ ] Không chạy lại migrations cũ chỉ để “kiểm tra”.

Query nhanh trạng thái auto-publish:

```sql
SELECT
  id,
  auto_publish_enabled,
  auto_publish_min_trust,
  auto_publish_max_per_run,
  require_attribution,
  require_source_published_at,
  updated_by,
  updated_at
FROM news_workflow_settings
WHERE id='default';
```

---

## 9. Quy trình bật auto-publish trong tương lai

**Mặc định hiện tại: KHÔNG BẬT.** Chỉ bật bằng change request có người chịu trách nhiệm và cửa sổ theo dõi rõ ràng.

### Điều kiện trước khi bật

- [ ] Cron và hai nguồn ổn định trong một khoảng quan sát đã thống nhất; khuyến nghị tối thiểu 7 ngày.
- [ ] Không còn lỗi duplicate/provenance chưa xử lý.
- [ ] Default category của nguồn hợp lệ.
- [ ] Attribution được giữ bắt buộc.
- [ ] Access/API admin đã qua kiểm tra hardening mục 5.
- [ ] Có người trực theo dõi lô bài đầu tiên.
- [ ] Có kế hoạch OFF ngay nếu nội dung sai.

### Cách bật an toàn

1. Giữ global auto-publish OFF trong lúc cấu hình nguồn.
2. Chỉ chọn **một nguồn** để thử nghiệm trước; nguồn còn lại đặt `manual`.
3. Đặt `auto_publish_max_per_run` thấp, khuyến nghị `1` ở giai đoạn đầu.
4. Rà trust level, category và attribution.
5. Bật global auto-publish trong giờ có người giám sát.
6. Kiểm tra từng bài tự xuất bản đầu tiên: title, summary, category, nguồn, canonical URL, provenance, audit.
7. Nếu có bất thường: OFF ngay global switch; item không đủ điều kiện phải quay về manual review.
8. Chỉ nâng cap/mở thêm nguồn sau khi có evidence ổn định.

### Emergency stop

Ưu tiên tắt qua CMS `Settings > Newsroom`. Nếu UI không khả dụng và có quyền D1 production, có thể dùng lệnh khẩn cấp:

```sql
UPDATE news_workflow_settings
SET auto_publish_enabled=0,
    updated_at=CURRENT_TIMESTAMP
WHERE id='default';
```

Nếu cần khóa thêm ở mức nguồn:

```sql
UPDATE news_sources
SET publication_mode='manual',
    updated_at=CURRENT_TIMESTAMP
WHERE is_active=1;
```

Sau emergency stop phải ghi incident/change log và xác minh không còn bài auto-publish phát sinh sau thời điểm tắt.

---

## 10. Những việc không làm trong vận hành bình thường

- Không chạy lại rollout V16 chỉ vì có thay đổi giao diện/chức năng mới.
- Không rerun migrations `0012`–`0018` trên production nếu không có lý do schema cụ thể.
- Không sửa migration cũ; schema mới phải dùng forward-only migration mới.
- Không bật auto-publish chỉ để thử trực tiếp trên production.
- Không tắt đồng loạt hai nguồn khi chỉ một nguồn lỗi.
- Không xóa provenance/audit để “làm sạch dữ liệu”.
- Không ghi token, credential, PII hoặc Access assertion vào issue/runbook/log thủ công.

## 11. Điều kiện mở lại production gate

V16 rollout chỉ được xem xét mở lại khi có **lỗi production được xác nhận** thuộc một trong các nhóm:

- security/access boundary;
- migration/schema integrity;
- scheduler/runtime systemic failure;
- publication race/idempotency/provenance defect;
- deployment regression ảnh hưởng production.

Lỗi riêng của một nguồn tin, backlog biên tập hoặc thay đổi UI không tự động mở lại V16 rollout gate.
