# CMS, xuất bản, quản lý nội dung — thaydoi.md

**Module:** `cms-workflow` | **Status:** OPEN_CHANGE_LOG | **SRS integration:** PENDING USER SIGN-OFF

**Nguồn tham chiếu:** Đề cương chi tiết IAICT 2026, §10, §14; ND06, ND09. Chỉ là tham chiếu về yêu cầu; chưa tự coi là SRS đã được duyệt.

**Đối chiếu code hiện có (cần kiểm tra theo commit, không mặc nhiên nghiệm thu):** `app/admin/page.tsx`, `app/admin/content/[module]/page.tsx`, `docs/CMS_V17_D1_ATOMIC_USERS_2026-10-30.md`.

## Nhật ký thay đổi

| CHG ID | Ngày | Mô tả ngắn | Trạng thái | PR/Commit | Test/Run | Quyết định đưa vào SRS |
|---|---|---|---|---|---|---|
| CHG-CMS-WORKFLOW-20261031-01 | 2026-10-31 | Khởi tạo nhật ký theo phân hệ để tập hợp thay đổi; cần đối chiếu lịch sử implementation trước khi nhập các thay đổi cũ | RECORDED — DOCUMENTATION ONLY | PR #36 | NOT_RUN — không có thay đổi runtime | CHƯA_CHỐT |

| CHG-CMS-WORKFLOW-20261031-02 | 2026-10-31 | Ghi user/role/revision/audit nguyên tử | IMPLEMENTED/TESTED (đúng phạm vi) | PR #36 / docs gốc | Chi tiết bên dưới | CHƯA_CHỐT |

| CHG-CMS-WORKFLOW-20261103-01 | 2026-11-03 | Bảo vệ API CMS articles trước JSON không hợp lệ và cache nội dung quản trị | PROPOSED / CODED / CI_PENDING | Issue #79 · PR PENDING | CMS-ART-001/002 · RUN-CMS-20261103-01 | CHƯA_CHỐT |

## Thay đổi chi tiết

### CHG-CMS-WORKFLOW-20261031-01 — Khởi tạo sổ theo dõi phân hệ
- **Trạng thái:** RECORDED — DOCUMENTATION ONLY, không phải bằng chứng feature đã được triển khai hay chủ dự án đã phê duyệt.
- **Trước:** chưa có sổ `thaydoi.md` riêng trong repository cho phân hệ này.
- **Sau:** sử dụng file này làm bản ghi thay đổi liên tục, tách khỏi `docs/requirements/SRS.md`.
- **Phạm vi:** quản trị tài liệu, không thay đổi API, D1, UI, quyền, bảo mật hay production.
- **Nguồn:** yêu cầu trực tiếp của chủ dự án ngày 31/10/2026; đề cương (§10, §14; ND06, ND09).
- **Quyết định/SRS:** CHƯA_CHỐT; không cập nhật SRS cho tới khi có yêu cầu chốt.
- **Test:** NOT_RUN/NO_RUNTIME_CHANGE; chỉ xác minh cấu trúc file, link và CI tài liệu ở PR.

### CHG-CMS-WORKFLOW-20261031-02 — Ghi user/role/revision/audit nguyên tử
- **Status:** IMPLEMENTED + TESTED trong mã / SQLite mô phỏng theo báo cáo v17; live role-based staging chưa nghiệm thu; **SRS:** CHƯA_CHỐT.
- **Trước → Sau:** thay vì cập nhật từng phần gây sai lệch khi D1 gặp lỗi, tài liệu `docs/CMS_V17_D1_ATOMIC_USERS_2026-10-30.md` mô tả gom write vào `db.batch`; kiểm soát last-admin và rollback khi insert role/audit thất bại.
- **Bằng chứng lịch sử:** [CI 316/316](https://github.com/ntdung-tds/iaict-portal/actions/runs/40920542386), browser Chromium thời điểm đó dùng mock API. Mã hiện hành và D1 remote cần xác minh trong run khác trước khi tuyên bố nghiệm thu đầy đủ.
- **Test:** IAM-USER-005/011/012 (integration); IAM-USER-017/018 vẫn NOT_RUN cho live-role scenarios.
- **Tác động:** người dùng CMS, phân quyền, audit, D1 transaction; SRS impact PENDING.

### CHG-CMS-WORKFLOW-20261103-01 — Article API input shape and private cache boundary
- **Nguồn:** owner request 03/11/2026 to move from IAM (PAUSED) to Portal/CMS source audit and small tested implementation; [Issue #79](https://github.com/ntdung-tds/iaict-portal/issues/79).
- **Trước:** article POST/DELETE called `request.json()` and assumed object shape. `null`, arrays, numeric `id` or syntactically invalid JSON could surface a server-side 500 rather than a client validation 4xx. Article private GET and mutation responses lacked an explicit `Cache-Control: no-store` header.
- **Sau (source, CI pending):** shared JSON content-type/shape/field-type reader for POST/DELETE; expected invalid inputs return HTTP 400 before D1 write. All protected article GET/POST/DELETE success/error responses explicitly use `Cache-Control: no-store`.
- **Boundary:** preserve existing role checks, article/category business rules, D1 batch/CAS, Content/Newsroom permissions and public caching; no IAM code, D1 migration, Cloudflare Access or production change.
- **Test:** `CMS-ART-001`, `CMS-ART-002`; `lib/cms-articles-atomic.test.ts` Node SQLite original schema / mocked actor. [RUN-CMS-20261103-01](../../qa/IAICT_TEST_RUNS.md) must carry exact SHA after CI; live authenticated CMS E2E **NOT_RUN**.
- **Risk/rollback:** reject previously permissive text/plain JSON clients (intentional API guard); rollback by reverting reviewed PR if a legitimate client depends on it; preserve old tests and UI behavior.
- **SRS:** FROZEN / CHƯA_CHỐT; do not promote this engineering hardening into baseline without owner decision.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-CMS-WORKFLOW-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.

**Execution follow-up for CHG-CMS-WORKFLOW-20261103-01:** At reviewed source `979a1b41b53ba54ffc99e2586910a803592e3a1a`, [portal-ci 41568024341](https://github.com/ntdung-tds/iaict-portal/actions/runs/41568024341) **4/4 PASS / 585/585 Vitest / 38/38 local Chromium** including new route regression; [live-public staging 41568024151](https://github.com/ntdung-tds/iaict-portal/actions/runs/41568024151) **24/24 Chromium + 24/24 HTTP PASS** on the older deployed Worker. `RUN-CMS-20261103-02`, `CMS-ART-001/002`; CI on evidence-commit head remains pending. No hosted authenticated API E2E. SRS remains FROZEN/CHƯA_CHỐT.

 
### CHG-CMS-WORKFLOW-20261105-01 — Menu CMS mở rộng/thu gọn trên mobile và desktop

- **Yêu cầu thực tế:** ảnh chụp từ chủ dự án cho thấy thanh điều hướng CMS bị thu hẹp, chỉ hiện IA/LL/DA/SK/CG, khiến không nhìn thấy chữ chức năng. Đã xác nhận thao tác upload thành công theo phản hồi của chủ dự án; không động đến upload, Media, auth hay database.
- **Thiết kế mới:** trên desktop rộng trên 900px, menu mặc định hiển thị tên đầy đủ và có nút thu gọn thành thanh biểu tượng; khi thu gọn vẫn có `aria-label` và `title` đầy đủ. Mobile/tablet tới 900px giữ thanh biểu tượng hẹp để nhường không gian nội dung; nút **Mở rộng menu CMS** mở ngăn kéo trên nền phủ tối để hiển thị mọi tên nhóm/chức năng; **Thu gọn menu CMS**, chạm nền, phím Escape, hoặc chọn mục điều hướng sẽ đóng menu. Trên mobile ngăn kéo không chiếm bố cục nội dung/không làm tràn chiều ngang. Có aria-expanded, aria-controls, focus-visible, reduced-motion.
- **Giữ nguyên:** vai trò Admin/Editor/Reviewer/Viewer và các vai trò News, danh sách và đường dẫn CMS, đăng nhập native, bảo mật API, upload Media, D1/R2/Access, nội dung public. Không thêm thư viện runtime; không thay đổi SRS chuẩn.
- **QA:** các test local Chromium dùng phiên admin giả lập được đánh dấu `[MOCK]` — kiểm tra 320/390/768 px, mở và thu bằng nút, phím Escape và backdrop, nhãn `Lịch lớp`/`Dự án`, desktop co/giãn và tên dễ tiếp cận. Tất cả test role hiện hành giữ nguyên. Không đánh đồng mock UI với đăng nhập Admin thực tế trên staging. Ghi run trong `docs/qa/IAICT_TEST_RUNS.md` sau khi có CI.
- **Trạng thái:** SOURCE IMPLEMENTED / CI PENDING / STAGING DEPLOY NOT_RUN / PRODUCTION HOLD / **CHƯA_CHỐT SRS**.


**Execution follow-up for CHG-CMS-WORKFLOW-20261105-01 (2026-11-05):** Source [PR #120](https://github.com/ntdung-tds/iaict-portal/pull/120) merged as df9c89105dec81f2556dc1b9ee639b2cbfc91a9d; PR-head Portal CI [42055691436](https://github.com/ntdung-tds/iaict-portal/actions/runs/42055691436) PASS 4/4 including local mock admin menu tests at 320/390/768/1440 and compression overflow regression. Staging acceptance [42055691392](https://github.com/ntdung-tds/iaict-portal/actions/runs/42055691392) PASS; three postmerge workflows completed SUCCESS. Cloudflare Workers Builds 475f3569-1a79-4390-b8d4-5e54763a9d74 deployed staging Worker version b8da158b-3673-46f1-befa-8f6917e74abb (100%, new CMS JS asset confirmed available from live Chrome). Build automation returned to HOLD. Actual signed-in menu E2E remains NOT_RUN because agent lacks a genuine Admin session; no production, D1, R2 or login change. [RUN-CMS-NAV-20261105-01](../../qa/IAICT_TEST_RUNS.md). **SRS CHƯA_CHỐT**.


### CHG-CMS-WORKFLOW-20261106-01 — Bảo vệ dữ liệu phiên CMS và kiểm thử chéo phân quyền

- **Bối cảnh:** Chủ dự án đã đăng nhập thành công trên staging và đồng ý gộp rà soát CMS, Media và vai trò. Rà soát source phát hiện API GET /api/admin/cms/session trả actor email/vai trò nhưng không đặt nhất quán Cache-Control: no-store trong các nhánh 200/401/403/500; đường lỗi bất thường trả nguyên thông điệp nội bộ.
- **Điều chỉnh source:** luôn trả `Cache-Control: private, no-store, max-age=0` và `X-Content-Type-Options: nosniff` ở tất cả các nhánh session; lỗi truy xuất nội bộ trả mã ổn định `CMS_SESSION_UNAVAILABLE` (HTTP 503), không để lộ lỗi D1. Không thêm cookie, không thay đổi cấu trúc actor trả về khi thành công, thời gian sống phiên, đăng nhập, phân quyền hay vai trò.
- **Kiểm thử:** `CMS-UI-003` (response 200/401/403/503, no-store, không lộ lỗi nội bộ) và `CMS-UI-004` (ma trận 7 vai trò, 6 nhóm quyền, 42 tổ hợp quyền từ chối/cấp hợp lệ); thêm kiểm thử staging thực tế với request không xác thực vào API quản lý người dùng/bài viết/Media/Newsroom để khẳng định HTTP 401 trước mọi đột biến dữ liệu. Test vai trò chạy ở local với actor đã mô phỏng sau xác minh; **không thay cho phiên đăng nhập thật của từng vai trò**.
- **Không thay đổi:** CMS UI, Media upload/dữ liệu, Access policy, D1 schema, R2, production, baseline SRS. Thay đổi nhỏ theo hướng fail-closed bảo mật; SRS FROZEN/CHƯA_CHỐT.
- **Trạng thái:** SOURCE+TESTS IMPLEMENTED; CI / live staging sau deploy cần ghi rõ kết quả từng công đoạn, không báo thành công trước khi test.
