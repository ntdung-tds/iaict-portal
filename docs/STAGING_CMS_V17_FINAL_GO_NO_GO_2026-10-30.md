# IAICT Portal — Final release candidate audit / GO–NO-GO, 30 October 2026

**Decision: NO-GO — both the supervised staging rollout and production promotion are blocked.** This is an independently reviewed release audit; it does not approve or schedule a deployment.

## 1. Exact source identity and GitHub graph (round 1)

| Item | Verified evidence |
|---|---|
| Audited source release candidate | **`5fd56b8609f3dd8049f5826f0f402d741a5a574b`** (PR #28, full 40-hex SHA) |
| Release branch | `release/staging-v17-hardened-20261029` (actual branch, NOT a draft PR) |
| Candidate vs release | **125 commits ahead, 0 behind; 58 changed files** (30 added, 28 modified, 0 removed) |
| Applied migrations | **0 modified migration files** relative to release; 21 existing canonical SQL migrations |
| PR coverage | **19 open Draft PRs:** #8, #9, #10, #11, #12, #14, #15, #17, #18, #19, #20, #21, #22, #23, #24, #25, #26, #27, #28 |
| Ancestry | PR #8 is an ancestor of release; PRs #9–#28 form the staged candidate lineage; no reviewed PR is merged |
| `main` branch | **DIVERGED:** independent 80 commits behind / 672 ahead in comparison to RC. Do NOT merge directly into `main` as a release shortcut |
| Audit-only branch | `audit/staging-rc-final-no-go-20261030`, stacked on #28 for verification scripts and report. Its HEAD is **not** the frozen candidate above and must not be deployed without a fresh source-approval decision |

**Important:** A GitHub CI success on a draft head does not mean the live release branch uses its safer release workflows.

## 2. Actual release-branch hazards — confirmed with GitHub API (NO-GO)

The *currently existing* release-branch `.github/workflows/release-staging-once-20261029.yml` still contains `on: push` for the release branch; it can start a staging release when a commit is pushed. It does **not** require the explicitly reviewed 40-hex commit SHA, and its preflight refers to the obsolete staging Worker version `293841c3-5e16-4cb2-bd10-5ae38d299f42`.

The *currently existing* release-branch `.github/workflows/deploy-staging.yml` is manually dispatched but contains a staging D1 bootstrap/migration/deployment shortcut and lacks the new immutable commit-SHA, Worker-version and fail-closed rollback gates.

The safer workflow implementation in draft PRs #21–#28 **has not been merged into the actual release branch**. Thus **do not push candidate commits into the existing release branch or dispatch either old workflow before safe gating is approved and effective**. This is a real process blocker, regardless of test success.

## 3. CI and independent static audit (round 2)

The frozen candidate PR #28 passed [portal-ci #41005137531](https://github.com/ntdung-tds/iaict-portal/actions/runs/41005137531):
- **445/445** Vitest tests across 45 suites, including JWT signature/JWKS rotation and real D1-schema RBAC matrix.
- **20/20** Chromium mocked CMS tests; **9/9** Access path contract tests; **8/8** staged SHA/rollback negative and positive tests.
- GitHub graph ancestry, typecheck, build/dry-run and public pinned Access JWKS key validation PASS.
- CI's authenticated-session negative test confirms the private cookie-based browser suite **will not run in GitHub Actions**.

This audit adds `scripts/release-readiness.mjs`, `scripts/audit-staging-release.mjs`, and standalone negative/positive release policy tests. The real release-branch workflows are read directly from full Git history, **not** from the proposed PR. CI reports the computed decision `NO_GO` as an audit result, rather than mislabeling it as permission to deploy.

The audit distinguishes **controlled staging pilot eligibility** from **post-staging production promotion**. Real Access-issued JWT checks and full non-admin acceptance are required **after** a separately approved staging pilot; they cannot logically be pre-deployment conditions for the pilot.

## 4. Live Cloudflare/D1/Chromium verification (round 3)

Read-only Cloudflare API observations, 30 October 2026:

| Environment | Verified state |
|---|---|
| Staging Worker | `21ef7ce9-6f82-4381-a474-a3fa9678beb6`, 100% traffic |
| Production Worker | `e7c703f7-fc4c-4313-b14c-0a2c94e0613d`, 100% traffic; unchanged |
| Staging Worker rollback | The exact currently deployed Worker version remains retrievable through Worker Versions API |
| Staging D1 | 21 migrations and Time Travel bookmark retrievable |
| Staging Access | `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*` configured |
| Production Access | Exact `/admin` and `/api/admin` not in explicit destinations; production release blocker |
| Authenticated CMS acceptance | **NOT TESTED** against the new Worker. Only one active CMS global-admin account exists in staging; six other roles lack approved real QA identities |

[Existing staging Chromium #41005137436](https://github.com/ntdung-tds/iaict-portal/actions/runs/41005137436): **18/18 PASS**, including unauthenticated staging Access redirects, but tests the **old deployed Worker**, not the RC. Thus it cannot establish that new signed JWT/CMS code passed a real authenticated session.

**New live-browser anomaly during this audit:** [staging-acceptance #41006478659](https://github.com/ntdung-tds/iaict-portal/actions/runs/41006478659) initially produced **14/18 PASS** with intermittent HTTP **503** on public pages `/` and `/giai-phap-dich-vu`; staging Access redirect checks remained correct. A re-run of **only the failed job** against the **same old deployed staging Worker** achieved **18/18 PASS** without any deployment, but does **not** prove the underlying 503 cause is fixed. Recorded separately as [Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) for Worker/platform/upstream investigation; release remains **NO-GO** independently of this anomaly. Do not misreport the initial red attempt as a first-time PASS.

No screenshots, videos, traces or ZIP files are stored in GitHub QA artifacts. Prior public screenshot PNGs reside separately in [IAICT QA Google Drive](https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3); new ephemeral CI screenshots have not been automatically transferred. Private Access cookies and authenticated screenshots must never be uploaded.

## 5. Decision, release strategy and stop conditions

**STAGING CONTROLLED PILOT — CURRENTLY NO-GO.** Before it becomes eligible for **separate human approval**:
1. Review and authorize a safe, non-deploying integration path: fix existing release-branch push-triggered release workflow and manual D1 bootstrap risk **without accidentally launching its old deployment workflow**. Do not simply push to the live release branch.
2. Integrate and verify all reviewed PR lineage changes into a uniquely identified final staged source SHA, plus all approved release gates. Run Git history/CI tests again; pin the exact SHA and separately authorized staging environment deployment.
3. Re-query live Worker version, D1 migrations/Time Travel bookmark, Access paths and at least one active admin immediately before any controlled deployment; ensure a confirmed Worker-only manual rollback target.
4. Obtain explicit authorization to execute **staging only**, then deploy a controlled pilot and conduct private, read-only real Access JWT/CMS login acceptance with authorized staging QA identities. Abort and rollback Worker only if approved and necessary; never auto-restore D1.

**PRODUCTION PROMOTION — CURRENTLY NO-GO.** Even after a staging pilot is approved and released, production requires staging sign-off (including actual Access JWT and role-based access for provisioned identities), separate production Access exact-root protection, operational rollback verification and a new explicit production approval. An absent role cannot be marked PASS; record `NOT TESTED` until authorized QA coverage exists.

## 6. Rollback evidence and immutable identifiers

The Worker-only rollback target, **subject to fresh verification at rollout time**, is `21ef7ce9-6f82-4381-a474-a3fa9678beb6`. The prior historical Worker version `293841c3-5e16-4cb2-bd10-5ae38d299f42` is not the preferred target. D1 Time Travel bookmark availability is verified but no bookmark value, JWT, cookie, email, or secret is embedded in this report. D1 should not be rolled back automatically; it could erase subsequent user writes. See [manual rollback protocol](https://github.com/ntdung-tds/iaict-portal/blob/fix/staging-release-immutable-sha-rollback-gate-20261030/docs/STAGING_CMS_V17_ROLLBACK_APPROVAL_GATE_2026-10-30.md).

**All findings refer to the read-only state reviewed on 30/10/2026; re-validate before any future approval. No merge, deployment, D1 mutation or rollback occurred in this audit.**
