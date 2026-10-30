# IAICT Portal — staging v17 authenticated CMS/CRM QA gate (2026-10-30)

**Baseline currently deployed:** \`5fd56b8609f3dd8049f5826f0f402d741a5a574b\`; staging Worker version \`25fb582e-fc61-4c55-b42e-92489f862307\`. This QA proposal is **not deployed**. Production rollout remains **NO-GO**.

## Verified facts (read-only)

- In the deployed v17 source, \`worker.ts\` invokes \`verifyCloudflareAccessRequest\` on admin routes before invoking the Next/Vinext handler. The helper in \`lib/cloudflare-access-jwt.ts\` validates RS256 signature against a configured Cloudflare-team JWKS, \`iss\`, \`aud\`, \`exp\`, \`nbf\`, \`iat\`, and email/header equality. Its existing unit tests exercise signed-claim failures. This is an app-level verification **at the Worker entrypoint**; \`requireNewsroomActor\` itself assumes that upstream boundary has already validated the request.
- Staging Access covers exactly \`/admin\`, \`/admin/*\`, \`/api/admin\`, \`/api/admin/*\`; audience matches staging configuration. Unauthenticated Chromium staging acceptance previously passed 18/18.
- Staging D1 role **aggregate counts only**: \`admin=1\`; \`editor=reviewer=viewer=news_admin=news_editor=news_reviewer=0\`. Only one user exists and is active. No identities were inspected. No real non-admin role acceptance is possible yet.
- Staging migrations remain 21/21. Production exact Access roots have not been accepted as protected, and production was not changed.

## What this PR tests

\`lib/newsroom-auth.role-boundary.test.ts\` uses an **in-memory Fake D1** with invented \`example.invalid\` identities, no login cookies, no external Access requests, no SQL mutations, and no screen/audio/video capture.

- Seven roles across seven permission gates = **49 positive/negative access decisions**: global CMS read/edit/admin, newsroom read/edit/review/admin.
- Reject missing identity/assertion, inactive or unknown accounts, missing/unrecognized roles, and newsroom-only global CMS/CRM escalation.
- Verify SQL parameterization for email lookup and that only active users are resolved.
- Combined role assignments preserve only the explicitly assigned roles and do not grant admin.

This intentionally does **not** prove cryptographic JWT acceptance (covered by a separate unit test of the Worker boundary) nor an actual Cloudflare-authenticated session.

## Still required before production

1. With a separately approved QA operator, create or assign isolated staging **test** identities for \`editor\`, \`reviewer\`, \`viewer\`, \`news_admin\`, \`news_editor\` and \`news_reviewer\`. Do not convert, expose or repurpose the existing admin account. Never copy production customer records.
2. Use the existing \`playwright.staging-authenticated.config.ts\` and \`e2e/staging-authenticated.spec.ts\` with a locally stored, mode-600 private Access session **outside** the repository. Tests are GET-only, screenshots/traces/videos disabled, CI prohibited. Repeat per actual role, comparing against approved D1 role expectations. No JWT, cookie, email or CRM payload may be stored in build logs.
3. Confirm real signed JWT issuer/AUD/expiry, wrong role, expired session, alternate admin routes and Access root protection. For any authenticated cross-role negative check, use only authorized staging QA identities.
4. Keep all QA images on the dedicated Google Drive folder, never GitHub. This role test creates **no images**.
5. Recheck production exact-root Access destination protection, separate release approval, migration/rollback pins, and unresolved GitHub release/Cloudflare auto-trigger controls before production.

**No-go:** Do not merge this QA PR into the pinned staging source, mutate D1, or deploy any Worker merely because synthetic role tests pass.
