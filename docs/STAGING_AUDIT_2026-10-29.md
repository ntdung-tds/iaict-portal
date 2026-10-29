# IAICT Portal Staging — Biên bản rà soát kỹ thuật (lưu tạm)

> **Ngày kiểm tra:** 29/10/2026 (Asia/Ho_Chi_Minh).  
> **Phạm vi:** Cloudflare Worker `iaict-portal-staging` và repository `ntdung-tds/iaict-portal`.  
> **Mã nguồn đối chiếu:** nhánh `main` tại commit `a077777e500a0a152f647361f3cc2c3366c16c4f`.  
> **Trạng thái tài liệu:** kết quả rà soát bước đầu, **chưa phải nghiệm thu hoặc pentest**.  
> **Nguyên tắc:** READ-ONLY; không tự động thay đổi Cloudflare, dữ liệu, code production hoặc staging.

## A. Tóm tắt điều hành

Website staging được người vận hành xác nhận đang sử dụng ổn định. Các cuộc gọi **Cloudflare API GET** đã xác nhận Worker tồn tại, đang bật endpoint `workers.dev`, có deployment hiện hành và có binding D1. Mã nguồn có hệ thống public site, CMS, quản lý Media, phân quyền người dùng, Next.js/Vinext và CI. Tuy nhiên, **website hiển thị được không chứng minh luồng biên tập, lưu trữ và bảo mật đều đạt yêu cầu**.

Ưu tiên phân tích kỹ tiếp theo:
1. Toàn vẹn dữ liệu và ghi đồng thời trong CMS / users / Media.
2. Khả năng che khuất sự cố storage bởi cơ chế fallback.
3. Chứng minh backend lưu trữ đang được Worker sử dụng thực tế.
4. Đăng nhập, bảo vệ chống thử mật khẩu hàng loạt, phân quyền, phiên quản trị.
5. Khả năng quan sát lỗi, sức khỏe của dependencies, rollback.
6. Rà soát luồng chức năng đầu-cuối và SEO trên staging.

## B. Bằng chứng hạ tầng đã xác minh từ Cloudflare API

| Hạng mục | Bằng chứng / kết quả | Ý nghĩa / giới hạn |
|---|---|---|
| Worker | `iaict-portal-staging` | Tồn tại trên tài khoản Cloudflare đã kết nối |
| URL dự kiến | `https://iaict-portal-staging.iaict-platform.workers.dev` | Account Workers subdomain là `iaict-platform`; subdomain trên Worker đang bật |
| Deploy đang phân phối | Worker version **42**, tỷ lệ **100%** | Dữ liệu deployment API; không đại diện cho uptime/latency |
| Triển khai gần nhất | **2026-10-17T10:25:31Z** | Deployment source `cf_cli` |
| Compatibility | Date `2026-10-12`, flag `nodejs_compat` | Từ Worker settings |
| Bindings | `ASSETS` (assets), `DB` (D1) | Xác nhận bindings được gắn; chưa xác minh các truy vấn ứng dụng |
| D1 staging | Database `iaict-portal-staging-db` | D1 staging khác tên D1 production |
| Workers Observability issue summary | `activeIssues: 0`, `activeOccurrences: 0`, `resolvedIssues: 0` | **Không** đủ kết luận ứng dụng không lỗi: cần kiểm tra metrics, logs, coverage và sampling |

**Chưa xác minh:** HTTP latency theo percentile, số lượng 5xx/4xx, tỷ lệ lỗi có thể theo dõi, R2/Vercel Blob runtime credentials và trạng thái lưu trữ thực, chi tiết bảng D1, dữ liệu CMS, chi phí, trải nghiệm từ các thiết bị/mạng thực tế.

**Quan trọng:** Mã nguồn `main` tại thời điểm rà soát chưa được đối chiếu bit-by-bit hoặc qua commit artifact với Cloudflare Worker **version 42**. Mọi nhận định từ mã nguồn dưới đây là **phân tích code `main`**, chưa khẳng định bản đang chạy giống hệt.

## C. Các phát hiện và rủi ro từ rà soát mã nguồn

### F-01 — Nguy cơ mất cập nhật khi ghi đồng thời (Ưu tiên: CAO)

**Bằng chứng:** `lib/cms-store.ts` (`getCmsSnapshot`, `persistCmsState`), `lib/media-store.ts` (`getMediaSnapshot`, `persistMediaState`), `lib/admin-users.ts` (`getEditorialUserSnapshot`, `persistEditorialUsers`), `app/api/admin/content/route.ts`, `app/api/admin/media/route.ts`, `app/api/admin/users/route.ts`.

Dữ liệu được lưu thành một tệp JSON snapshot và cập nhật thông qua `put(..., {allowOverwrite: true})`. API sử dụng `expectedRevision` để phát hiện xung đột **trước** khi ghi. Tuy nhiên chưa thấy thao tác compare-and-swap hoặc giao dịch nguyên tử giữa kiểm tra revision và ghi đè. Hai request có thể cùng đọc một revision hợp lệ rồi ghi phiên bản mới lần lượt, làm mất cập nhật của request trước.

**Rủi ro đã xác định ở cấp thiết kế, chưa chứng minh có mất dữ liệu thực tế.** Kiểm thử hai phiên song song trên bản sao dữ liệu, kiểm tra xung đột; ưu tiên transaction/concurrency control thực thụ.

### F-02 — Storage failure có thể bị che bởi fallback (Ưu tiên: CAO)

**Bằng chứng:** `lib/cms-store.ts` (`getCmsSnapshot`), `lib/media-store.ts`, `lib/admin-users.ts`.

Khi đọc CMS storage bị lỗi, trả về trạng thái seed từ repository; `materialized: false` nhưng `storageReady: true` nếu token được cấu hình. Như vậy trang public có thể tiếp tục trả nội dung mặc định dù CMS không truy xuất được dữ liệu thực, và một số luồng ghi có thể tiếp tục nếu dựa duy nhất vào `storageReady`. Tương tự Media/Users fallback về trạng thái rỗng.

**Khuyến nghị:** phân biệt rõ `NOT_CONFIGURED`, `NOT_FOUND`, `CORRUPTED`, `READ_FAILED`; chỉ cho bootstrap dữ liệu trong điều kiện được kiểm soát. Trong lỗi đọc storage nên fail-closed cho các thao tác có thể ghi đè dữ liệu thật.

### F-03 — Cloudflare D1 hiện diện nhưng CMS vẫn phụ thuộc Vercel Blob (Ưu tiên: CAO)

**Bằng chứng:** Cloudflare bindings `DB`, `ASSETS` đã xác minh; mã nguồn `lib/cms-store.ts`, `lib/media-store.ts`, `lib/admin-users.ts`, `lib/admin-notifications.ts` dùng `@vercel/blob`; `docs/CLOUDFLARE_MIGRATION.md` mô tả giai đoạn chuyển đổi rồi mới đưa storage sang R2.

Không kết luận đây là lỗi — đây có thể là kiến trúc chuyển tiếp có chủ đích. Tuy vậy, cần chứng minh token trên Worker tương ứng, backup/restore và quy trình migration. **Không thực hiện migrate khi chưa xác nhận dữ liệu và kiểm tra phương án rollback.**

### F-04 — Login protection cần kiểm tra lớp chống brute-force (Ưu tiên: TRUNG BÌNH–CAO)

**Bằng chứng:** `app/api/admin/login/route.ts`, `lib/admin-auth.ts`.

Đã có cookie `HttpOnly`, `SameSite=Lax`, `Secure` trong `NODE_ENV=production`, session HMAC-SHA256 và so sánh chữ ký constant-time theo hash. Chưa thấy rate limiting trực tiếp trong route đăng nhập; **có thể** được bảo vệ ở Cloudflare WAF/Rules bên ngoài, chưa kiểm tra rules hoặc thử nghiệm giới hạn đăng nhập.

**Khuyến nghị:** rà soát WAF / Bot Management / rate limiting, kiểm thử không phá hoại bằng tài khoản staging riêng; bổ sung audit login và cảnh báo.

### F-05 — Health check mới kiểm tra liveness (Ưu tiên: TRUNG BÌNH–CAO)

**Bằng chứng:** `app/api/health/route.ts`.

Endpoint trả `status: "ok"` cùng version/environment và no-store nhưng không kiểm tra D1, CMS storage hay phụ thuộc khác. Vì vậy chỉ nên gọi đây là **liveness**. Nên có readiness check an toàn, không tiết lộ secrets và không phụ thuộc vào tác vụ ghi; metrics/alert cần cấu hình riêng.

### F-06 — Media validation và tính nhất quán khi xóa (Ưu tiên: TRUNG BÌNH)

**Bằng chứng:** `app/api/admin/media/route.ts`, `lib/media-store.ts`.

Có giới hạn tệp **8 MiB**, MIME allowlist JPEG/PNG/WebP/GIF/AVIF, yêu cầu alt text và chặn xóa Media còn được tham chiếu trong nội dung. Tuy vậy, kiểm tra MIME đang dựa vào `File.type`; cần xác minh magic bytes/decoder để phòng việc định dạng thật khác tên MIME. Khi xóa, manifest được lưu trước khi gọi xóa blob; nếu xóa blob thất bại thì metadata có thể đã mất tham chiếu. Cần quy trình reconciliation hoặc thao tác idempotent có thể retry.

### F-07 — URL chuẩn SEO có thể trỏ nhầm môi trường (Ưu tiên: TRUNG BÌNH)

**Bằng chứng:** `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`.

Dùng `NEXT_PUBLIC_SITE_URL` với fallback `https://iaict-demo.vercel.app`. Chưa kiểm tra giá trị biến trên Worker thực tế. Nếu thiếu/cấu hình sai, metadata, robots hoặc sitemap có thể trỏ qua Vercel khi truy cập workers.dev.

### F-08 — Độ phủ kiểm thử E2E chưa đủ cho CMS (Ưu tiên: TRUNG BÌNH)

**Bằng chứng:** `e2e/home.spec.ts` kiểm tra tuyến public, homepage, tìm kiếm, sitemap, health, redirect dashboard khi chưa xác thực. `.github/workflows/ci.yml` chạy TypeScript, unit tests, builds và Playwright E2E trên Next.js/Cloudflare runtime.

Chưa thấy E2E toàn bộ workflow gồm login hợp lệ, tạo/sửa bài, gửi duyệt, phân vai, xuất bản/hủy xuất bản, upload/xóa Media, revision collision, thông báo, phục hồi khi storage lỗi. Không đánh đồng **CI pass** với **nghiệm thu vận hành**.

## D. Những điểm tích cực có bằng chứng

- Có phân quyền `editor`, `reviewer`, `superadmin` và middleware/kiểm tra session ở các API quản trị đã xem.
- Mật khẩu tài khoản biên tập được dẫn xuất bằng `scrypt` và salt riêng, so sánh thời gian hằng.
- Session có chữ ký HMAC, thời gian sống 8 giờ, cookie HttpOnly/SameSite.
- Nội dung HTML biên tập qua `sanitize-html` với tag/attribute allowlist.
- Media có giới hạn dung lượng, loại tệp và phòng xóa tài nguyên đang sử dụng.
- CI có typecheck, tests, build, E2E; có staging và production Workers riêng.
- D1 staging và production tồn tại riêng biệt trên Cloudflare.

Những điểm này **không loại trừ** lỗi logic hoặc cấu hình runtime; cần kiểm thử.

## E. Kế hoạch kiểm tra từng phần và tiêu chuẩn kết thúc

| Giai đoạn | Nội dung | Điều kiện nghiệm thu | Trạng thái |
|---|---|---|---|
| 1 | Cloudflare account, Worker, D1 binding, deployment | Xác nhận account/Worker/version/binding; xác minh khác biệt giữa code và deploy | **Sơ bộ**; chưa đối chiếu artifact |
| 2 | CMS / Users / Media storage | Kiểm thử đọc/ghi/khôi phục an toàn, bản sao dữ liệu, mô phỏng xung đột | Chưa |
| 3 | Authentication, RBAC, WAF | Kiểm thử phân vai, session timeout, rate limit, CSRF và quyền API | Chưa |
| 4 | Nội dung, workflow, audit | Biên tập–duyệt–đăng–hủy–lập lịch, kiểm toán, rollback | Chưa |
| 5 | Media | MIME thực, upload/delete, link integrity, object reconciliation | Chưa |
| 6 | Public site / UX / SEO | Kiểm tra tất cả trang, responsive, accessibility, SEO, search | Chưa |
| 7 | Vận hành, monitoring, backup | Health readiness, metrics, 5xx, alerts, restore drill | Chưa |
| 8 | Regression và nghiệm thu | E2E đa người dùng, load, vulnerability review, release checklist | Chưa |

## F. Nguyên tắc thay đổi sau khi lưu biên bản

1. **Không triển khai hoặc thay đổi production** `iaict-portal` khi chưa được yêu cầu riêng.
2. **Không chỉnh sửa staging** khi chưa sao lưu và rà soát tác động.
3. **Không đọc hoặc in secrets**, mật khẩu, dữ liệu nội dung riêng tư vào báo cáo; chỉ kiểm tra sự tồn tại và phạm vi quyền nếu cần.
4. Mỗi cải tiến: tạo nhánh riêng → PR → CI/E2E → thử trên staging → đánh giá → quyết định merge/deploy.
5. Lưu dấu vết evidence (file path, commit SHA, Cloudflare version, thời điểm, test result) và cập nhật từng phát hiện: `open` / `verified` / `fixed` / `regression-pass`.
6. Nếu trang hiện đang vận hành ổn, ưu tiên thay đổi **có khả năng rollback**, không làm gián đoạn website.

## G. Nguồn bằng chứng đối chiếu (tại thời điểm lập báo cáo)

**Cloudflare API (READ-ONLY):**
- GET `/accounts`
- GET `/accounts/{account_id}/workers/subdomain`
- GET `/accounts/{account_id}/workers/scripts/iaict-portal-staging/settings`
- GET `/accounts/{account_id}/workers/scripts/iaict-portal-staging/subdomain`
- GET `/accounts/{account_id}/workers/scripts/iaict-portal-staging/deployments`
- GET `/accounts/{account_id}/workers/scripts/iaict-portal-staging/versions`
- GET `/accounts/{account_id}/workers/scripts/iaict-portal-staging/versions/{version_id}`
- GET `/accounts/{account_id}/d1/database`
- GET `/accounts/{account_id}/workers/observability/issues/summary`

**GitHub `main`:**
- `package.json`, `wrangler.jsonc`, `cloudflare.config.ts`
- `lib/admin-auth.ts`, `lib/admin-users.ts`, `lib/cms-store.ts`, `lib/media-store.ts`, `lib/admin-notifications.ts`, `lib/content-html.ts`
- `app/api/admin/login/route.ts`, `app/api/admin/content/route.ts`, `app/api/admin/media/route.ts`, `app/api/admin/users/route.ts`, `app/api/admin/notifications/route.ts`, `app/api/health/route.ts`
- `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`
- `e2e/home.spec.ts`, `.github/workflows/ci.yml`, `.github/workflows/deploy-staging.yml`, `docs/CLOUDFLARE_MIGRATION.md`.

**Chưa thực hiện trong đợt rà soát này:** thay đổi config/secret, deploy, write database/storage, synthetic login, load test, browser-based screenshot audit, Cloudflare analytics percentile, full repository code review, hoặc chạy test suite cục bộ.

---

*Tài liệu này được lưu nhằm bảo toàn kết quả rà soát trước khi phát triển tiếp; cập nhật khi có thêm bằng chứng thực tế. Không phải xác nhận rằng production hoặc staging đã đạt nghiệm thu.*
