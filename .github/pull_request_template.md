## Thay đổi

- Mục tiêu và module ảnh hưởng:
- Requirement ID: `REQ-...`
- Staging-only SHA / rollback plan:

## Test case / test run traceability — bắt buộc khi thay đổi chức năng hoặc bảo mật

- [ ] Đã xem tác động lên [IAICT_TEST_CASES.csv](../docs/qa/IAICT_TEST_CASES.csv) và cập nhật/thêm mã `IAM-...` trong PR này, hoặc ghi giải thích có căn cứ.
- [ ] Test case có preconditions, dữ liệu giả, bước thực hiện và expected rõ ràng.
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

## Release gate

- [ ] Exact SHA pinned; D1 migration/quick_check/Cloudflare Access/R2 bindings được xác minh.
- [ ] Trước phát hành có rollback Worker và D1 bookmark, Cloudflare Builds HOLD.
- [ ] Sau phát hành staging có readback phiên bản + môi trường; production không thay đổi nếu chưa được phê duyệt.
