# IAICT Portal — changes relative to frozen SRS

**Rule:** log only actual owner-approved changes and evidence; the SRS baseline is NOT rewritten. Merge decisions about synchronizing the SRS are deferred until owner acceptance.

## CHG-2026-11-05-CMS-AUTH-01 — Staging CMS password-only user experience

- **Owner request:** remove repeated Cloudflare Access “Send code” from ordinary IAICT Portal CMS sign-in; use the existing simple CMS email/password form and account.
- **Original:** Cloudflare Access protected staging /admin and /api/admin roots/descendants, requiring OTP or Cloudflare account login *in addition* to the native CMS password flow.
- **Approved deviation in staging:** keep the current active D1-backed native CMS credentials and role authorization, and apply a reversible staging-only Access Bypass policy so users authenticate to the application with their own email/password. No code is allowed to bypass the Worker D1 session check. Password policy remains minimum 8 characters with weak-password denial, PBKDF2 100,000 iterations per Workers limits, hashed cookie/session token, rate limiting, origin and role checks. Existing administrator password remains unchanged; no shared/default password.
- **Security tradeoff:** Access-level login/audit logging is bypassed for *staging admin paths only* and replaced by application-level session enforcement. This has **not** been approved for production. Unknown/extra bypass policies or a missing native-auth flag block future staging release preflight. Rollback: remove only Access policy ID 897f8a7a-cf1a-474a-aa16-ccffa6d9f13f, restoring previous staged Access OTP challenge.
- **Verified runtime:** 2026-11-05 real Chrome public /login HTTP 200; eight anonymized administrative UI/API routes including Media and News return HTTP 401 without native cookie; Cloudflare Access login challenge no longer appears on those staging routes. Actual signed-in Admin login/dashboard **NOT_RUN** without password/session; real Media upload still **NOT_RUN**. See `RUN-CMS-AUTH-20261105-01`.
- **Prepared source-only UX (pending separate staging Worker deploy):** unauthenticated HTML /admin navigation redirects to /login; successful native login sends user to /admin; CMS offers account/logout navigation. Test updates reflect current deployed staging 401. No production deployment or baseline SRS edit.
- **Status:** STAGING ACCESS POLICY APPLIED / PUBLIC AUTH NEGATIVE PASS / POSITIVE SIGN-IN NOT_RUN / UX CODE NOT_DEPLOYED / PRODUCTION HOLD.
