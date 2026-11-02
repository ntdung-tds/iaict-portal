# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 23 PROPOSED · CMS-08 real IAM security design review**

- Baseline [PR #60](https://github.com/ntdung-tds/iaict-portal/pull/60) **MERGED** at `caab71d0fd54edabacf5a59296440b7d88aea2e3`, PCS revision 22 current. [PR #59](https://github.com/ntdung-tds/iaict-portal/pull/59) previously verified actual `lib/totp.ts` in **local Node + synthetic Miniflare D1**, 27/27 assertions; 559/559 Vitest and 86 QA cases at [CI #41457724289](https://github.com/ntdung-tds/iaict-portal/actions/runs/41457724289). These are prior-run results, **not new evidence**.
- This review maps exact real `admin_users`, `admin_user_roles`, `iaict_password_credentials_v2`, `iaict_auth_sessions` and server readers/mutations to a proposed authoritative epoch, encrypted factor, challenge, session assurance and independent recovery contract. See [review](../docs/iam/MFA_REAL_SCHEMA_SECURITY_REVIEW_2026-11-02.md) and `CHG-IAM-ACCESS-20261102-14`.
- **Finding:** current native password login creates full session; there is no actual MFA-assurance column or authoritative security revision. These are implementation gaps for proposed future MFA, **not** proof of a deployed MFA exploit.
- **DESIGN ONLY:** no D1 migration, Worker/login/session code change, secrets, Cloudflare Access, R2, users, production or staging runtime change. Real `IAM-FUT-001/002/004`, recovery, hosted D1 and seven-role E2E **NOT_RUN**.
- ADR-0002 **PROPOSED**, SRS **FROZEN**, Owner MFA/security acceptance **NOT GIVEN**. QA: 86 cases; **no new run claimed**; images **NO_IMAGE_REQUIRED**, private [evidence folder](https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp).

## Next precise action

Verify this exact-head documentation PR's CI and public-only staging acceptance; fix only concrete review issues, then merge if gates pass. Next **separate** decision: approve or revise real IAM epoch/assurance/key/recovery design **before** any migration, live MFA API/Worker or release. Do not re-run completed PR #59 or enable MFA from this review.
