# IAICT Portal — staging checkpoint / handoff (2026-10-31)

> Scope: staging only. Read-only audit of deployed resources, plus this GitHub documentation commit. **NO production promotion, NO Cloudflare Access cutover, NO D1 mutations, NO credential/session export.**

## Verified live resources (2026-10-31)

| Check | Evidence / result |
| --- | --- |
| GitHub source | `ntdung-tds/iaict-portal`, draft PR #36 (`feat/staging-native-login-r2-20261030`), open/unmerged |
| Staging Worker | `iaict-portal-staging`, deployment `b0c09e99-6509-4c40-a055-1996aa768a9b`, version `ddf86146-aa99-493b-b049-6cad24001650` at 100%, deployed 2026-10-31 04:34:09 UTC |
| Staging D1 | `iaict-portal-staging-db`, 23 applied migration records; read-only COUNT query |
| Native authentication, D1 aggregate only | 2 active CMS accounts; 1 v2 native password credential; 1 non-expired and non-revoked native session at audit time. **These counts are not E2E browser login acceptance.** |
| Staging R2 | Binding `MEDIA_BUCKET` points to `iaict-portal-staging-media`. Upload management, MIME verification and cleanup still pending |
| Cloudflare Access | App `IAICT Staging Newsroom`; /admin, /admin/*, /api/admin, /api/admin/* covered. Policy `allow` remains active; 12-hour Access session |
| Production | `iaict-portal` still Worker version `e7c703f7-fc4c-4313-b14c-0a2c94e0613d` (deployment initially recorded 2026-10-15); no change made during this audit |
| Browser Rendering (390px) | **PASS**: public /login page renders email input, password input, submit, and correct-account-email guidance in accessibility tree. /account and /admin/security browser probes hit Cloudflare HTTP 429 rendering quota; **NOT PASS / NOT TESTED** |
| Other public GET probes | Independent web opener not accessible; local curl DNS unavailable. No successful status claim from either |
| CI | Prior PR #36 reports historical CI/Chromium successes. This handoff **did not re-run** the full suite |

## Security decisions carried forward

- **Never change the current administrator's email automatically.**
- Use IAICT native account email as shown in Access-protected `/admin/security`; do not infer it from personal email. Never request, store or transmit the user's password, browser cookie or private tokens for QA.
- Password allowed length remains **8–128**, consistent with the approved user requirement. Recommend 12+ and add MFA before production, without unilaterally changing the minimum.
- Keep Cloudflare Access in place until explicit staging-native browser validation and an audited, reversible cutover. A valid D1 session does not demonstrate independent CMS routing through the current edge policy.
- Staging and production remain strictly separated. Draft PRs must not be merged/promoted without explicit release gates.
- Browser test images must be individual PNG files in the dedicated Google Drive QA folder, **never GitHub** (including GitHub Artifacts or ZIP).
- This document contains no credential values, password hashes, session identifiers, user emails, or private screenshots.

## Next execution gates (not yet completed)

1. **Authenticated pilot acceptance:** account owner privately logs in at `/login`, confirms `/account` reads their own current roles, then signs out and confirms the same session is revoked. QA checks D1 aggregate only; do not read tokens.
2. **Native CMS access readiness:** test Access-protected /admin routes while edge Access is intact; verify RBAC denial for lower roles, CSRF protection, disabled/revoked session denial and last-admin lockout guards. Do not claim edge cutover is complete.
3. **Staging Access cutover proposal:** implement a bounded, reversible plan with exact path matrix, backup of existing policy, anonymous-deny proof and rollback. Deploy only after pilot and security gates PASS.
4. **User onboarding / security:** invitation tokens, email verification, forgotten-password recovery, MFA/passkeys and rate-limit hardening (avoid any public user registration).
5. **R2 media feature:** scoped CMS-only upload/delete, MIME & size validation, random object keys, private-by-default access, audit trail, orphan cleanup. Do not upload secrets or tests screenshots to R2 by default.
6. **Re-run CI + Chrome + staging live acceptance**, record immutable code/version/migration checks and keep production unchanged.

## Release status

**Staging authentication pilot: PARTIAL / HOLD. Production: NO-GO.** No production promotion authorized by this checkpoint.
