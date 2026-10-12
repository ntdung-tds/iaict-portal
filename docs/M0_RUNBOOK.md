# M0 Runbook — IAICT Portal staging

M0 là gate bắt buộc trước khi phát triển sâu CMS, form public hoặc các phân hệ nghiệp vụ. Local/CI PASS không tương đương M0 PASS.

## 1. Trạng thái đã sẵn sàng trong repo

- Next.js 16 App Router + vinext/Vite.
- Cloudflare Vite plugin v2 + `cf` + `cloudflare.config.ts`.
- Worker staging mặc định: `iaict-portal-staging`.
- `GET /api/health` trả liveness tối giản và `Cache-Control: no-store`.
- Canonical D1 migrations `0001`–`0011` được khóa Git blob SHA trong CI.
- GitHub Actions CI kiểm tra migration integrity, vinext compatibility, TypeScript, Vitest và production build.
- Workflow `deploy-staging` chỉ chạy thủ công.

## 2. GitHub secrets cần có trước lần deploy đầu tiên

Thiết lập trong GitHub Actions/Environment `staging`:

- `CLOUDFLARE_API_TOKEN` — token có quyền cần thiết cho Cloudflare Workers staging.
- `CLOUDFLARE_ACCOUNT_ID` — Account ID của tài khoản staging.

Không commit giá trị thật vào `.env`, workflow, issue, log hoặc evidence.

## 3. Deploy baseline staging

Chạy workflow **deploy-staging** bằng `workflow_dispatch`.

Workflow sẽ:

1. kiểm tra hai credential bắt buộc;
2. kiểm tra SHA migrations `0001`–`0011`;
3. cài dependency;
4. chạy toàn bộ `npm run verify`;
5. deploy Worker `iaict-portal-staging` bằng `vinext-cloudflare deploy --skip-build`.

Deploy thành công mới chỉ chứng minh baseline Worker có thể chạy. Chưa được đổi `qa/M0_EVIDENCE.md` thành PASS tổng.

## 4. Evidence tối thiểu phải thu sau deploy

- deployment/version identifier của Worker staging;
- URL/route staging;
- `GET /api/health` trả HTTP 200 và `Cache-Control: no-store`;
- không có secret/PII trong response hoặc log;
- các gate Access/RBAC/CSRF, D1 remote, R2 boundaries, Queue/DLQ/outbox, email, Turnstile, CSP/nonce/hydration, Workers binding tests, shared-NAT rate limiting và backup/restore phải được kiểm riêng theo `qa/M0_EVIDENCE.md`.

## 5. Quy tắc dừng

Nếu Cloudflare deploy/build thực tế khác local CI, ưu tiên bằng chứng staging và sửa baseline trước. Không bỏ qua gate, không thay remote evidence bằng mock/local result, không sửa migrations `0001`–`0011` để xử lý lỗi schema.
