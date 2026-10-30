# IAICT Portal — staging release-branch emergency quarantine (30 October 2026)

**Status:** DRAFT PROPOSAL ONLY. This document and the four workflow edits live on `safety/quarantine-release-workflows-20261030`; the existing `release/staging-v17-hardened-20261029` branch has NOT been modified.

## Confirmed hazards in the ACTUAL release branch

1. `.github/workflows/release-staging-once-20261029.yml` is **push-triggered** on the release branch; a normal commit may initiate a staging deployment without explicit approved source SHA. It uses an outdated live Worker version and has an Actions artifact upload on failure.
2. `.github/workflows/deploy-staging.yml` is a manually dispatched shortcut that runs `npm run deploy:staging`, potentially bootstrapping or migrating staging D1 without the new fail-closed source and rollback gates.
3. Existing CI and staging-acceptance workflows upload QA traces/report artifacts to GitHub on failures, contradicting the new QA evidence policy.

## What this isolated Draft PR changes

- Replaces BOTH legacy deployment workflows with manually triggerable **hard-stop** jobs. They hold no Cloudflare secrets, never invoke migrations or deployment and always `exit 1` when manually dispatched. The `push` deployment trigger is removed.
- Removes `actions/upload-artifact` steps from `.github/workflows/ci.yml` and `.github/workflows/staging-acceptance.yml`. Test output may remain transient on the Actions runner, but **no QA screenshots, ZIPs, traces or videos are uploaded as GitHub artifacts**. Existing Google Pages website publishing artifacts are separate and are not QA evidence.
- Does NOT merge the frozen source candidate, does NOT authorize staging, does NOT touch Worker, production, D1 or Access.

## Crucial: how to prevent a push-triggered deployment DURING any future integration

**Do not simply merge this PR into the release branch.** Merging is a push event, and the old release branch currently has a push-triggered workflow. Before *any* write to the release branch, the repository maintainer must explicitly approve a change-control window AND independently disable both old staging deployment workflows through GitHub Actions workflow management, verify that no legacy deployment job is queued/running and confirm that Cloudflare credentials cannot be exercised by an old in-flight run. If these preconditions cannot be verified, STOP; keep this PR draft and do not modify the release branch.

Only after the old workflows are verifiably disabled and explicit authorization is recorded, consider merging the quarantine PR **as a separate, non-deploying change**. Then read back the actual release-branch workflow YAML (not just the PR diff) and verify: (a) there is no `push` staging deploy trigger; (b) neither manual path can execute Cloudflare/D1 commands; (c) no GitHub QA uploads; (d) the staging and production Worker version IDs remain unchanged. Keep the old workflows disabled while conducting this check.

## Future controlled staging candidate — separate approval

The previously reviewed candidate source is `5fd56b8609f3dd8049f5826f0f402d741a5a574b` (Draft PR #28). This quarantine branch is NOT that candidate, and its head SHA is NOT an approved source SHA. The proposed release implementation from PR #28 requires a separate, explicitly reviewed integration path and a freshly pinned final 40-character commit SHA. Its safe manual deployment gate must independently check live Worker version/recoverable previous version, current D1 migration set and Time Travel bookmark, active CMS admin, exact staging Access roots, and JWKS readiness; it must never auto-migrate D1.

Only after an authorized **staging-only** pilot may real Cloudflare Access-issued JWT/CMS role acceptance be tested privately. Production stays NO-GO until production exact-root Access protection, real signed-JWT/role acceptance and separate production authorization are completed. The intermittent staging 503 is tracked in Issue #30; a passing retry is not proof the root cause is fixed.

## QA evidence policy

Individual public PNGs belong in the existing private Google Drive folder: https://drive.google.com/drive/folders/1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3 . Never upload QA image/video/trace ZIPs or private Access cookies to GitHub. This PR does not add new PNGs.

## Stop conditions

Abort preparation if any workflow, approval, source SHA, D1 baseline, Worker version, Access destination or QA identity cannot be proven. No Worker rollback, D1 Time Travel restore, GitHub branch merge, Worker deploy, Access write or database write is authorized by this document.

## Operator-only GitHub workflow shutdown checklist (not executed)

The connected GitHub interface here supports read-only workflow-run inspection but **does not expose workflow disable/enable, branch ruleset management or cancel-running-workflow actions**. The checks in this PR cannot disable an already-active remote workflow; a repository maintainer must perform and verify that separate GitHub administrative action.

1. Open **GitHub repository → Actions**; choose workflow `one-time-staging-cms-v17-release` (file `release-staging-once-20261029.yml`). Open the workflow's `...` menu and choose **Disable workflow**. Repeat for `deploy-staging` (file `deploy-staging.yml`). If a workflow is not visible, STOP; absence from the sidebar is not proof that it is disabled.
2. Verify both workflow registrations show **disabled** through repository Actions state or a privileged GitHub API read. GitHub's documented REST/CLI management allows disabling without pushing a commit. Disabling **does not cancel already-running jobs**, so independently verify no queued/in-progress/waiting staging deployment run remains.
3. Create/apply a branch protection rule or repository ruleset targeting precisely `release/staging-v17-hardened-20261029`, requiring reviewed pull requests and passing required status checks; block direct pushes/force pushes and minimize bypass privileges. **As of this review, the release branch is NOT protected.** Rules are not a substitute for disabling the old deployment workflows.
4. Re-check current release branch SHA and deployed staging Worker version, then request separate authorization for a **non-deploying merge of this quarantine PR**. Do not merge before all controls above are demonstrably in effect.

After the quarantine is actually integrated, its CI guard `scripts/verify-release-quarantine.mjs` will enforce exact, fail-closed legacy YAML and prohibit GitHub QA artifact upload for any discovered workflow. The guard has standalone positive/negative tests and runs as a dedicated step in `portal-ci`. No CI success authorizes deploy.

Official GitHub reference: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows ; https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
