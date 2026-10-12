# M0 EVIDENCE — IAICT Portal

> Trạng thái tổng: **PENDING**. File này không phải bằng chứng PASS; đây là sổ theo dõi cho PoC Cloudflare thật.

| Gate | Trạng thái | Bằng chứng cần ghi |
|---|---|---|
| vinext build trên toolchain cài thực tế | PENDING | phiên bản + log build |
| Deploy Worker staging `iaict-portal-staging` | PENDING | URL/route + deployment id |
| `GET /api/health` no-store | PENDING | curl/headers từ staging |
| Access JWT + host + CSRF + RBAC negatives | PENDING | test matrix |
| D1 remote migrations/rollback | PENDING | command logs + sanitized result |
| R2 staging/public/private boundaries | PENDING | binding/resource evidence |
| Concurrent media publish claim (2 isolates) | PENDING | real Worker evidence |
| Queue/DLQ/outbox/provider | PENDING | retry/recovery evidence |
| Email provider readiness | PENDING | nonblank messageId, sanitized |
| Turnstile hostname/action/retry + UUIDv8 | PENDING | Siteverify evidence |
| CSP/nonce/hydration/navigation | PENDING | browser evidence |
| Vitest Workers binding test | PENDING | installed version + run output |
| Wrangler createTestHarness integration | PENDING | installed version + run output |
| Playwright staging smoke | PENDING | run output |
| Shared-NAT rate limiting | PENDING | behavior evidence |
| Backup/restore + no-PII-resurrection | PENDING | rehearsal evidence |

## Nguyên tắc bằng chứng

Không ghi raw IP, User-Agent, JWT, Turnstile token, secret hoặc PII. Local build/test không được dùng để thay thế bằng chứng Cloudflare M0.
