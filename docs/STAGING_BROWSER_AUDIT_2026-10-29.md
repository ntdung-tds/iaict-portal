# IAICT Portal staging — Kiểm thử trình duyệt thực tế

**Ngày kiểm thử:** 29/10/2026 (giờ Việt Nam).  
**Môi trường:** `https://iaict-portal-staging.iaict-platform.workers.dev/` — Cloudflare Worker staging v42.  
**Nguyên tắc:** chỉ đọc; Chromium public pages, tìm kiếm, điều hướng và HTTP GET; không đăng nhập, POST, gửi form, ghi D1 hoặc deploy.  
**Bằng chứng CI:** [Playwright live acceptance run #40912677049 — 6/6 PASS](https://github.com/ntdung-tds/iaict-portal/actions/runs/40912677049), [run #40913254166 — 9/9 PASS](https://github.com/ntdung-tds/iaict-portal/actions/runs/40913254166).  
**Nhánh bổ sung acceptance test:** `fix/cms-v17-publish-crm-guards-20261029` (PR #8, base `cms/v17-full-admin`); PR vẫn draft, không merge/deploy.

## 1. Phương pháp và kết quả

Đã thực hiện trình duyệt thực tế theo hai cách:
- **Cloudflare Browser Rendering (Chromium)**: truy cập staging thật, render và trích xuất DOM, chụp ảnh mobile 390 × 844 px. Cloudflare Browser Rendering API đôi khi trả `HTTP 429` do quota/rate limit của chính dịch vụ rendering; đây không phải bằng chứng lỗi website staging.
- **GitHub Actions + Playwright Chromium**: `npx playwright test --config playwright.staging.config.ts` với `STAGING_BASE_URL` trỏ staging thật. Lần chạy cuối cùng 29/10/2026 **9/9 PASS trong 55,4 giây**, log chi tiết có kết quả từng test; không sử dụng mô phỏng site.

### 9 kiểm thử đã đạt

| ID | Kịch bản | Kết quả |
|---|---|---|
| B-01 | `/api/health` và public news workflow endpoint | PASS |
| B-02 | `/admin/news` và `/api/admin/news/settings` bị Cloudflare Access bảo vệ | PASS |
| B-03 | 12 tuyến công khai trả về document và hiện `#main-content`, `h1` | PASS |
| B-04 | 5 tuyến trọng yếu ở 320, 390, 768 px không tràn ngang | PASS |
| B-05 | Trang tìm kiếm hydrate, tìm được dự án `/du-an/tram-rung` | PASS |
| B-06 | API tin tức, trang danh sách/chi tiết đã xuất bản và thông tin nguồn tin | PASS |
| B-07 | Menu mobile mở và click điều hướng đến `/gioi-thieu` | PASS |
| B-08 | Nhập `Trâm rừng`, Enter, URL query và kết quả hiển thị | PASS |
| B-09 | Dù route `/admin` hiện shell, API `/api/admin/cms/overview` không cho truy cập ẩn danh | PASS |

**12 tuyến công khai B-03:** `/`, `/gioi-thieu`, `/san-pham-nen-tang`, `/giai-phap-dich-vu`, `/chuyen-giao-cong-nghe`, `/dao-tao-tap-huan`, `/dao-tao-tap-huan/co-quan-nha-nuoc`, `/du-an`, `/du-an/tram-rung`, `/tin-tuc`, `/lien-he`, `/tim-kiem`.

**Responsive B-04:** `/`, `/tim-kiem`, `/tin-tuc`, `/du-an/tram-rung`, `/lien-he`; 3 viewport widths × 5 routes = 15 kiểm tra tràn ngang. Các kích thước khác, Lighthouse và thiết bị phần cứng thật chưa được kiểm.

## 2. Phát hiện trực tiếp từ trình duyệt

### UI-01 — Tương phản tiêu đề hero trang Tìm kiếm quá thấp (ƯU TIÊN CAO CHO UX/A11Y)

**Bằng chứng:** ảnh chụp bằng Cloudflare Browser Rendering tại `/tim-kiem`, viewport 390 × 844, cho thấy tiêu đề lớn màu xanh đen trên nền hero xanh đậm, khó đọc rõ. Phân tích CSS xác định nguyên nhân:

- `app/globals.css`: `:root --ink-strong: #071c2e`, khai báo toàn cục `h1 { color: var(--ink-strong); }`.
- `components/public.module.css`: `.hero { color:#fff; background:#073f45 }` nhưng `.hero h1` không đặt color. Do `h1` có màu riêng, nó **không kế thừa** `color:#fff` từ `.hero`.
- Độ tương phản lý thuyết của hai màu fallback `#071c2e` và `#073f45` xấp xỉ **1,49:1**, dưới mức 3:1 tối thiểu cho chữ lớn theo WCAG AA (với nền ảnh thật, tương phản thay đổi theo điểm ảnh).

**Khuyến nghị:** đặt `.hero h1 { color: #fff; }` tại stylesheet scoped `components/public.module.css`, rà soát các hero tối khác, thêm kiểm thử A11y/computed color và screenshot trước/sau. **Chưa triển khai bản sửa.**

### SEC-01 — `/admin` chưa được Cloudflare Access bảo vệ ở edge (TRUNG BÌNH)

**Bằng chứng:** GitHub Actions Playwright GET không credential:
- `/admin` → **HTTP 200**, hiển thị CMS shell và thông điệp “Đang xác định tài khoản”.
- `/api/admin/cms/overview` → **HTTP 302** chuyển sang Cloudflare Access.
- `/admin/news` → Cloudflare Access.
- Cloudflare Access app staging đang cấu hình `/admin/*` và `/api/admin/*`; đường dẫn **`/admin` không có dấu gạch cuối** không nhất thiết nằm trong pattern `/admin/*`.

**Đánh giá:** hiện không có bằng chứng dữ liệu riêng tư bị lộ hay vượt qua phân quyền API. Tuy nhiên route shell `/admin` công khai rộng hơn ý định “bảo vệ toàn bộ CMS”. Nên bổ sung bảo vệ edge cho cả `/admin`, kiểm tra lại path exact và wildcard; tiếp tục giữ xác thực từng API, không phụ thuộc duy nhất vào menu/redirect UI. **Chưa sửa Access policy.**

### SEO-01 — Tiêu đề HTML trang chủ bị lặp (THẤP)

**Bằng chứng:** DOM thực tế tại `/`: `<title>IAICT | IAICT</title>`. Nên đổi title mặc định để không lặp với template suffix mà vẫn giữ nhận diện thương hiệu.

### CRM-01 — Trang Liên hệ chưa có biểu mẫu trực tuyến (GHI NHẬN, KHÔNG XEM LÀ LỖI)

DOM trang `/lien-he` không có `<form>`, `<input>`, `<textarea>`. Mã nguồn `app/(public)/lien-he/page.tsx` có ghi chú chủ đích chỉ thu dữ liệu khi backend và bảo vệ dữ liệu đã qua kiểm chứng. Đây là trạng thái triển khai có chủ đích, phù hợp với định hướng chuẩn bị mở CRM; không thử gửi dữ liệu.

## 3. Những gì PASS chưa chứng minh

- Chưa thực hiện đăng nhập thật vào CMS qua Cloudflare Access; chưa kiểm thử CRUD UI/admin đúng phân vai.
- Chưa chạy thử các bản vá PR #8 trên Worker staging — live test vẫn đang kiểm tra **Worker v42 đang chạy từ 17/10**.
- Chưa audit console/network errors của mọi trang, Lighthouse, WCAG toàn diện hoặc đối chiếu screenshot mọi kích thước.
- Chưa kiểm thử các tình huống tải cao, race conditions D1, failpoint transaction hay end-to-end workflows liên quan dữ liệu thật.
- Không thay đổi cấu hình hoặc thực hiện thử nghiệm ghi lên staging/production.

## 4. Khuyến nghị ưu tiên

1. Sửa lỗi tương phản tiêu đề hero tối `/tim-kiem`, kiểm tra cùng pattern trên các trang khác; verify visual regression.
2. Bổ sung bảo vệ Access cho `/admin` exact root và thử lại GET ẩn danh; không làm ảnh hưởng API.
3. Làm sạch title metadata trang chủ; thêm smoke test SEO.
4. Nghiệm thu PR #8 ở môi trường sandbox / staging riêng trước khi merge; kiểm tra phân quyền publish/editor và CRM PII.
5. Chuẩn bị quy trình CMS/CRM đăng nhập và dữ liệu giả để kiểm thử admin UI đầu-cuối.
6. Chỉ triển khai production sau khi staging được nghiệm thu và có xác nhận riêng.

**Kết luận:** 9/9 kiểm thử trình duyệt trên website công khai đã PASS; có 2 điểm chất lượng/bảo vệ phạm vi đường dẫn cần cải thiện, không làm sai lệch số liệu PASS của kịch bản hiện hành.
