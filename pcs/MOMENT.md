# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 37 PROPOSED · actual CMS Admin user mutation + session integrity**

- [PR #77](https://github.com/ntdung-tds/iaict-portal/pull/77) adds test `IAM-USER-021` for actual `app/api/admin/cms/users/route.ts` (GET/POST) after actual Worker native-cookie ingress. Original committed migrations run on **disposable Miniflare D1**; only the vinext routing dispatcher is mocked. Test covers Admin-only GET, forged Origin rejection, **Editor→Viewer→Editor** using D1 CAS and native session revocation; both old tokens stay invalid after regrant; stale updatedAt returns 409 and preserves the newer session.
- First source CI [#41539239411](https://github.com/ntdung-tds/iaict-portal/actions/runs/41539239411) failed due missing local CMS `0019_v17_full_cms.sql` fixture; fixed by applying original migration. **No product implementation bug was established or modified.** Fixed code SHA `049346fe3f6528dd2b2fd0082619bfe18471fac9`: [Portal CI #41539487495](https://github.com/ntdung-tds/iaict-portal/actions/runs/41539487495) PASS 4/4 incl. **14/14 real Worker/D1 RBAC tests**, **580/580** Vitest and **38/38** local Chromium.
- [RUN-IAM-20261103-07](../docs/qa/IAICT_TEST_RUNS.md), QA catalog **95**, [Google master QA v2.6](https://docs.google.com/document/d/1oTjOmD6zDgC46AsUrPcieVvhjRYHapEY8GBNlWwQxL8/edit). Final PR source + documentation HEAD requires rerun in Portal CI and real public Chromium staging before merge.
- Public staging is still protected by Cloudflare Access; previous actual negative login/browser suite covers **24 real public Chromium** tests. **Real successful role-specific Access sign-ins / hosted CMS admin mutations remain BLOCKED/NOT_RUN:** 8 legacy QA fixtures inactive; no independent controlled test inboxes or recoverable approved credential vault, existing Cloudflare Secrets Store empty/write-only. Owner staged QA permission PR66 exists; no new approval needed.
- SRS FROZEN / ADR PROPOSED. No production, hosted D1 user data, Access policy, Worker deployments or credentials modified by this PR. All new passwords and D1 identities are ephemeral in tests; no QA screenshots needed.

## Next precise action

Validate exact final PR77 head CI and real staging Chromium/HTTP, merge on green. Then prioritize controlled project-owned QA inbox/IdP/vault setup for genuine Access-authenticated 7-role+Admin2 E2E. Do not count local D1/API green as successful hosted Access enrollment.
