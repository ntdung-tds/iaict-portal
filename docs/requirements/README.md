# IAICT — SRS và nhật ký thay đổi theo phân hệ

**Trạng thái:** TÀI LIỆU QUẢN LÝ YÊU CẦU ĐANG PHÁT TRIỂN · **SRS CHƯA ĐƯỢC CHỐT**

## Quy tắc bắt buộc

1. Mỗi phân hệ có **`thaydoi.md`** riêng; đây là **sổ ghi thay đổi sống** trong suốt quá trình xây dựng: yêu cầu mới, sửa, bỏ, phương án, lỗi, thay đổi giao diện/dữ liệu/API, tác động, rủi ro, test và quyết định.
2. **Không cập nhật `SRS.md`** cho tới khi chủ dự án nói rõ **“chốt SRS”**, **“chốt yêu cầu”** hoặc phê duyệt một baseline SRS xác định. Lệnh **“bàn giao”** là hành động riêng về xuất mã nguồn lên Drive; không mặc nhiên là chốt SRS. Không đánh đồng “ok bước tiếp theo”, test PASS, deploy staging hay merge PR với chốt SRS.
3. Mỗi thay đổi phải có mã `CHG-<MODULE>-YYYYMMDD-NN`, mô tả yêu cầu trước/sau, nguồn/yêu cầu gốc, trạng thái `PROPOSED | IN_PROGRESS | IMPLEMENTED | TESTED | APPROVED_FOR_SRS | REJECTED | SUPERSEDED`, PR/commit, người quyết định (nếu có), ảnh hưởng đến API/D1/UI/quyền/bảo mật, Case ID/Run ID và Drive evidence nếu có.
4. Một thay đổi **đã code/test không có nghĩa yêu cầu đã được chủ dự án duyệt đưa vào SRS**. Chỉ những mục `APPROVED_FOR_SRS` có bằng chứng người duyệt rõ ràng mới được hợp nhất khi có lệnh chốt.
5. Không sửa/xóa lịch sử: bổ sung entry đính chính/liên kết `SUPERSEDES`. Dùng Markdown table để báo cáo test; cần phân biệt unit/mock/browser live, và `PASS/FAIL/BLOCKED/NOT_RUN`. Ảnh QA lên Drive; không lên GitHub.
6. Code vẫn commit GitHub bình thường. Không chuyển **bất kỳ source code** nào sang Google Drive trước khi chủ dự án ra lệnh **“bàn giao”**. Tài liệu quản trị, QA và hình ảnh Drive vẫn cập nhật bình thường.
7. Khi chốt SRS: đối chiếu từng `CHG` với thực trạng code, CI, test, quyết định của chủ dự án và đề cương; cập nhật `SRS.md` theo baseline có phiên bản, tạo bảng truy vết SRS–CHG–PR–TEST. Phân biệt yêu cầu đã được xác nhận với đề xuất ngoài phạm vi; không tự đưa đề xuất vào SRS.

## Nguồn và thứ tự

- **Tài liệu người dùng cung cấp (tham chiếu phạm vi, KHÔNG mặc nhiên phê duyệt):** `DE_CUONG_CHI_TIET_CONG_THONG_TIN_IAICT_2026.docx`, 23 trang, 17 mục; mô tả trang chủ, sản phẩm, giải pháp, chuyển giao, đào tạo, tin tức, CMS, lead/CRM và tiêu chí ND01–ND10. File gốc được cung cấp trong hội thoại, **không đẩy vào repo và không sửa file gốc**.
- **SRS:** [`SRS.md`](SRS.md) là **chỗ dành cho baseline**; trạng thái hiện tại `UNAPPROVED / FROZEN`.
- **Đang phát triển:** các [`thaydoi.md`](#danh-sach-phan-he) là nơi ghi thay đổi bắt buộc. Tài liệu kỹ thuật `docs/` và ADR vẫn tồn tại, không bị thay thế bởi nhật ký thay đổi.
- **Kiểm thử:** `docs/qa/IAICT_TEST_CASES.csv`, `docs/qa/IAICT_TEST_RUNS.md`; link ảnh lỗi lên Drive.

## Cấu trúc từng entry

```md
### CHG-<MODULE>-YYYYMMDD-01 — <Tên thay đổi>
- Ngày / trạng thái / mức ưu tiên:
- Nguồn (đề cương §; issue / yêu cầu chat):
- Trước / Sau (nêu khác biệt rõ, không lặp mô tả):
- Lý do / phạm vi / ngoài phạm vi:
- UI/API/D1/data migration/quyền/bảo mật/SEO/hiệu năng bị ảnh hưởng:
- Quyết định và người phê duyệt (nếu có; nếu chưa: CHƯA_CHỐT):
- GitHub issue / PR / commit chính xác:
- Test case IDs / test run IDs / kết quả thực tế (bảng) / Drive evidence:
- Phương án rollback / yêu cầu tái kiểm:
- SRS impact: PENDING, tuyệt đối không tự sửa SRS:
```

## Danh sách phân hệ

| Mã | Phân hệ | Phạm vi trong đề cương | Nhật ký thay đổi |
|---|---|---|---|
| portal-ui | Trang chủ, điều hướng, giao diện | §3–5, §9, §16; ND01, ND07 | [thaydoi.md](portal-ui/thaydoi.md) |
| gioi-thieu | Giới thiệu, chuyên gia, đối tác | §5.2, §9; ND01 | [thaydoi.md](gioi-thieu/thaydoi.md) |
| san-pham | Sản phẩm & Nền tảng | §5.3, §14; ND02, ND09 | [thaydoi.md](san-pham/thaydoi.md) |
| giai-phap | Giải pháp & Dịch vụ | §5.4, §14; ND02, ND09 | [thaydoi.md](giai-phap/thaydoi.md) |
| chuyen-giao | Chuyển giao công nghệ | §5.5, §11; ND01, ND09 | [thaydoi.md](chuyen-giao/thaydoi.md) |
| dao-tao | Đào tạo & Tập huấn | §6–7, §10–11; ND03, ND05 | [thaydoi.md](dao-tao/thaydoi.md) |
| du-an | Dự án tiêu biểu | §5.6, §14; ND09 | [thaydoi.md](du-an/thaydoi.md) |
| tin-tuc | Tin tức, sự kiện, newsroom | §8, §10; ND04 | [thaydoi.md](tin-tuc/thaydoi.md) |
| lien-he-lead | Liên hệ, biểu mẫu, lead/CRM tương lai | §11–12, §15; ND05, ND10 | [thaydoi.md](lien-he-lead/thaydoi.md) |
| cms-workflow | CMS, xuất bản, quản lý nội dung | §10, §14; ND06, ND09 | [thaydoi.md](cms-workflow/thaydoi.md) |
| iam-access | IAM, người dùng, phiên đăng nhập, RBAC | §10.1, §13; ND06, ND07 | [thaydoi.md](iam-access/thaydoi.md) |
| media-r2 | Media & tài liệu đính kèm | §5.3, §8, §10, §13; ND02, ND07 | [thaydoi.md](media-r2/thaydoi.md) |
| seo-search | Tìm kiếm, SEO, đo lường | §12–13; ND08 | [thaydoi.md](seo-search/thaydoi.md) |
| platform-release | Hạ tầng, D1, vận hành, release | §13, §15, §17; ND07, ND10 | [thaydoi.md](platform-release/thaydoi.md) |

**Lưu ý:** các đường dẫn source trong nhật ký là vị trí tham chiếu được phát hiện ở phiên bản GitHub hiện tại, **không tự động chứng minh mọi yêu cầu trong đề cương đã hoàn thành**.
