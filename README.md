# IAICT Portal

Cổng thông tin điện tử IAICT triển khai theo đặc tả **v3.4.3.11 FINAL HANDOFF — FROZEN — M0 REQUIRED**.

## Trạng thái hiện tại

Baseline kỹ thuật đã được dựng cho **Next.js 16 App Router + vinext/Vite**, hướng tới Cloudflare Workers. Repo hiện có:

- giao diện trang chủ responsive để kiểm chứng App Router/hydration;
- `GET /api/health` dạng liveness nhẹ, `no-store`;
- Vitest contract test;
- Playwright smoke test;
- GitHub Actions kiểm tra vinext, TypeScript, unit test và production build;
- ADR kiến trúc và sổ bằng chứng M0.

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

## Milestone tiếp theo

1. Xác nhận CI xanh và ghi lại phiên bản toolchain thực tế.
2. Copy nguyên trạng migrations `0001`–`0011` và các infra contract cần thiết từ repo đặc tả, kiểm tra hash; không chỉnh lịch sử migration.
3. Khởi tạo/cấu hình Cloudflare staging và Worker name `iaict-portal-staging`.
4. Hoàn tất các gate trong `qa/M0_EVIDENCE.md` trên Cloudflare thật.
5. Chỉ sau đó mở rộng M1: Access/RBAC/CSRF, D1, CMS/admin foundation, lead inbox, outbox/Queue, media publication, logging và search services.

## Nguyên tắc

Không hard-code dữ liệu nghiệp vụ đáng lẽ thuộc CMS/DB. Không ghi secrets/PII vào repo, log hoặc evidence. Không tự đánh dấu M0 PASS nếu chưa có bằng chứng staging thật.
