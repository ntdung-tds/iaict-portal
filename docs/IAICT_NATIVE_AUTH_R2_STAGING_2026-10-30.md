# IAICT native CMS/CRM authentication + R2 — staging-first change gate

**Status:** Draft, not released. Existing Cloudflare Access remains the required edge
protection for /admin, /admin/*, /api/admin, /api/admin/* until explicit approval
for a controlled cutover. No production authentication changes are authorized.

## Goal
- IAICT manages its own users and permissions in D1; no public signup.
- An existing signed Cloudflare Access administrator can visit /admin/security
  and establish a *private* IAICT password without sharing it with QA, GitHub or ChatGPT.
- The native login page /login and its API use PBKDF2-SHA256 with a random salt;
  rate-limit repeated failures; store only SHA-256 hashes of 256-bit opaque session tokens;
  use a Secure, HttpOnly, SameSite=Lax, __Host- session cookie.
- The Worker, not caller headers, verifies native session cookies. Existing
  CMS/CRM route RBAC remains enforced against current D1 user roles.
- Rotating credentials invalidates every previously created native session.
- Production feature switch defaults off and has no new R2 binding.
- R2 holds media only; never credentials, cookies or user private data.

## R2
- Dedicated APAC Standard staging bucket: iaict-portal-staging-media.
- Staging-only binding: MEDIA_BUCKET via bindings.r2({name:"iaict-portal-staging-media"}).
- Do NOT point at existing account buckets. No public R2 hostname.
- Upload APIs, MIME validation, antivirus, retention and lifecycle policy remain
  a separate media workstream; no upload/public object endpoint in this change.

## Deployment gates (in strict order)
1. Required GitHub CI verify, browser-visual, unit tests and immutable SHA review.
2. Audit latest D1 backup/bookmark and migration count; review SQL migration 0022.
3. Apply ONLY 0022 to staging with an explicit migration approval and rollback plan.
   Do not run npm deploy:staging because that implicit task also mutates D1.
4. Deploy reviewed immutable SHA to staging Worker with staging mode using manual
   Cloudflare Builds, including prepare:cf-output. Recheck Worker version and bindings.
   Verify production Worker version unchanged.
5. Admin visits existing Access-protected /admin/security, enters a strong password.
   Do NOT send this password to ChatGPT or any CI. Verify password hashed/salted in
   staging D1 using aggregates, not credentials.
6. Test /login in a private browser and confirm session round-trip, all RBAC read
   and denied operations, CSRF, expiry/revocation and re-login. Before cutover,
   Access may still intercept /admin and /api/admin: this is expected.
7. Only after pass, perform a separately approved staged Access policy/path
   transition. Native session may authenticate at Worker ingress, but **removing
   Access before proving the complete browser flow would risk an insecure rollout**.
   Prefer a bounded pilot and retain an emergency rollback of Access settings.
8. MFA/passkeys, password recovery, IP rate limiting, audit retention, security
   review and independent penetration testing required before production GO.

## Known technical limitations
This is a staged foundation, not a claim of production-ready identity security.
- Access remains enabled on protected routes. One real browser sign-in must succeed
  end-to-end after an approved pilot; unit tests alone are insufficient.
- The initial setup requires an existing authorized administrator's Access session.
- Admin-created credentials for other users and recovery/MFA are not yet exposed.
- Feature flag IAICT_NATIVE_AUTH_ENABLED is true only in *staging build config*;
  it does not update deployed Workers until an authorized manual deployment.
- Never report production ready until all release gates and user acceptance pass.
