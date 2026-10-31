# IAICT Portal — Software Requirements Specification (SRS)

| Thuộc tính | Giá trị |
|---|---|
| Document ID | IAICT-SRS-001 |
| Trạng thái | **CHƯA_CHỐT / FROZEN** |
| Phiên bản | 0.0 — chỗ giữ baseline, **không phải SRS đã phê duyệt** |
| Quyền thay đổi | Chỉ sau khi **chủ dự án yêu cầu chốt SRS** |
| Phạm vi | Sẽ tổng hợp yêu cầu từ đề cương, nhật ký thay đổi đã được duyệt, kiến trúc và các quyết định |
| Phân biệt quy trình | **Chốt SRS ≠ bàn giao source code** |

## Bảo lưu baseline

Chưa ghi các yêu cầu chức năng hoặc phi chức năng như một baseline SRS chính thức. **Trong quá trình phát triển KHÔNG cập nhật tài liệu này**. Mọi thay đổi mới phải vào [index các nhật ký](README.md) và file `<phân-hệ>/thaydoi.md`.

### Tài liệu đầu vào cần đối chiếu khi chốt

- Đề cương chi tiết xây dựng Cổng thông tin điện tử IAICT, Hà Nội tháng 10/2026 — 17 mục / 23 trang, bao gồm danh sách trang và tiêu chí nghiệm thu ND01–ND10. **Nguồn tham chiếu chưa được xác lập là SRS được phê duyệt**.
- Nhật ký `thaydoi.md` của các phân hệ; tất cả mục ghi trạng thái và bằng chứng phê duyệt.
- Các ADR, API, database migrations, kết quả test thực tế (Test Run), rủi ro và giới hạn đã thống nhất.

### Quy tắc cập nhật tương lai

Khi nhận được **lệnh chốt SRS**: đánh phiên bản, nội dung yêu cầu chức năng/phi chức năng/luồng/tiêu chí chấp nhận, xác định ID SRS, thiết lập truy vết `SRS-ID ↔ CHG-ID ↔ code SHA/PR ↔ Test Case ↔ Test Run`, ghi danh sách thay đổi được và không được duyệt. Không suy diễn rằng mọi nội dung đã lập trình là yêu cầu được chấp thuận.

**Vùng này được giữ nguyên trong thời gian phát triển.**
