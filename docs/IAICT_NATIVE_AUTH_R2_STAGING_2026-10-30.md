# IAICT native CMS/CRM authentication + R2 — staging-first change gate

**Status:** Draft, not released. Existing Cloudflare Access remains the required edge
protection for /admin, /admin/*, /api/admin, /api/admin/* until explicit approval
for a controlled cutover. No production authentication changes are authorized.

## Goal
- IAICT manages its own users and permissions in D1; no public signup.
- An existing signed Cloudflare Access administrator can visit /admin/security
  and establish a *private* IAICT password without sharing it with QA, GitHub or ChatGPT.
- IAICT passwords require **8–128 characters** (12+ recommended); the native login page /login and its API use PBKDF2-SHA256 with a random salt;
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
3. After applying baseline 0022, apply forward-only migration **0023** to staging with an explicit D1 bookmark and rollback plan. This creates `iaict_password_credentials_v2` with Workers-compatible PBKDF2-SHA256 (100,000 iterations). Never alter the original 0022 migration, and do not delete any legacy credentials.
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

## Native-session pilot before removing Cloudflare Access

The initial native password bootstrap is independently verified in staging D1 by
a nonzero **credential count**; no credentials or hashes may be fetched for QA.
This does not prove successful password login or an authorized native session.

- At `/login`, the authorized account owner enters their IAICT email and
  password **privately**. A valid login sets a Secure/HttpOnly/SameSite=Lax
  host-bound cookie and redirects to **`/account`**, not `/admin`.
- `/account` calls `GET /api/auth/session` on the same site with the
  IAICT cookie. The route independently verifies the token hash against
  **active, non-expired, non-revoked** sessions and the current active user
  roles in D1. It never accepts caller identity headers as proof.
- If the session is valid, the page displays only the current user's own email,
  display name and CMS role codes. Response headers are
  `Cache-Control: no-store, private` and `Vary: Cookie`; there are no
  hashes, salts, raw tokens or third-party telemetry.
- Anonymous, disabled, expired or revoked sessions must not expose an identity.
  A separate `POST /api/auth/logout` action validates same-origin requests,
  revokes the token server-side and clears its cookie.
- **Cloudflare Access remains on `/admin`, `/api/admin` and descendants.**
  A valid `/account` result proves the native session works but does **not**
  certify native access to the CMS, nor authorize edge cutover.
- The first successful user-owned pilot must be confirmed with a read-only D1
  aggregate (session **count only**) and no attempt to retrieve cookies,
  identity emails or passwords.
- Production's `IAICT_NATIVE_AUTH_ENABLED=false` disables the pilot API.
  A reviewed staging-only Access cutover, role-by-role browser QA, MFA and
  recovery readiness are still required before production.

## User management security updates
- D1 user create/edit/deactivate remains admin-only and keeps last-active-admin protection.
- Account creation does **not** create a password or grant Cloudflare Access; native onboarding/invitations and email verification remain separately gated.
- The Admin user list indicates whether v2 credentials are established without exposing hash/salt.
- Admin may revoke all IAICT sessions of an account; changing email, activity or roles automatically revokes sessions in the same atomic D1 transaction.
- Mutating user APIs require same-origin JSON requests and enforce payload size limits; audit and revision history are retained.
- Creating a password requires the existing authorized user's protected `/admin/security` page. This is not a general staff onboarding mechanism.
- The initial 0022 credential table was incompatible with workerd's WebCrypto PBKDF2 limit; 0023 uses a new v2 credential table and a strict 100,000-iteration contract.
- Do not claim full independent login accepted until an actual browser-authenticated native session works after a separately approved Access edge cutover.

## Known technical limitations
This is a staged foundation, not a claim of production-ready identity security.
- Access remains enabled on protected routes. One real browser sign-in must succeed
  end-to-end after an approved pilot; unit tests alone are insufficient.
- The initial setup requires an existing authorized administrator's Access session.
- Admin-created credentials for other users and recovery/MFA are not yet exposed.
- Feature flag IAICT_NATIVE_AUTH_ENABLED is true only in *staging build config*;
  it does not update deployed Workers until an authorized manual deployment.
- Never report production ready until all release gates and user acceptance pass.
