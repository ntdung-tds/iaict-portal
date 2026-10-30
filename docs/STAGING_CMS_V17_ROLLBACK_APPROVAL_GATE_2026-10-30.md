# IAICT Portal — Staging release approval and rollback protocol (30/10/2026)

**Decision: HOLD — no merge, Worker deployment, D1 write or production action authorized.**

## 1. Verified live starting point (read-only)

| Item | Observation |
|---|---|
| Staging Worker | `iaict-portal-staging`; version `21ef7ce9-6f82-4381-a474-a3fa9678beb6`; 100% traffic |
| Previous staging historical version | `293841c3-5e16-4cb2-bd10-5ae38d299f42` (history only, not the preferred rollback target) |
| Staging deployment ID | `11336ddf-4172-43e0-b43d-4ddf3e0ed515` |
| Production Worker | `iaict-portal`; version `e7c703f7-fc4c-4313-b14c-0a2c94e0613d`; 100%, untouched |
| Staging D1 | 21/21 migration records; Time Travel bookmark available through read-only Cloudflare API |
| Cloudflare Access staging | 4/4 exact root/wildcard paths `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*` |

These are **observations as of 30/10/2026**, not immutable future values. Always re-query before approved release.

## 2. Three independent safety checks before anyone deploys staging

1. **Code + approval identity:** Build a candidate from the complete reviewed stacked PR chain. Check Git ancestry and all CI tests, including JWT, CMS, D1 scheduler/auto-publication, browser and release safety. Require a human-approved **full 40-hex commit SHA**. The dispatch must be from the exact authorized `release/staging-v17-hardened-20261029` ref, with its checkout SHA and GitHub event SHA **both equal** to the approved SHA. No branch-name shortcut or stale approval.
2. **Independent Cloudflare preflight:** Enter the current **live Worker version UUID**, not an old example. The read-only `scripts/verify-staging-release.mjs` validates account, migration set, Access paths, audience, active admin, **Worker version available for rollback**, D1 bookmark and the immutable approved source SHA. Fail closed if versions have changed, traffic is split, bookmark/rollback Worker cannot be read or credentials are missing.
3. **Post-release acceptance (only after a separately approved staging deployment):** Verify health, public Chromium responsiveness/SEO/Access redirects; then manually test a real Access-issued JWT via a private local storageState for actual CMS roles. Any non-admin role without an approved real QA identity is **NOT TESTED**, never reported PASS. Verify deployment version, D1 migrations, Access and public site once more after acceptance.

**Current status:** source candidate is still in draft PRs, not yet merged or deployed; real Cloudflare Access-issued JWT tests have not run on new Worker.

## 3. If the approved new staging Worker fails

- **Stop further deployment** and record HTTP status, failure type and exact Worker version **without recording cookies, JWTs, identities or screenshots containing private sessions**.
- **Preferred manual Worker-only rollback target** is the *verified immediately pre-deployment* staging Worker version, currently `21ef7ce9-6f82-4381-a474-a3fa9678beb6`. Fetch its metadata through `GET /accounts/{account_id}/workers/scripts/iaict-portal-staging/versions/{version_id}` before release. The version must exist and match the currently deployed 100% version at the moment of approval.
- Through the **Cloudflare dashboard's Worker Versions/Deployments rollback operation**, an authorized operator can select this recorded version and restore **100% traffic to staging only**. Confirm staging script name, account, rollback target, current unexpected version and explicit user authorization **again** before any write. Never rollback production through a staging workflow. This draft does **not** add any automated rollback execution.
- Re-check staging `/api/health`, Access 4/4 roots and redirects, public Chromium, deployed version ID, and D1 migration count after rollback. Document the outcome and leave the release HOLD.
- **D1 Time Travel bookmark is retained for recovery evidence**, not an instruction to execute a restore. Because this Worker release does **not** run migrations, an ordinary Worker-only rollback should not require a D1 restore. **Never restore D1 automatically**: D1 Time Travel can discard subsequent writes and needs a separate approved recovery procedure and assessment.
- Production must retain its currently deployed Worker and independent D1.

## 4. CI and evidence

- Both staging deployment workflows accept **two mandatory values**: `expected_worker_version` (predeployment UUID) and `approved_release_sha` (complete reviewed 40-hex commit). A missing/mismatched value blocks deployment before build or API mutation.
- A pure `scripts/staging-release-guards.test.mjs` suite tests good approval and rejection of missing/mismatched SHA, wrong branch, changed live Worker, fractional deployment, missing archived version, missing D1 bookmark, and wrong UUIDs.
- `verify:release-safety` rejects workflows that remove the source approval or rollback checks. `npm run verify` and CI both include these checks.
- **No QA media uploaded to GitHub and no ZIPs.** Public browser captures belong as **individual PNGs** in the existing [private QA Google Drive folder](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3). Do not upload private authenticated screenshots/cookies there. GitHub Actions does not have a configured direct-to-Drive credential.
- Keep the Access staging prior-config JSON in the separate [Drive backup folder](https://drive.google.com/drive/folders/1e8qxwlTawwJ7wZJcgWOjggKtxqhIGJmt).

**No automatic dispatch, merge, release or rollback.** All require explicit authorization. Production remains out of scope.
