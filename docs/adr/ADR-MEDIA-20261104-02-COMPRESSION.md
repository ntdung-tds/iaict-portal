# ADR-MEDIA-20261104-02 — Tối ưu và nén ảnh, nén tệp cho CMS Media R2

**Trạng thái:** ACCEPTED_FEATURE_REQUEST / STAGING_IMPLEMENTATION_PROFILE · **Ngày:** 2026-11-04 · **Nguồn:** Chủ dự án yêu cầu “Nhớ thêm nén ảnh, nén tệp nhé” · **Liên quan:** [ADR-MEDIA-20261104-01](./ADR-MEDIA-20261104-01.md), [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39), `CHG-MEDIA-R2-20261104-03`.

**Phạm vi:** Bổ sung **khả năng tối ưu/nén ảnh** và **nén tệp** vào định hướng Media; đây là yêu cầu đã được Owner đưa ra. Cấu hình ngưỡng dưới đây là quyết định kỹ thuật cho staging, có thể điều chỉnh qua một ADR/CHG mới. **Không hiểu nhầm mã kế hoạch source-only là upload/compression trên Worker đã hoạt động.** Không tự mở rộng định dạng upload: CMS Media hiện vẫn chỉ cho phép JPEG/PNG/WebP tĩnh theo ADR 01; scanner và decoder thực chưa có, nên mọi luồng xuất bản/serve tiếp tục fail-closed.

## 1. Hai cơ chế khác nhau

| Nhóm | Quyết định kỹ thuật | Ngoài phạm vi hiện tại |
| --- | --- | --- |
| **Ảnh** | Sau quét an toàn và **decode toàn bộ bằng bộ giải mã tin cậy**, chuẩn hóa orientation, chặn ảnh động/quá số pixel, xóa EXIF/GPS, re-encode bản hiển thị cạnh dài tối đa **1920 px**, thumbnail cạnh dài tối đa **480 px**, **không phóng to** ảnh nhỏ. JPEG chất lượng **82%**, WebP **80%**, PNG **lossless** giữ trong suốt. | `lib/media-image-optimization.ts` **chỉ tính cấu hình bộ mã hóa**, chưa tạo ra JPEG/PNG/WebP thực, chưa chứng minh pixel hay scan. Chưa triển khai conversion WebP tự động nếu chưa xác thực màu sắc/alpha |
| **Tệp nội dung dạng text** | Có mã thử nghiệm **gzip thật** (đã nén và có thể giải nén kiểm chứng ở unit test) cho `text/plain`, `text/csv`, `application/json`. Dưới **5 MiB đầu vào**, nếu tiết kiệm **ít nhất 5%** thì lưu kết quả dạng gzip, nếu không giữ bản gốc. Giới hạn dữ liệu gzip xuất và yêu cầu UTF-8 hợp lệ. | Danh sách MIME này **không phải quyền upload tệp lên Media**. Không có tệp nào ngoài ảnh được chấp nhận vào R2 bởi thay đổi này; adapter storage/HTTP chưa nối |
| **Tệp ZIP tải xuống** | Đưa vào backlog chức năng nén nhiều tài liệu đã được cấp quyền thành ZIP theo yêu cầu, kiểm tra quyền **từng tệp**, tên tệp an toàn, giới hạn tổng dữ liệu/tệp/độ sâu và khóa bảo vệ. | Chưa tạo ZIP thật, chưa mở đường upload ZIP; cấm tự giải nén ZIP/RAR/7z của người dùng trong Worker |
| **Tệp vốn đã nén** | Tránh nén lại JPEG/PNG/WebP, PDF, DOCX/XLSX, ZIP, 7z, MP4 vì thường ít lợi ích, tăng CPU và có thể làm lớn hơn. | Cho phép upload PDF/Office/video cần quyết định MIME/threat model/QA riêng, không tự suy ra từ yêu cầu "nén tệp" |

## 2. Bắt buộc giữ chất lượng, tính đúng đắn và bảo mật

1. **Quét trước khi public:** scanner sạch + decode/re-encode tin cậy, chữ ký nội dung gốc, lưu dẫn xuất có hash và bản ghi D1/audit. Không dùng cờ `verified` từ client; `MEDIA_POLICY.scan.serviceConfigured=false` vẫn chặn review/publish/read bytes.
2. **Nguyên bản riêng tư:** ảnh gốc lưu theo cơ chế quarantine/retention hiện hành; chỉ phục vụ dẫn xuất an toàn đã duyệt. Không đổi hoặc thay ảnh gốc bằng dữ liệu nén làm hỏng nguồn; rollback/cập nhật profile phải tạo phiên bản derivative mới.
3. **Không hy sinh an toàn để tiết kiệm vài byte:** dù tệp ảnh sau re-encode lớn hơn, không được phục vụ lại bản thô chứa EXIF/GPS; có thể yêu cầu review/cảnh báo hiệu quả nén.
4. **Đảm bảo kích thước ảnh thật:** chặn ảnh gây nổ bộ nhớ với giới hạn gốc 10 MiB, 25 triệu pixel, 8192 px mỗi chiều, animation/đa frame, phân bổ CPU/thời gian; metadata truyền từ client không đủ để xác minh.
5. **Gzip đúng cách:** nén chỉ khi có lợi ích tối thiểu 5%; phải bảo toàn hash nội dung gốc, `Content-Type` thật và `Content-Encoding: gzip` khi tải xuống, tránh nén HTTP hai lần. Không giải nén nội dung thiếu tin cậy nếu chưa có cap kích thước giải nén/ratio chống zip bomb.
6. **Vận hành:** thông số nén thuộc profile có phiên bản. Thu số liệu tỷ lệ tiết kiệm và tốc độ xử lý nhưng không log bytes, EXIF, tài liệu bí mật, tên gốc hoặc thông tin cá nhân.

## 3. Phạm vi triển khai trong PR này

- `lib/media-image-optimization.ts`: tạo **image encoder plan** từ metadata sau decode (source-only); trả về display + thumbnail, không xuất ảnh thật.
- `lib/media-text-compression.ts`: **nén gzip thật với fixture** đã được giới hạn dữ liệu, trả lại byte result; không có import nào trong Worker route, R2 hoặc D1.
- Unit tests kiểm tra hướng ảnh, không upscale, lossy/lossless, trần pixel/bytes, animated/Proxy, gzip roundtrip, không lưu byte lớn hơn, UTF-8 lỗi, file ZIP/PDF/Office bị từ chối; **không gọi đây là QA hosted**.
- Ghi nhật ký thay đổi `CHG-MEDIA-R2-20261104-03`, QA run và PCS. **127 QA case definitions, 15 Media IDs không đổi**; `CMS-MEDIA-001..012` live E2E vẫn NOT_RUN. Google Master không cần sửa chỉ vì source fixture bổ sung.

## 4. Cổng nghiệm thu chức năng thật — chưa hoàn thành

- Scanner ClamAV-compatible cô lập, decoder ảnh đáng tin cậy, bảo đảm strip metadata, test đủ ICC/alpha/orientation/animation, CPU/memory caps và so sánh ảnh chất lượng qua fixture.
- API/Worker có xác thực/CSRF, scope/RBAC, quota D1 atomic, private R2 lưu derivative + hash + idempotency, phục hồi khi lỗi, cache/revoke. Test trình duyệt tài khoản hợp lệ và đối chiếu byte thực sau giải mã/nén, Google Drive ảnh QA riêng.
- File upload không phải ảnh cần được quyết định threat model, MIME allowlist, quota, scanner, retention và user-facing UX riêng. ZIP bundle chỉ cho các tệp đã có quyền đọc, không gồm nội dung quarantine/private của scope khác.
- Không deploy production, không đổi IAM/Access, không cập nhật `docs/requirements/SRS.md` trước lệnh “chốt SRS”; không xuất source sang Drive khi chưa có lệnh “bàn giao”.

**Tham chiếu:** OWASP [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), W3C [Compression Streams](https://www.w3.org/TR/compression/) và chính sách [Media R2 v1](./ADR-MEDIA-20261104-01.md).
