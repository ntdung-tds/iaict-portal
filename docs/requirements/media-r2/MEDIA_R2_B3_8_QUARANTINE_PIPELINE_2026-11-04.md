# CMS Media R2 B3.8 — Private quarantine D1/R2 staging integration

**Ngày:** 2026-11-04 · **Trạng thái:** SOURCE IMPLEMENTATION / FAIL-CLOSED BY DEFAULT / HOSTED NOT_RUN · **Chủ đề:** hoàn tất phần còn lại của Media R2 theo chỉ đạo Owner · [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39).

## 1. Phạm vi đã triển khai trong mã nguồn

- **Migration forward-only:** `cloudflare/migrations/0025_media_r2_quarantine.sql`, tạo bảng `media_r2_quarantine_uploads` tách khỏi bảng `media` cũ, duy trì trạng thái `RESERVED → QUARANTINED`, `FAILED`, `ORPHAN_PENDING_PURGE`, `PURGE_PENDING`, `PURGED`. Mọi đối tượng có khóa private `quarantine/v2/cms-main/<UUIDv4>`; không có public URL hoặc derivative key.
- **Worker binding:** sử dụng R2 bucket staging hiện có `iaict-portal-staging-media`. `MEDIA_R2_QUARANTINE_ENABLED` = **false** trong config cả staging và production; production không có `MEDIA_BUCKET`. Không thể upload qua API cho đến khi bật cổng staging sau quy trình release riêng.
- **Route:** `POST /api/admin/cms/media/quarantine`. Sau xác thực qua Cloudflare Access/native D1 ở Worker và D1 role check, chỉ admin/editor. Bắt buộc Origin đúng, Idempotency-Key UUIDv4, Content-Type JPEG/PNG/WebP, filename URI-encoded. Bounded streamed read (10MiB, 4096 chunks, 30s), xác thực MIME/extension/magic bytes, SHA256; **chưa tin ảnh đã decode/scan**. Body không có public reader. 
- **D1 quota:** single-statement conditional INSERT, tối đa 20 uploads/actor/h, 200 uploads/scope/ngày, 1GiB bytes/scope/ngày, 5GiB stored/scope, 2 in-flight/actor. Atomic D1 batch reservation+audit. Idempotent retry cùng byte trả cùng upload ID, payload khác bị xung đột.
- **R2 storage & compensation:** ghi private key + content type/cache private; CAS cập nhật `QUARANTINED` + audit. Nếu PUT/commit lỗi, xóa R2 best-effort và đánh dấu `FAILED` hoặc `ORPHAN_PENDING_PURGE` để tác vụ phục hồi sau này. Không trả filename, storage key hoặc URL trong API.
- **Retention:** `cleanupExpiredPrivateMedia` gọi từ scheduled Worker **chỉ khi gate bật**, claim D1 bằng CAS trước khi R2.delete. RESERVED hết 1h, QUARANTINED hết 7 ngày, FAILED/ORPHAN sau 2 ngày, REVOKED sau 24h, PURGE_PENDING thử lại sau 15 phút, PURGED tombstone sau 90 ngày. Không tự động đọc/tải nội dung.
- **Kiểm thử:** Miniflare D1 + **R2 thật trong môi trường disposable local**, đồng thời adapter R2 memory giả lập lỗi để kiểm tra compensation; các bài test quota, ký hiệu file, role, origin, idempotency, CAS purge và retry. Một test đi qua Worker native D1 session và 8 tài khoản tổng hợp, với `vinext` dispatch mocked; test upload qua route và D1/R2 thực cục bộ. `RUN-MEDIA-20261104-08`, **không phải** Cloudflare hosted E2E.

## 2. Thiết kế cố ý chưa mở cho public

**Scanner `MEDIA_POLICY.scan.serviceConfigured=false` vẫn là hard gate.** Không có dịch vụ ClamAV cô lập, không có xác thực scan/decoder, không có phần backend phát hành derivative, không có route GET raw bytes, không có URL public, không có chuyển trạng thái AVAILABLE. Kiểm tra signature hoặc canvas phía client không thay thế full decode/scan độc lập. Không được sửa cờ `serviceConfigured` thành true khi chưa có dịch vụ thật và kiểm chứng attestation/hash.

**Không được bỏ qua IAM paused:** các tài khoản D1 staging QA đã ghi nhận trước đây vẫn vô hiệu hoặc chưa có mailbox/credential vault. Test Miniflare role synthetic không chứng minh Access hosted hoặc 8-role browser. SRS FROZEN và production HOLD.

## 3. Cổng mở staging thực và tiêu chí nghiệm thu

1. Khảo sát sẵn sàng môi trường: kiểm tra scanner tách biệt với Worker, cô lập malware, egress/quarantine, binary signature và timeout, nguồn mã hóa decoder cho JPEG/PNG/WebP, bảo vệ image bomb/EXIF, JWT/attestation nội bộ, hash binding và revoke. **Thiếu scanner → không cho publish/serve.**
2. Kiểm tra migration forward-only chính xác schema SHA, xuất D1 staging backup/bookmark, chống thay đổi migration đã chạy; áp dụng 0025 qua lệnh deploy riêng, không tự động “chỉ vì merge”. Kiểm tra số dòng trước/sau, rollback bằng **ngừng route** và compensation/tombstone; tránh xóa bảng dữ liệu.
3. QA tài khoản thật qua Cloudflare Access/native, tối thiểu admin/editor/reviewer/viewer và negative role, đúng scope. Chỉ dùng tài khoản kiểm thử được phép, không dùng dữ liệu cá nhân. Đăng nhập trên Chromium thực, theo dõi idempotency/replay/quota/purge/không public, D1/R2 audit readback. Lưu ảnh QA vào Drive riêng tư.
4. Pin exact SHA Worker và chỉ thực hiện one-shot staging khi tất cả gates độc lập PASS, cờ release bật chỉ sau kiểm thử scanner và rollback rehearsal. Production không thay đổi.
5. Bổ sung decoder/re-encoder cô lập, AV scan thật, D1 state CAS `SCAN_PASSED → REVIEW_APPROVED → AVAILABLE`, kiểm soát serving và revoke/retention. Cần migration/ADR tiếp theo và negative E2E. Tính năng nén ảnh/gzip/ZIP local từ PR98 vẫn độc lập.

## 4. Trạng thái chấp nhận

**B3.8 source partial** được thực hiện để tiến gần vận hành Media R2, không đánh đồng với “full completion”. `CMS-MEDIA-001..012` hosted vẫn NOT_RUN, 127 canonical QA definitions không tự thay đổi, Issue #39 **OPEN**. Không xác nhận upload/existence hoặc scanner của môi trường thật khi chưa chạy test hosted.

**SRS change log:** `CHG-MEDIA-R2-20261104-05`, chưa chốt SRS. **QA:** `RUN-MEDIA-20261104-08`. **Production:** HOLD.
