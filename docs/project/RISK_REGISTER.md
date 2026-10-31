# IAICT Portal — Initial Risk & Open Decision Register (2026-10-31)
**Status:** WORKING — risks need probability/impact calibration and named owners in sponsor review.
**Scores:** do **not** invent unassessed probabilities. Estimate 1–5 likelihood & impact only after review. Distinguish a known blocker from a future risk.

| ID | Risk / issue and impact | Evidence / basis | Mitigation or contingency | Owner role | State |
|---|---|---|---|---|---|
| RISK-001 | Incomplete MFA/recovery could permit account takeover or user lockout if Access removed too early | IAM research + implementation roadmap | Keep Cloudflare Access on admin; implement and independently test MFA/recovery before handover | Security + Engineering | OPEN |
| RISK-002 | PBKDF2 implementation/runtime constraints may affect latency and future password policy changes | IAM v1.2 review notes | Staging benchmarks; assess compatible migration without breaking existing credentials | Engineering | OPEN |
| RISK-003 | Stale role/session writes under concurrency can damage authorization integrity | Previously identified, optimistic locking implemented | Keep CAS unit + staged concurrent-admin regression; monitor and preserve rollback | Engineering + QA | MONITORING |
| RISK-004 | Live authenticated QA / screenshots not yet complete; CI mocks can conceal integration bugs | RUN-IAM-20261031-01; Browser Rendering 429 after deploy | Authorize controlled staging fixture; perform multi-device tests; capture sanitized evidence in Drive | QA | OPEN |
| RISK-005 | A broad Drive share could expose IAM/backups via parent permission inheritance | Google Drive permission model; My Drive private root | Least privilege; approval before sharing root; separate restricted backups if moving to Shared Drive | IAICT Owner + Security | OPEN |
| RISK-006 | Drift between Google Doc snapshots and GitHub authoritative test cases/skill | Manual synchronization by design | Per-PR synchronization gate and snapshot version; readback both sides | QA + Engineering | OPEN |
| RISK-007 | Release/migration mistake could affect production and D1 integrity | Separate production Worker and migration history | Immutable SHA, CI, staging-only, HOLD restore, rollback Worker/D1 bookmark | Engineering | OPEN |
| RISK-008 | Lack of named decision authority / confirmed budget and dates could block scope and acceptance | Charter currently draft | Sponsor nominates accountable roles, budget, service objectives and sign-off procedure | IAICT Owner | OPEN |

## Open project decisions
- DEC-001: APPROVAL PENDING — adopt Project Charter and RACI, name project lead and QA gate reviewer.
- DEC-002: APPROVAL PENDING — when/if to use an organization Shared Drive; first design access partition for restricted assets.
- DEC-003: APPROVAL PENDING — baseline data retention for QA images, security logs and backups; coordinate legal/privacy.
- DEC-004: APPROVAL PENDING — initial CRM scope, deliverable priority, expected cost and approval gates.

## Review protocol
At sponsor review, fill likelihood (1–5), impact (1–5), score, trigger, owner, next review and decision link per risk. Changes through GitHub PR; approved snapshots stored in Drive `02_Planning`. Convert actual incidents into issues with timestamps and evidence. Never silently mark an open risk resolved.
