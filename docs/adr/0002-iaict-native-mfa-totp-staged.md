# ADR-0002 — Native IAICT MFA, TOTP enrollment and Cloudflare Access transition
**Status:** PROPOSED — not approved for live MFA enablement
**Date:** 2026-10-31 | **Issue:** https://github.com/ntdung-tds/iaict-portal/issues/37
**Scope:** Auth, IAM, session policy, recovery and Cloudflare Workers/D1. No production or Access changes under this ADR draft.

## Context
IAICT uses native password/session backed by D1 and keeps Cloudflare Access protecting all admin paths. To safely reduce sole dependence on Access, TOTP or phishing-resistant WebAuthn passkeys must be added with independent recovery, secure credential storage, throttle, audit, and a tested step-up policy. NIST SP 800-63B-4 (2025 final) requires OTP replay resistance and throttling for short OTPs; OWASP MFA guidance cautions that OTP alone is vulnerable to phishing and cannot be substituted for a phishing-resistant method for high-risk roles.

## Choices considered
1. **Keep Access as the only MFA provider.** Lowest near-term effort but continues vendor/Access login dependence.
2. **Native RFC 6238 TOTP, followed by WebAuthn passkeys (recommended staged design).** Works in Workers with WebCrypto, allows controlled enrollment and independent rate limit/audit and staged testing. Requires careful encrypted secret storage, replay counter, recovery and step-up.
3. **External IdP (Auth0/Clerk/other) for auth, with local permissions.** Outsourced authenticator risk but cost/privacy/vendor evaluation and IAM migration needed.

**Proposed direction:** B, *without removing Access*. The pure TOTP RFC 6238 utility + published test vectors are introduced as **FOUNDATION ONLY**. Its existence is not enrollment/second-factor enforcement.

## Cryptography and policy decisions (proposal)
- 160-bit cryptographically random TOTP secret minimum, standard Base32; 30-second period; 6 digits default for compatibility and configurable 8 digits; SHA-1 HMAC for broad authenticator interoperability, SHA-256/512 validated by vectors. Treat TOTP shared secret as restricted, never log QR/otpauth URIs or expose after binding.
- D1 must store **only AES-256-GCM encrypted** TOTP secret + IV, version/key ID, binding state, attempts, last accepted counter, created/confirmed timestamps, and explicit admin/recovery history. The envelope key MUST be an authenticated Cloudflare secret/KMS binding, never stored in D1, GitHub, R2 screenshots, plain Drive backup or client.
- Enrollment: authenticated **recent password recheck**, CSRF exact-origin, per-user throttling, fresh draft secret (short TTL), show setup key **once over HTTPS**, validate one current 6/8 digit TOTP, then atomically activate and audit; never permit pending/unconfirmed secret to authorize sign-in.
- Verify: only after correct first factor, return a restricted, short-lived **pre-MFA challenge** rather than full admin CMS session. Apply per-user/IP attempt ceilings, UTC clock ±1 period, and **D1 atomic compare-and-set** `last_accepted_counter < accepted_counter` to stop concurrency replay. A stateless code match is insufficient and does not grant authentication.
- Changing/disabling MFA requires recent reauthentication, active MFA or independently reviewed recovery flow, session reissue/revocation and audit. All privileged roles require MFA before native-only admin route access.
- Recovery: one-time cryptographically random recovery codes stored as salted/peppered secure hashes, delivery one-time over HTTPS and clear user warning; lost-device emergency path with verified identity, delayed/dual approval for privileged users. Avoid email-only self-service MFA reset without additional verification and cooldown.
- Disable/handoff gate: actual authenticated multi-device QA, lost device tests, recovery+rate-limit+replay race tests, negative IDOR/CSRF, audit, accessibility, rollbacks, and security review on staging. **Keep Cloudflare Access** until explicit approval of independent cutover.

## Implementation milestones
- **MFA-F1 (this PR):** pure TOTP utility + RFC 6238 vectors; ADR and QA record. No DB schema migration, no UI/API, no operational behavior change.
- **MFA-F2:** encryption key management ADR extension; forward-only D1 schema for pending/authenticated TOTP, replay & rate limits; tests for encryption and key rotation.
- **MFA-F3:** authenticated enrollment + verify + enforce challenge for native login; atomic counter updates, abuse protections and audit.
- **MFA-F4:** recovery, backup codes, passkey path/step-up and real controlled staging QA; explicit owner sign-off before any Access cutover.

## Requirements/tests
- F1 tests: RFC SHA1/SHA256/SHA512 8-digit vectors, zero-pad 6-digit codes, 30-second window, malformed input, generated-secret 160-bit, accepted-step read-only filter.
- Future P0 tests: prove two concurrent same-step submissions yield exactly ONE D1 acceptance, verify expired/reused OTP, wrong password/challenge cannot escalate, throttle per user/IP and lockout-safe recovery.
- QA catalog item `IAM-FUT-007` is a foundation test. `IAM-FUT-001` (full MFA enrollment/verification) remains PLANNED/NOT_RUN.
- Secrets and sample OTP QR must not be stored in GitHub screenshots or published Drive.

## References
- IETF RFC 6238: https://www.rfc-editor.org/rfc/rfc6238
- NIST SP 800-63B-4, final: https://pages.nist.gov/800-63-4/sp800-63b.html
- OWASP Multifactor Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
- RFC 4226 (HOTP): https://www.rfc-editor.org/rfc/rfc4226
