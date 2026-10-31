## Thay đổi

- Mục tiêu và module ảnh hưởng:
- Requirement ID: `REQ-...`
- Staging-only SHA / rollback plan:

## Test case / test run traceability — bắt buộc khi thay đổi chức năng hoặc bảo mật

- [ ] Đã xem tác động lên [IAICT_TEST_CASES.csv](../docs/qa/IAICT_TEST_CASES.csv) và cập nhật/thêm mã `IAM-...` trong PR này, hoặc ghi giải thích có căn cứ.
- [ ] Test case có preconditions, dữ liệu giả, bước thực hiện và expected rõ ràng.
- [ ] Nếu CSV thay đổi, đã đồng bộ [Google Doc Master Test Plan](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit?usp=drivesdk), kiểm tra đủ số lượng/ID và ghi version snapshot.
- [ ] Đã chạy unit/integration/browser tương ứng; không đánh đồng mock browser với staging authenticated.
- [ ] Ghi `RUN-IAM-...` trong [IAICT_TEST_RUNS.md](../docs/qa/IAICT_TEST_RUNS.md), kèm immutable commit SHA, Worker version, CI URL, kết quả thực tế và người chạy.
- [ ] Nếu có FAIL/BLOCKED, tạo bug record và liên kết; không đổi kết quả lịch sử thành PASS.
- [ ] Nếu cần ảnh, upload **chỉ lên Google Drive QA private**: [PASS](https://drive.google.com/drive/folders/1W1HuaSxtaYMWxLDhdqy-U2HxX3jMlwfz) / [FAIL](https://drive.google.com/drive/folders/1g50_0CJI3uoCNH2aAT5dBlKbyBPtsFln) / [manual](https://drive.google.com/drive/folders/1wW6te40YqBwc3dJNMT40cnVESC11Iv5j).
- [ ] Không có cookie, mật khẩu, activation token, PII hay ảnh test trong GitHub artifacts.

**Danh sách test case ảnh hưởng:** 

**GitHub CI / staging acceptance run:** 

**Test Run ID, thực tế và verdict:** 

**Evidence URL (hoặc NOT_CAPTURED):**

**Defect / Retest IDs (nếu có):**

## Project Drive & multi-agent governance

- [ ] Nếu thay đổi cấu trúc Drive/hồ sơ: đã tìm đối tượng hiện có, xác minh quyền, ghi nhận ID/parent cũ-mới, cập nhật `docs/project/DRIVE_REGISTRY.md` và kiểm tra lại trên Drive.
- [ ] Nếu sửa Project Operating Model / Instructions / Skill: đã cập nhật `AGENTS.md` hoặc `.agents/skills/iaict-project-management/` khi cần; chạy `npm run verify:agent-skill`.
- [ ] Nếu có Google Doc bản đọc tương ứng: đã đồng bộ thủ công với GitHub và đọc lại; nếu chưa thể, ghi `PENDING_SYNC` cùng người phụ trách (không coi là đồng bộ).
- [ ] Đã rà soát tác động quyền chia sẻ; không công khai thư mục gốc hay làm lộ `07_Security` và ảnh QA.
- [ ] Mọi Project Charter, RACI, ADR hoặc production release cần phê duyệt vẫn ghi DRAFT/PENDING cho tới khi có bằng chứng duyệt.

## Release gate

- [ ] Exact SHA pinned; D1 migration/quick_check/Cloudflare Access/R2 bindings được xác minh.
- [ ] Trước phát hành có rollback Worker và D1 bookmark, Cloudflare Builds HOLD.
- [ ] Sau phát hành staging có readback phiên bản + môi trường; production không thay đổi nếu chưa được phê duyệt.
