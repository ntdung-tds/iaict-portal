# IAICT Portal — Nghiệm thu đăng nhập Cloudflare Access thật (Staging)

**Trạng thái: CHỈ CHUẨN BỊ, CHƯA PHÁT HÀNH WORKER.** Tài liệu này không cấp phép deploy, merge hoặc thay đổi D1/production. Chạy bộ test chỉ sau khi người phụ trách phê duyệt bản Worker staging và xác minh HEAD/Worker version đúng release candidate.

## 1. Yêu cầu bắt buộc

- Đã triển khai **đúng bản CMS/JWT release candidate được phê duyệt** lên `https://iaict-portal-staging.iaict-platform.workers.dev`. Không chạy bản test này để tuyên bố mã mới đạt khi Worker vẫn là phiên bản cũ.
- Chạy preflight chỉ đọc: `IAICT_EXPECTED_STAGING_WORKER_VERSION=<UUID-đã-đối-chiếu> node scripts/verify-staging-release.mjs` với Cloudflare token **quyền đọc cần thiết** được thiết lập cục bộ. Không nhập token vào GitHub, tệp báo cáo hoặc cuộc trò chuyện.
- Đã xác minh đúng Access AUD staging và đủ bốn đường dẫn `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*`. Browser ẩn danh vẫn phải nhận chuyển hướng tới Access.
- Cần tài khoản có phiên Cloudflare Access hợp lệ **và** đúng role đang hoạt động trong D1. Hiện staging mới có một tài khoản global admin đang hoạt động; các role còn lại chưa có tài khoản thật để nghiệm thu. Không tự tạo người dùng hoặc gán quyền vào D1 staging khi chưa được duyệt.

## 2. Lưu phiên đăng nhập ngoài repository

Thao tác **trực tiếp trên máy riêng của người kiểm thử**; KHÔNG tải lên GitHub, Google Drive, ảnh chụp hay gửi cookie, JWT, mật khẩu, email tài khoản vào báo cáo.

```bash
mkdir -p "$HOME/.config/iaict-portal"
chmod 700 "$HOME/.config/iaict-portal"
npx playwright codegen \
  --save-storage="$HOME/.config/iaict-portal/staging-access-state.json" \
  "https://iaict-portal-staging.iaict-platform.workers.dev/admin"
# Đăng nhập qua Cloudflare Access rồi đóng codegen để lưu phiên.
chmod 600 "$HOME/.config/iaict-portal/staging-access-state.json"
```

**Không sử dụng storageState trong GitHub Actions/CI.** Session State có thể chứa HttpOnly `CF_Authorization` và phải được coi như mật khẩu. File phải là đường dẫn tuyệt đối, ngoài repository, và quyền file tối đa 0600 trên Linux/macOS. Không lưu ảnh, trace, video hoặc HTML report phiên CMS. Sau khi nghiệm thu, xóa tệp phiên theo quy định vận hành.

## 3. Chạy kiểm thử xác thực thật, chỉ đọc

Chỉ sau khi staging Worker mới được triển khai với **phê duyệt riêng**, người kiểm thử thiết lập các biến môi trường sau:

```bash
export IAICT_AUTH_ACCEPTANCE_APPROVED=staging-only
export IAICT_ACCESS_STORAGE_STATE="$HOME/.config/iaict-portal/staging-access-state.json"
export IAICT_EXPECTED_CMS_ROLES=admin
npx playwright test --config playwright.staging-authenticated.config.ts
```

`IAICT_EXPECTED_CMS_ROLES` phải khớp chính xác với vai trò gán trong D1. Có thể là một role hoặc một cặp role global CMS/Newsroom hợp lệ, ví dụ `editor,news_reviewer`. Không giả định Access `Allow` đồng nghĩa với CMS `admin`. Mỗi phiên đăng nhập được kiểm thử độc lập, không chuyển tiếp cookie giữa tài khoản.

Bài test chỉ gửi **GET** tới:
- `/api/admin/cms/session` — phiên Access thật được Worker xác thực JWT và ánh xạ đúng các role D1.
- `/api/admin/cms/overview`, `/api/admin/cms/articles` — quyền đọc CMS (global CMS role).
- `/api/admin/cms/users`, `/api/admin/cms/collection?module=leads&limit=1` — chỉ global admin được HTTP 200; vai trò khác phải nhận HTTP 403.
- `/api/admin/news/review?status=pending&limit=1`, `/api/admin/news/settings` — quyền đọc Newsroom tương ứng.
- `/api/health` — sức khỏe site.

Không kiểm thử bằng POST/PUT/DELETE trên dữ liệu thật; không ghi PII vào console, log, ảnh, video, traces. Kết quả report chỉ ghi mã HTTP, PASS/FAIL và danh sách nhóm quyền đã được phê duyệt.

## 4. Ba vòng kiểm tra chéo để ký nghiệm thu

1. **Source/Access/D1:** đối chiếu SHA release được phê duyệt, Worker version thực, Access destination/AUD, migration và role D1. Chỉ chạy script preflight đọc dữ liệu; không thay đổi hệ thống.
2. **Xác thực độc lập:** chạy `npm run verify` (JWT signature/rotation, 49 role-permission combinations, CMS/Newsroom unit); kiểm tra phiên thực bằng `playwright.staging-authenticated.config.ts` cho những vai trò có tài khoản được phép.
3. **Browser/Cloudflare:** chạy browser ẩn danh `npx playwright test --config playwright.staging.config.ts` để xác nhận Access redirect và public site. Đối chiếu lại Worker version + D1 sau nghiệm thu. Ảnh QA công khai chỉ lưu từng PNG vào [Google Drive](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3), không ZIP/GitHub Artifacts. Ảnh có phiên đăng nhập CMS **không được tạo**.

Nếu thiếu phiên thật cho role nào, ghi `NOT TESTED (no authorized identity)`, **không ghi PASS**. Không dùng bộ test giả lập để thay thế bước này.

## 5. Chốt nghiệm thu

Ghi rõ bản release SHA, Worker UUID trước/sau, 3 vòng kiểm tra, những role thực sự đã test, các role chưa test, lỗi và đường khôi phục Worker. Production vẫn bị chặn cho tới khi Access production có đủ exact `/admin`, `/api/admin`, và staging được phê duyệt đầy đủ. **Không triển khai tự động từ tài liệu này.**
