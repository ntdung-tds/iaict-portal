# IAICT — Defect Record Template

**One confirmed defect = one GitHub Issue** (labels `bug`, module and severity). Khi lỗi ảnh hưởng dữ liệu riêng tư, tránh gửi nội dung nhạy cảm công khai qua GitHub; chỉ đính URL Drive private và mô tả đã biên tập.

| Thuộc tính | Điền |
|---|---|
| Defect ID | BUG-IAM-YYYYMMDD-NN |
| Related test case | IAM-... |
| Test Run | RUN-IAM-... |
| Title | Action + unexpected behavior |
| Severity | CRITICAL / HIGH / MEDIUM / LOW |
| Priority | P0 / P1 / P2 |
| Status | OPEN / TRIAGED / FIXING / FIXED / RETEST / CLOSED / REOPENED |
| Environment | staging/local/production-read-only |
| Immutable code SHA | 40-char SHA |
| Cloudflare Worker | exact version UUID |
| D1 migration & fixtures | migration count, only synthetic fixture names |
| Browser / viewport | e.g. Chrome 390x844 |
| Preconditions | exact authorized state |
| Steps to reproduce | numbered, deterministic |
| Expected | linked to catalog |
| Actual | observable deviation, status, sanitized error |
| Impact | confidentiality/integrity/availability and scope |
| Evidence folder | https://drive.google.com/drive/folders/1g50_0CJI3uoCNH2aAT5dBlKbyBPtsFln |
| Evidence file URL | only observed Google Drive URL; else NOT_CAPTURED |
| Fix PR / SHA | immutable commit |
| Retest Run ID | new RUN-ID; never overwrite original FAIL |
| Final outcome | CLOSED only after verified PASS + relevant regression |

## Defect lifecycle

1. Confirm reproducibility on a safe fixture, preserve timestamp and exact SHA.
2. Attach sanitized screenshot (if one helps) to private Drive **FAIL**, paste verified Drive link; never GitHub screenshot artifact.
3. Create issue with ID, severity, case ID, actual vs expected and security impact.
4. Implement fix in PR; update affected test case and add regression automation.
5. Re-test on the fixed SHA, record new run and explicit retest link; close only when conditions pass.

**Security:** do not record passwords, Access cookies/JWT, bearer activation URLs, raw session hashes, PII, private R2 object URLs or third-party secrets.
