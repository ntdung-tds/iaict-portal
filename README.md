# IAICT Portal

> **Lưu ý trạng thái:** Phần M0/đặc tả cũ dưới đây phản ánh baseline lịch sử. Staging đã có các phiên bản IAM/CMS mới hơn; **luôn xác minh GitHub PR/CI và Cloudflare Worker hiện tại** trước khi làm việc hoặc phát hành. Không coi M0 PENDING dưới đây là trạng thái runtime tháng 10/2026.

## Quản lý dự án và AI agent — cập nhật 31/10/2026

- [**Project Master trên Google Drive**](https://drive.google.com/drive/folders/11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ) và [READ FIRST](https://docs.google.com/document/d/1shehSFXogJqx7hhsIgYigU21IccifWx9ntybVUt3Rnk/edit?usp=drivesdk).
- [Project registry](docs/project/DRIVE_REGISTRY.md), [Operating Model / RACI](docs/project/OPERATING_MODEL.md), [Project Charter DRAFT](docs/project/PROJECT_CHARTER_DRAFT.md), [Risk Register](docs/project/RISK_REGISTER.md).
- **AI Agents:** [AGENTS.md](AGENTS.md) và [portable Skill](.agents/skills/iaict-project-management/SKILL.md) (có hướng dẫn cho Copilot, Claude và Gemini).
- [QA staging role identities & real-browser matrix](docs/qa/IAICT_TEST_IDENTITIES.md) — 8 safe, disabled fixtures; full Access/role E2E requires controlled test identities.
- [Test Management](docs/qa/IAICT_TEST_MANAGEMENT.md), [78 test cases](docs/qa/IAICT_TEST_CASES.csv), [test-run ledger](docs/qa/IAICT_TEST_RUNS.md). Hình ảnh/ảnh lỗi chỉ tại [Drive QA](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3), không phải GitHub.
- **Deferred full-source handoff — ONLY on explicit owner command “bàn giao”:** [GitHub Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38) — copy **complete source code** and docs to private [Drive FINAL_HANDOFF](https://drive.google.com/drive/folders/1FPhc8qDloCwxSRxTq-X6i3t5b8DYkPaQ), verify SHA256 and restore before project closure. Currently **PENDING**.
- Production `iaict-portal` **chỉ thay đổi sau phê duyệt rõ ràng**. Staging `iaict-portal-staging` phải qua CI, acceptance, D1/Access/rollback readback; giữ build HOLD.

---

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
