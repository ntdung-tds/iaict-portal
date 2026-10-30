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
