# Tin tức, sự kiện, newsroom — thaydoi.md

**Module:** `tin-tuc` | **Status:** OPEN_CHANGE_LOG | **SRS integration:** PENDING USER SIGN-OFF

**Nguồn tham chiếu:** Đề cương chi tiết IAICT 2026, §8, §10; ND04. Chỉ là tham chiếu về yêu cầu; chưa tự coi là SRS đã được duyệt.

**Đối chiếu code hiện có (cần kiểm tra theo commit, không mặc nhiên nghiệm thu):** `app/(public)/tin-tuc/page.tsx`, `app/admin/news/page.tsx`, `docs/V16_NEWS_INGESTION_WORKSTREAM.md`.

## Nhật ký thay đổi

| CHG ID | Ngày | Mô tả ngắn | Trạng thái | PR/Commit | Test/Run | Quyết định đưa vào SRS |
|---|---|---|---|---|---|---|
| CHG-TIN-TUC-20261031-01 | 2026-10-31 | Khởi tạo nhật ký theo phân hệ để tập hợp thay đổi; cần đối chiếu lịch sử implementation trước khi nhập các thay đổi cũ | RECORDED — DOCUMENTATION ONLY | PR #36 | NOT_RUN — không có thay đổi runtime | CHƯA_CHỐT |

| CHG-TIN-TUC-20261031-02 | 2026-10-31 | Ghi nhận thiết kế nguồn tin/duyệt tin V16 | PROPOSED (đúng phạm vi) | PR #36 / docs gốc | Chi tiết bên dưới | CHƯA_CHỐT |

| CHG-TIN-TUC-20261103-01 | 2026-11-03 | API ingest Newsroom fail-closed JSON và bằng chứng lifecycle tin thật trên SQLite migration gốc | IMPLEMENTED / LOCAL_TEST_PASS / HOSTED_E2E_NOT_RUN | Issue #81 · PR #82 | CMS-NEWS-001..004 · RUN-CMS-20261103-04/05 | CHƯA_CHỐT |

## Thay đổi chi tiết

### CHG-TIN-TUC-20261031-01 — Khởi tạo sổ theo dõi phân hệ
- **Trạng thái:** RECORDED — DOCUMENTATION ONLY, không phải bằng chứng feature đã được triển khai hay chủ dự án đã phê duyệt.
- **Trước:** chưa có sổ `thaydoi.md` riêng trong repository cho phân hệ này.
- **Sau:** sử dụng file này làm bản ghi thay đổi liên tục, tách khỏi `docs/requirements/SRS.md`.
- **Phạm vi:** quản trị tài liệu, không thay đổi API, D1, UI, quyền, bảo mật hay production.
- **Nguồn:** yêu cầu trực tiếp của chủ dự án ngày 31/10/2026; đề cương (§8, §10; ND04).
- **Quyết định/SRS:** CHƯA_CHỐT; không cập nhật SRS cho tới khi có yêu cầu chốt.
- **Test:** NOT_RUN/NO_RUNTIME_CHANGE; chỉ xác minh cấu trúc file, link và CI tài liệu ở PR.

### CHG-TIN-TUC-20261031-02 — Ghi nhận thiết kế nguồn tin/duyệt tin V16
- **Status:** PROPOSED / BACKFILL_PENDING, **không coi là live staging PASS**; **SRS:** CHƯA_CHỐT.
- **Trước → Sau:** tài liệu kỹ thuật `docs/V16_NEWS_INGESTION_WORKSTREAM.md` mô tả pipeline từ nguồn → normalize/dedupe → pending/edit → approve → publish/provenance; mặc định auto-publish OFF.
- **Nguồn:** tài liệu V16, đề cương IAICT mục 8 và 10; phải đối chiếu code/schema và kiểm thử thực tế bằng news_admin/news_editor/news_reviewer ở task riêng.
- **Test:** NOT_RUN đối với nghiệm thu live role trong entry này. SRS impact PENDING.

### CHG-TIN-TUC-20261103-01 — Ingest input safety and actual source-to-public lifecycle QA

- **Nguồn:** [Issue #81](https://github.com/ntdung-tds/iaict-portal/issues/81), Owner paused IAM 03/11/2026 and approved Portal CMS/Newsroom execution sequence.
- **Trước:** API `app/api/admin/news/ingest/route.ts` assumed `request.json()` was a non-null object. JSON `null` caused an unintended exception/HTTP 500 and malformed JSON was mapped to 500. CMS private response cache policy was implicit. Existing `lib/news-repository.test.ts` checked publication statement shape using a fake D1 and other Newsroom tests covered policy/lease calculations; no one actual-SQL migration lifecycle suite joined source adapter, ingest, duplicate, review CAS, publication/provenance, public queries and CMS archival.
- **Sau:** ingestion POST validates Content-Type and JSON object type; malformed body/missing sourceId now consistently 400, unauthorized role 403 (unchanged access control), and all private success/error responses explicitly `Cache-Control: no-store`. New `lib/newsroom-lifecycle.sqlite.test.ts` uses original Core+V16 Newsroom+V17 CMS SQLite migration sources, actual RSS parser and route, D1 transaction/trigger semantics and real public queries with **only test actor and upstream RSS HTTP mocked**.
- **Acceptance:** `CMS-NEWS-001` ingest→dedup→manual approve→publish exactly once→public visible→CMS archive→public hidden; `CMS-NEWS-002` stale review decision, stale publish and re-publish refused without side effects; `CMS-NEWS-003` malformed request/role; `CMS-NEWS-004` upstream HTTP 503 failure recorded with zero public article.
- **Evidence:** `RUN-CMS-20261103-03` (CI pending); non-sensitive synthetic data only. Does **not** prove deployed Worker, actual external feed HTTP, Cloudflare Access-authenticated browser or production readiness. Existing policy default OFF, claim CAS and scheduler lease code not duplicated or changed.
- **Rollback:** revert isolated reviewed PR if new content-type requirement breaks a legitimate client; continue to protect privileged routes. No D1 migration, Worker deployment, cloud identity change, secret, IAM code, SRS baseline update or production write.
- **SRS:** remains FROZEN and CHƯA_CHỐT; changes stay in per-module log until owner explicitly decides to reconcile.

**Thực thi thực tế 03/11/2026:** Ở SHA đầu `2a8c257`, một test dữ liệu mẫu thất bại vì mock RSS dùng lại `Response` đã đọc (`RUN-CMS-20261103-04`), không có bằng chứng lỗi sản phẩm. Sau sửa fixture thành response mới mỗi lần gọi ở SHA `32d849113d2953997ada4dc9bfa584741b0e8935`, [portal-ci #41575415530](https://github.com/ntdung-tds/iaict-portal/actions/runs/41575415530) **4/4 PASS, 589/589 Vitest, 38/38 local Chromium**; [staging public #41575415524](https://github.com/ntdung-tds/iaict-portal/actions/runs/41575415524) **24/24 Chromium + 24/24 HTTP PASS**, không quan sát 503/5xx/network errors. `RUN-CMS-20261103-05`. Các test Newsroom mới chạy route/repository/RSS và D1 SQLite schema thật **với actor/fetch mock**, không phải môi trường staging đã triển khai code mới; 8-role Access-authenticated và live external RSS **NOT_RUN**. QA registry hiện có 103 case. Chờ CI final docs SHA và merge; SRS FROZEN.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-TIN-TUC-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
