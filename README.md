# IAICT Portal

Cổng thông tin điện tử IAICT triển khai theo đặc tả **v3.4.3.11 FINAL HANDOFF — FROZEN — M0 REQUIRED**.

## Trạng thái hiện tại

Baseline kỹ thuật đã được dựng cho **Next.js 16 App Router + vinext/Vite + Cloudflare Vite plugin v2**, hướng tới Cloudflare Workers. Repo hiện có:

- giao diện trang chủ responsive để kiểm chứng App Router/hydration;
- `GET /api/health` dạng liveness nhẹ, `no-store`;
- Vitest contract test và Playwright smoke test;
- GitHub Actions kiểm tra migration integrity, vinext, TypeScript, unit test và production build;
- `cloudflare.config.ts` theo toolchain Cloudflare/vinext hiện hành;
- canonical D1 migrations `0001`–`0011`, byte-for-byte từ repo đặc tả và được khóa SHA trong CI;
- workflow deploy staging thủ công;
- ADR kiến trúc, M0 runbook và sổ bằng chứng M0.

**M0 Cloudflare vẫn PENDING.** Local/CI build không được coi là bằng chứng M0 hoặc production readiness.

## Chạy local

```bash
npm install
npm run dev
```

Kiểm tra đầy đủ baseline:

```bash
npm run verify
```

E2E local:

```bash
npx playwright install chromium
npm run test:e2e
```

## Staging Cloudflare

Worker staging mặc định là `iaict-portal-staging`. Không commit Cloudflare token/account credentials. Xem `docs/M0_RUNBOOK.md` trước khi chạy workflow `deploy-staging`.

## Milestone tiếp theo

1. Deploy baseline lên Cloudflare staging thật và ghi evidence `/api/health`.
2. Tạo/cấu hình các tài nguyên staging cần thiết cho D1, R2, Queue, Turnstile và Access.
3. Apply migrations `0001`–`0011` lên **D1 remote staging** và thực hiện các bài test/rollback theo đặc tả.
4. Hoàn tất toàn bộ gate trong `qa/M0_EVIDENCE.md`.
5. Chỉ sau M0 mới mở rộng sâu M1: Access/RBAC/CSRF, CMS/admin foundation, lead inbox, outbox/Queue, media publication, logging và search services.

## Nguyên tắc

Không hard-code dữ liệu nghiệp vụ đáng lẽ thuộc CMS/DB. Không ghi secrets/PII vào repo, log hoặc evidence. Không tự đánh dấu M0 PASS nếu chưa có bằng chứng staging thật. Không sửa migrations `0001`–`0011`; mọi thay đổi schema mới phải là forward-only migration mới.
