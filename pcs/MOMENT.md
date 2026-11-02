# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 33 PROPOSED · native auth local-real-D1 verification**

- Previous [PR #71](https://github.com/ntdung-tds/iaict-portal/pull/71) and [PR #72](https://github.com/ntdung-tds/iaict-portal/pull/72) merged; canonical PCS revision32. Staging live D1 has 8 disabled QA fixtures, zero native credentials or Access subjects; Cloudflare Secrets Store `iaict_staging_qa_credentials` empty. QA catalog prior **89**.
- New [PR #73](https://github.com/ntdung-tds/iaict-portal/pull/73) adds `lib/native-auth.real-d1.test.ts`, **7 Vitest integration scenarios** against unmodified **0001/0022/0023/0024** SQL on random disposable D1 with **actual TypeScript native-auth functions**. [RUN-IAM-20261103-04](../docs/qa/IAICT_TEST_RUNS.md) reports observed **PASS LOCAL_ONLY** at code SHA `d380dfd451ff74e34da82c64cdd92f0f63a65721`, covering 8 role identities, PBKDF2 password setup/login, session token digests, rotation, lockout, disabled/roleless user and session revocation. Credential strings generated in process only; never persisted. Case `IAM-AUTH-020`, catalog **90**.
- Read-only Cloudflare Access IdP inventory: exactly **one `cloudflare` provider**, no OTP email IdP. An Outlook.com account connector is present but `+tag` delivery is one shared inbox, **not** eight independent controlled QA mailboxes; did not use the mailbox for staging identities or policy changes. No actual authorized role-browser sessions, **8-role E2E BLOCKED/NOT_RUN**. Owner staging-only approval PR #66 remains in force.
- At this PCS text edit the SHA above was before evidence docs; final PR CI and Chromium public staging must run on **exact new HEAD**, after which merge if green. No hosted D1, Worker, production, Access, real user, mailbox or encrypted secret writes. SRS **FROZEN**, ADR-0002 **PROPOSED**.

## Next precise action

Finish exact-head CI/local Chromium and real public-staging Chromium/HTTP gates; merge PR73 only on PASS. Then arrange independent QA mailboxes and **reviewed** exact-address Access OTP/IdP staging enrollment rather than cloud-account-wide access. Safely validate encrypted secret lifecycle before storing test credentials. Do not claim actual signed-in browser acceptance until executed.
