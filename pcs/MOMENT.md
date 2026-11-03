# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 38 PROPOSED · account disable/reactivate and Admin native-session revocation**

- Previous [PR #77](https://github.com/ntdung-tds/iaict-portal/pull/77) **MERGED** as `c5c376e7d994188d5ccca51a7db03254f885c9db`. Postmerge exact-HEAD [portal CI #41540366922](https://github.com/ntdung-tds/iaict-portal/actions/runs/41540366922) and [public staging #41540366829](https://github.com/ntdung-tds/iaict-portal/actions/runs/41540366829) SUCCESS. Prior 580/580 Vitest and 38/38 local Chromium remain historical evidence only.
- [PR #78](https://github.com/ntdung-tds/iaict-portal/pull/78) adds two actual native Worker / CMS Users DELETE+POST integrations against **disposable original-schema Miniflare D1**. Only downstream vinext route-dispatch is mocked; password/login and RBAC remain original source.
- `IAM-USER-022`: DELETE disables a synthetic News Editor, pre-disable native token remains invalid on reactivation, new token restores exactly that role, stale CAS DELETE must return 409 without revoking new session. `IAM-USER-023`: only genuine Admin may invoke `revokeSessions`; Admin2 previous token invalid after revocation, fresh login retains Admin role.
- QA catalog **97** (two new cases), evidence placeholder [RUN-IAM-20261103-08](../docs/qa/IAICT_TEST_RUNS.md), [change log](../docs/requirements/iam-access/thaydoi.md), and [project progress](../docs/project/PROJECT_PROGRESS.md) updated. First code-only [portal CI #41549451897](https://github.com/ntdung-tds/iaict-portal/actions/runs/41549451897) FAILED QA registry because new test cases were not yet registered; corrected on PR. **Do not claim new tests PASS before complete exact HEAD CI and real Chromium are observed.**
- Genuine hosted staging Access-authenticated 7 roles + Admin2 browser sign-in and hosted CMS mutation remain **BLOCKED/NOT_RUN**; disabled `example.test` fixtures are not real accounts. Need independent controlled QA inboxes, legitimate Access enrollment and an approved recoverable vault. No attempt to spoof/enable synthetic hosted identities.
- SRS **FROZEN**, ADR **PROPOSED**. No real user, Cloudflare policy, hosted D1, Worker deployment, secret, production or authenticated cookie modified. Local test passwords never persisted; QA images only in authorized Drive folder if actually captured.

## Next precise action

Observe final head [PR #78](https://github.com/ntdung-tds/iaict-portal/pull/78) portal CI, browser-local and 24-case real public staging acceptance; if failing, fix and rerun. Record exact SHA, run IDs and concrete counts, then merge only with full gates green. Do **not** represent local isolated D1/API test as positive Access browser E2E. Then prioritize authorized QA identity/vault readiness.
