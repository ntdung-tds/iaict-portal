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

| CHG-TIN-TUC-20261103-02 | 2026-11-03 | Rà soát lại Newsroom: chặn chuyển hướng không tin cậy và giới hạn dữ liệu RSS/HTML khi truyền theo luồng | CODED / LOCAL_PASS / DEPLOY_NOT_RUN | Issue #81 · PR #83 | CMS-NEWS-005/006 · RUN-CMS-20261103-06/07 | CHƯA_CHỐT |

| CHG-TIN-TUC-20261103-03 | 2026-11-03 | Rà soát 2 vòng: giới hạn cổng HTTPS nguồn RSS, ký tự XML lỗi và hủy stream không chặn xử lý | CODED / LOCAL_PASS / HOSTED_NOT_RUN | Issue #81 · PR #84 | CMS-NEWS-007..009 · RUN-CMS-20261103-08/09 | CHƯA_CHỐT |

| CHG-TIN-TUC-20261103-04 | 2026-11-03 | Vòng lặp rà soát Newsroom: phân biệt href thật và nguồn HTML ẩn trước khi nhập tin | CODED / CI_PENDING | Issue #81 · PR PENDING | CMS-NEWS-010..013 · RUN-CMS-20261103-10 | CHƯA_CHỐT |

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


### CHG-TIN-TUC-20261103-02 — External source fetching: redirects and bounded streaming

- **Review source:** post-merge PR #82 at `1bf71d4dccc3cb43454202b104b217bd61990bad`; user requested a second independent review on 03/11/2026.
- **Finding 1:** `lib/news-source-adapters.ts` accepted automatic HTTP redirects (`redirect: "follow"`). The configured seed feed host is allowed, but an upstream 3xx `Location` could lead to a foreign/unsafe host without validation before fetch. Candidate links are allowlisted, yet response-redirect destinations were not; the controls differ.
- **Finding 2:** `response.text()` consumed the entire upstream feed before checking the actual decoded byte count, making the 1.5–2.5 MB cap ineffective against large chunked bodies with absent/incorrect `Content-Length`.
- **Fix:** request `redirect: "manual"`; validate initial and subsequent URLs as HTTPS + approved source host and reject credentials in URL; allow at most 3 redirects. Read incoming body in bounded byte chunks using `ReadableStream.getReader` and `TextDecoder`, cancel once over the adapter's cap. Preserve the 8-second abort guard and existing parsed-candidate filtering. No change to trusted source seeds, D1 migrations, import policy, scheduler, IAM or publication workflow.
- **QA:** new `CMS-NEWS-005` checks cross-host block / same-host relative hop / redirect loops; `CMS-NEWS-006` checks large chunked data cancellation and declared oversize. `RUN-CMS-20261103-06` until CI confirmed. Security verification uses injected deterministic HTTP fixtures, **not a real remote HTTP fetch or Access-authenticated browser**.
- **Risk:** sources whose feed redirect genuinely points to an unapproved third-party host now fail closed and require an explicit source-host policy review (do not auto-allow). Verified current feed remains subject to actual staging/source E2E before rollout. No production/hosted data updates.
- **SRS:** FROZEN/CHƯA_CHỐT; this bounded operational security patch is recorded separately here.

**Observed verification of CHG-TIN-TUC-20261103-02:** At source SHA `043b270b68aa1290bdb52bb6e7a44259cddc59fb`, [Portal CI #41584604136](https://github.com/ntdung-tds/iaict-portal/actions/runs/41584604136) **4/4 PASS, 594/594 Vitest including five new adapter tests, 38/38 local Chromium**. [Public staging #41584604067](https://github.com/ntdung-tds/iaict-portal/actions/runs/41584604067) **24/24 Chromium + 24/24 HTTP PASS**, 0 observed 503/5xx/network errors against **old deployed Worker**. `RUN-CMS-20261103-07` captures this exact source verification, while `RUN-CMS-20261103-06` retains pre-test NOT_RUN. Final documentation SHA CI still required; external RSS network and authenticated CMS are NOT_RUN. SRS stays frozen.

### CHG-TIN-TUC-20261103-03 — Two-pass independent review after PR #83

- **Baseline:** [merged PR #83](https://github.com/ntdung-tds/iaict-portal/pull/83) at `c86ff18adfef49b5454cc71b2649aa81ae840bd1`; user explicitly requested another two detailed review cycles on 03/11/2026. Previous security fixes for source host allowlist, redirect hop limit and streamed response size are preserved.
- **Review pass 1 — HTTP/URL and RSS parser:** the approved-host check used `URL.hostname` but accepted nonstandard HTTPS ports (e.g. `https://mst.gov.vn:8443/`), including both redirected source feeds and discovered article links. Numeric XML entities outside Unicode range (`&#x110000;`, very large decimal values or surrogate code points) caused `String.fromCodePoint` to throw and could fail an entire otherwise usable feed.
- **Remediation pass 1:** only HTTPS default port is accepted for source fetches and candidate links; credentials in link URLs are rejected; explicit `:443` remains allowed after URL normalization. Decode XML numeric references only if they satisfy XML 1.0 legal code point ranges, otherwise use replacement character U+FFFD without throwing.
- **Review pass 2 — stream and cleanup:** awaiting source `ReadableStream.cancel()` could stall on a non-cooperating upstream, defeating timeout behavior; invalid redirects and oversized Content-Length also needed explicit unused-body cleanup. Cancel redirect bodies early and body/readers on oversize without awaiting the untrusted cancellation promise; catch rejected cancel promises.
- **Test:** `CMS-NEWS-007` custom-port/credential URL and explicit default :443; `CMS-NEWS-008` malformed numeric RSS XML (out-of-range, surrogate, XML control); `CMS-NEWS-009` pending cancellation of redirect body and oversized streamed body. `RUN-CMS-20261103-08` awaits exact CI. Uses deterministic fake HTTP/streams; **not real upstream HTTP**.
- **Scope/safety:** keep 8-second abort signal, original Newsroom ingest→review→publish→archive SQL pipeline, source seed list, scheduler, Access, D1 migrations and publication policy unchanged. IAM PAUSED by Owner; no hosted Cloudflare state or production deployment. SRS FROZEN/CHƯA_CHỐT.
- **Risk:** stricter URL policy can reject feeds or article links served on custom HTTPS ports; this is intentional fail-closed behavior. Real upstream compatibility and authorized hosted CMS E2E still NOT_RUN.

**Exact-source verification for CHG-TIN-TUC-20261103-03:** SHA `297ba4fbcf5cfdf262e0f8593c86320be37ed068` [portal CI #41609011114](https://github.com/ntdung-tds/iaict-portal/actions/runs/41609011114) **4/4 PASS, 600/600 Vitest, 38/38 local Chromium**; [public staging #41609010947](https://github.com/ntdung-tds/iaict-portal/actions/runs/41609010947) **24/24 Chromium and 24/24 HTTP PASS**, 503=0, 5xx=0, networkErrors=0 observed on **previously deployed Worker**. New injected-stream adapter test cases `CMS-NEWS-007..009` PASS_LOCAL_INJECTED_HTTP. Exact final-docs SHA CI and merge PENDING. No real-origin RSS or Access-authenticated Newsroom E2E; SRS frozen.

### CHG-TIN-TUC-20261103-04 — Iterative Newsroom source parser review

- **Owner directive:** 03/11/2026, repeat find → reproduce → fix → rerun tests → independently review until no further reproducible in-scope defect, while IAM PAUSED and SRS FROZEN.
- **Source baseline:** `feat/staging-native-login-r2-20261030` at merged PR #84 SHA `4714a72562f3d46755170248650cc7aac3806bd9`. Prior 600/600 Vitest and public Chromium smoke are valid scoped evidence; this discovery demonstrates they did not cover all HTML source markup patterns.
- **Iteration 1 observed defect:** old HTML parser searched for the literal substring `href` anywhere in an anchor opening tag, accepting `data-href` or `title="... href='...'" ` as the actual article link; if both `href` and `data-href` existed, it could take the spoofed URL. Reproduced with actual original expression over synthetic source HTML.
- **Iteration 1 fix:** extract quoted opening-tag attributes and select only the genuine `href` attribute (case-insensitive), preserving quotes and `>` within other attributes; the pre-existing protocol/host/port/credential guard then evaluates the actual link.
- **Iteration 2 observed defect:** raw HTML scanning included links embedded in comments, scripts, CSS and template blocks that are not navigational page links. Reproduced against the amended anchor expression and original source semantics.
- **Iteration 2 fix:** remove obvious non-navigational HTML regions before scanning anchors; preserve legitimate page links and fail closed on unfinished HTML comments. The lightweight parser is not a complete browser DOM renderer, and no live RSS/HTML-origin compatibility is claimed.
- **QA loop:** `CMS-NEWS-010` fake HTML anchor attributes, `CMS-NEWS-011` end-to-end HTML fetch adapter fixture, `CMS-NEWS-012` script/style/template/comment link exclusion, `CMS-NEWS-013` malformed/unclosed HTML comment; `RUN-CMS-20261103-10` initial **NOT_RUN pending exact-SHA CI**. Run all previous Core+Newsroom SQLite, source redirect, body-limit, URL/XML, public Chromium/HTTP regressions and review the final patch once more. Stop the bounded loop only when new detected reproducible defects are zero **within these tests and code paths**.
- **Exclusions / rollback:** no production or staging Worker deploy, no Cloudflare Access/IAM/hosted D1, no real-origin HTTP, no source-only Drive handoff, no change to source seeds, scheduler, CMS business policy or frozen SRS. Reverse the reviewed PR if real source pages reveal a compatible HTML parsing issue, then record/retest rather than assuming success.

## Các thay đổi tiếp theo

Khi thêm/sửa tính năng, bổ sung `CHG-TIN-TUC-YYYYMMDD-NN` theo [mẫu và quy định](../README.md); **không sửa SRS**. Nếu hồi cứu thay đổi đã thực hiện trước đây, ghi `BACKFILLED` cùng nguồn commit/PR và kiểm thử; không tự đặt PASS.
