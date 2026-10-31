# IAICT Portal — Test Management Standard (QA Baseline v1.0)

**Ngày tạo:** 2026-10-31 · **Môi trường:** staging trước production · **Phạm vi giai đoạn đầu:** IAM/CMS/Auth/Access/Release.
**Đầu mối:** QA phối hợp Dev và chủ dự án. **Quyền sở hữu:** IAICT.
**Test catalog (nguồn kiểm soát phiên bản):** [IAICT_TEST_CASES.csv](./IAICT_TEST_CASES.csv) — mã cố định, có điều kiện, dữ liệu tổng hợp, các bước và kết quả mong đợi.
**Kết quả thực thi (append-only):** [IAICT_TEST_RUNS.md](./IAICT_TEST_RUNS.md). **Mẫu lỗi:** [IAICT_DEFECT_TEMPLATE.md](./IAICT_DEFECT_TEMPLATE.md).
**Bằng chứng hình ảnh (private Google Drive, không phải GitHub):** [IAM P0 evidence](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp), [PASS](https://drive.google.com/drive/folders/1W1HuaSxtaYMWxLDhdqy-U2HxX3jMlwfz), [FAIL/Defect](https://drive.google.com/drive/folders/1g50_0CJI3uoCNH2aAT5dBlKbyBPtsFln), [Manual/Recheck](https://drive.google.com/drive/folders/1wW6te40YqBwc3dJNMT40cnVESC11Iv5j).

## 1. Mẫu quản lý và nguồn chuẩn

Áp dụng mẫu nhẹ **ISO/IEC/IEEE 29119-3:2021-inspired**, phù hợp quy mô IAICT; đối chiếu kiểm thử bảo mật OWASP ASVS 5.0.0 (không tự nhận đạt chứng nhận hoặc bao phủ toàn bộ chuẩn). Quản lý năm thực thể độc lập:

1. **Requirement** (`REQ-...`): đặc tả/quy định cần kiểm tra và PR/issue thay đổi.
2. **Test Case** (`IAM-<AREA>-NNN`): mục tiêu, điều kiện, dữ liệu tổng hợp, thao tác, expected result và code/spec reference; không chứa kết quả PASS.
3. **Test Run** (`RUN-IAM-YYYYMMDD-NN`): một lần thực hiện trên **SHA + Worker version + D1 migration + môi trường** cụ thể, người chạy, thời điểm, actual/status, link evidence và bug.
4. **Defect** (`BUG-IAM-YYYYMMDD-NN`): kết quả thực tế khác expected; mức độ, bước tái hiện, SHA, môi trường, GitHub issue, Drive evidence, fix SHA, retest ID.
5. **Evidence**: Google Drive riêng tư; hình/clip/ảnh lỗi chỉ là bằng chứng tương ứng với một run/case; không phải test case.

**Nguồn chuẩn:** CSV + tiêu chuẩn này + test run/defect record trong GitHub. Bản Google Doc/Word dùng đọc và review; khi nội dung lệch nhau thì **file GitHub đã review theo PR là baseline**. Google Drive chỉ chứa QA media có thể được phép chia sẻ theo quyền. Không đưa token, cookie, session, password, thông tin cá nhân thật vào repo hoặc ảnh.

## 2. Trạng thái không được trộn lẫn

- `case_state=READY`: mô tả trường hợp kiểm thử đã viết; **không có nghĩa đã PASS**.
- `case_state=PLANNED`: hệ thống/chức năng hoặc điều kiện test chưa đủ; không ghi PASS.
- `automation=AUTO`: có file spec kiểm thử tự động liên quan, **không chứng nhận 1:1** nếu chưa gắn mã case vào test name; phải xác minh kết quả trên đúng SHA.
- `automation=MANUAL`: cần người thực hiện trên môi trường/thiết bị ghi rõ, không thể suy diễn từ mock UI.
- Trạng thái **mỗi lần chạy**: `NOT_RUN, PASS, FAIL, BLOCKED, NOT_APPLICABLE`; `RERUN` là run mới, không sửa/xóa run cũ.
- Phân loại kết luận theo lớp: `unit/integration` (D1 mock/local), `browser` (Chromium với API stub hoặc local), `live-public` (staging chưa đăng nhập), `live-authenticated` (phiên được cấp phép), `manual`. Không thể dùng PASS một lớp để tuyên bố lớp khác PASS.

## 3. Bộ dữ liệu / môi trường

- Dùng email giả `*@example.test`, token giả và DB fixture riêng. Không bao giờ tạo/khóa tài khoản người dùng thật nhằm thử nghiệm.
- Cloudflare Access vẫn bảo vệ `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*` trên staging. Login native riêng chưa thay thế Access.
- Test staging live ưu tiên READ-ONLY. Test mutation có tài khoản/fixture thí nghiệm riêng, kế hoạch hoàn tác, phê duyệt và người chịu trách nhiệm.
- Ghi `commit SHA`, `Worker version`, D1 migration count, browser + phiên bản, viewport, timezone, ID của run/defect; không dùng chữ "mới nhất" làm định danh.
- Khi Cloudflare Browser Rendering trả HTTP 429, đánh `BLOCKED` và ghi lý do; không coi là PASS.

## 4. Tần suất test, yêu cầu cập nhật cùng thay đổi

1. Khi có PR thay đổi `lib/native-*`, `app/api/auth`, `app/api/account`, `app/api/admin/cms`, `components/admin/user-management`, `lib/cms-roles`, `worker.ts`, `cloudflare/migrations`, `cloudflare.config.ts` hoặc luồng Release/Access: xác định mã REQ và test case bị ảnh hưởng; sửa/thêm test case **trong cùng PR** (nếu không cần sửa, ghi justification và liên kết case); bổ sung unit/browser test khi hợp lý.
2. CI chạy `node scripts/verify-qa-registry.mjs` để kiểm tra format, mã duy nhất, trường bắt buộc, policy evidence Drive, đường dẫn spec có thật. CI không được giả vờ kiểm chứng PASS/FAIL của QA thủ công.
3. Mỗi PR cần nêu: `Test case IDs`, `Test run ID`, changed behavior, regression suite, result, bug ID (nếu có), evidence folder, lý do SKIP/BLOCKED.
4. Staging: CI green + pinned immutable SHA + read-only acceptance + D1/Access/rollback preflight; sau deploy readback Worker + D1 + Access. **Chỉ cập nhật record PASS sau khi thực hiện thành công**.
5. Production: chỉ promote khi P0/P1 được phê duyệt, không còn defect critical/high mở, yêu cầu bảo mật (MFA/Recovery/permission gate) được nghiệm thu riêng; không tự merge/deploy.

**Khi có phát hiện lỗi:** ghi FAIL vào run mới → tạo BUG và ảnh Drive FAIL → commit fix → rerun cùng case + tests hồi quy → record PASS của rerun nếu thực sự đạt; **không ghi đè FAIL gốc**.

## 5. Test design và ma trận rủi ro

- Phương pháp: positive/negative/boundary, equivalence partitions, state transition, concurrency/race, RBAC/IDOR, CSRF, token expiry/replay, denial of service, a11y/responsive, deployment/rollback.
- **P0:** xác thực, cấp/thu hồi quyền, truy cập dữ liệu, phiên, invites, last-admin, D1 atomicity, Access, secrets, rollback.
- **P1:** a11y, mobile, load, email deliverability, audit UI, organization scope; P2: enterprise SSO/SCIM.
- OWASP ASVS 5.0.0 chỉ làm nguồn truy vết mức yêu cầu cho các kiểm thử security; không suy diễn rằng 526 Vitest bao phủ toàn bộ ASVS.

## 6. Evidence protocol (không lưu hình lên GitHub)

- Thư mục chính: https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp
- PASS: https://drive.google.com/drive/folders/1W1HuaSxtaYMWxLDhdqy-U2HxX3jMlwfz
- FAIL/Defect: https://drive.google.com/drive/folders/1g50_0CJI3uoCNH2aAT5dBlKbyBPtsFln
- Manual/recheck: https://drive.google.com/drive/folders/1wW6te40YqBwc3dJNMT40cnVESC11Iv5j
- Tên ảnh đề xuất: `RUN-IAM-YYYYMMDD-NN__IAM-AUTH-001__PASS__01.png`; lỗi: `BUG-IAM-YYYYMMDD-NN__IAM-USER-005__FAIL__01.png`.
- Ảnh phải che password, cookie, bearer links, Access tokens, real email, IP/private info và khóa/tên tài khoản không phục vụ test. Không dán URL chứa fragment activation token vào ảnh.
- Mỗi run record/bug record dẫn đến **đúng thư mục hoặc file ảnh** được Drive trả về, không tự bịa URL. Nếu chưa chụp/không có ảnh, ghi `NO_IMAGE_REQUIRED` hoặc `NOT_CAPTURED`; không phát minh bằng chứng.
- Không bật screenshot/video/trace trong GitHub Actions để lưu ảnh. Test artifact văn bản gồm CI run URL, logs an toàn, và kết quả kiểm thử.

## 7. Mẫu một test case có thể tái hiện

**IAM-USER-005 | Two concurrent admin edits**
- REQ: REQ-USER-CONFLICT; P0; integration; automation reference `lib/cms-users-atomic.test.ts`.
- Preconditions: hai Admin A/B được phép; cùng nhận `updated_at` từ một bản ghi test; D1 test fixture.
- Test data: email `qa-user@example.test`, version `v0`, A sửa `displayName`, B sửa `roles`.
- Steps: (1) A/B cùng GET user; (2) A POST version v0 → 200; (3) B POST version v0 → 409; (4) GET D1 user/roles/audit/revisions/sessions.
- Expected: A committed; B rejected; không có role/session/audit/revision thay đổi dở dang; UI B giữ draft và yêu cầu so sánh bản mới.
- Evidence: GitHub CI URL tại run record; nếu kiểm thử trình duyệt cần hình, dùng thư mục MANUAL hoặc FAIL trong Drive; không dùng ảnh của người dùng thật.

## 8. Biểu mẫu test run

```
RUN-ID:
Ngày UTC+7 / người thực hiện:
Môi trường: unit / local-browser / staging-public / staging-auth / production-read-only
Repo/branch + commit SHA:
Cloudflare Worker version / D1 migration / browser + viewport:
Case IDs và source suite:
Prerequisites / Test data (synthetic):
Observed actual results:
Case verdict (PASS/FAIL/BLOCKED/NOT_APPLICABLE/NOT_RUN):
CI workflow run URL:
Evidence Drive folder / file URL (nếu có):
Defect ID + GitHub issue URL (nếu có):
Retest of RUN-ID:
Approver / release decision:
```

## 9. Checklist trước khi đóng một release

- [ ] 100% P0 liên quan có test case/coverage và actual run được ghi.
- [ ] Không có P0 FAIL/BLOCKED bị ghi sai thành PASS; blocker có owner, ETA nội bộ và phương án khắc phục.
- [ ] Unit/typecheck/build/browser/acceptance PASS trên SHA đã triển khai, hoặc exemption có ghi rõ.
- [ ] Có bằng chứng Access và D1 integrity, không leak credentials, Build HOLD, production unchanged.
- [ ] Đối chiếu runtime Worker version với commit và rollback target.
- [ ] Test Run record + link evidence + defect/retest được commit; test catalog cập nhật đồng thời với code.

## 10. Căn cứ chính

- ISO/IEC/IEEE 29119-3:2021: https://www.iso.org/standard/79429.html
- ISO/IEC/IEEE 29119 series: https://committee.iso.org/sites/jtc1sc7/home/projects/flagship-standards/isoiecieee-29119-series.html
- OWASP ASVS 5.0.0: https://asvs.owasp.org/
- Quy trình CI thực tế: `.github/workflows/ci.yml` và `.github/workflows/staging-acceptance.yml` trong repo IAICT.
