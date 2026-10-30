/**
 * Pure assessment of staging release authority, never an authorization to deploy.
 * Passing unit/Chromium CI does NOT imply production-like Cloudflare Access
 * acceptance, rollout approval or safe on-branch workflows.
 */
export function evaluateStagingRelease(input) {
  const blockers = [];
  const add = (code, detail) => blockers.push({ code, detail });
  const branch = input.releaseBranch ?? "";
  const sha = input.candidateSha ?? "";
  const release = input.releaseWorkflow ?? "";
  const deploy = input.manualDeployWorkflow ?? "";

  if (branch !== "release/staging-v17-hardened-20261029") {
    add("RELEASE_BRANCH_UNEXPECTED", "The release branch is not the pinned staging branch.");
  }
  if (!/^[a-f0-9]{40}$/i.test(sha)) {
    add("RC_SHA_NOT_IMMUTABLE", "A complete 40-hex candidate commit SHA is required.");
  }
  if (!input.releaseAncestor) {
    add("RELEASE_BASE_NOT_ANCESTOR", "Candidate does not descend from the staging release baseline.");
  }
  if (input.changedCanonicalMigrations?.length) {
    add("MIGRATION_HISTORY_MUTATED", "Previously applied D1 migration files changed.");
  }
  // Inspect the workflows **on the actual release branch**, not the proposed
  // PR head. GitHub executes branch-resident workflows at dispatch/push time.
  if (/^on:\s*\n\s+push:/m.test(release)) {
    add("LIVE_RELEASE_PUSH_TRIGGER", "The currently deployed release branch still triggers Worker deployment on push.");
  }
  for (const [label, workflow] of [["one-time-release", release], ["manual-staging", deploy]]) {
    if (!/^on:\s*\n\s+workflow_dispatch:/m.test(workflow)) {
      add("LIVE_DEPLOY_NOT_MANUAL_ONLY", label + " must be workflow_dispatch only.");
    }
    if (!workflow.includes("approved_release_sha") ||
        !workflow.includes("IAICT_APPROVED_STAGING_COMMIT")) {
      add("LIVE_DEPLOY_NO_APPROVED_SHA", label + " does not enforce immutable approved commit SHA.");
    }
    if (!workflow.includes("expected_worker_version") ||
        !workflow.includes("IAICT_EXPECTED_STAGING_WORKER_VERSION")) {
      add("LIVE_DEPLOY_NO_VERSION_PIN", label + " does not pin the live Worker rollback version.");
    }
    if (!workflow.includes("verify-staging-release.mjs")) {
      add("LIVE_DEPLOY_NO_PREFLIGHT", label + " does not execute the staged read-only preflight.");
    }
    if (/npm run deploy:staging|migrate:staging|migrate:production/i.test(workflow)) {
      add("LIVE_DEPLOY_MAY_MIGRATE", label + " contains automatic D1 migration/deployment shortcut.");
    }
  }
  if (input.approvedCandidateSha !== sha) {
    add("HUMAN_RELEASE_APPROVAL_MISSING", "Reviewed immutable candidate SHA has not been separately authorized for staging.");
  }
  // Live Access-issued JWT acceptance necessarily happens AFTER the new Worker
  // reaches a controlled staging pilot. Never make it a prerequisite to the
  // staging pilot itself, or the rollout would be impossible to authorize.
  const promotionBlockers = [];
  if (!input.realAccessJwtAcceptance) {
    promotionBlockers.push({
      code: "REAL_JWT_ACCEPTANCE_PENDING",
      detail: "Live Access JWT/role acceptance remains NOT TESTED on the new Worker.",
    });
  }
  if (!input.authorizedQaIdentity) {
    promotionBlockers.push({
      code: "ROLE_QA_IDENTITY_GAP",
      detail: "No authorized real non-admin identity matrix has been accepted on staging.",
    });
  }
  if (!input.productionAccessRootsReady) {
    promotionBlockers.push({
      code: "PRODUCTION_ACCESS_ROOTS_MISSING",
      detail: "Production exact /admin and /api/admin Access destinations are not yet configured.",
    });
  }
  // These are AUDIT verdicts, never permission to dispatch. An approved
  // controlled staging pilot has a different gate from production promotion.
  return {
    decision: blockers.length ? "NO_GO" : "ELIGIBLE_FOR_MANUAL_STAGING_PILOT_REVIEW",
    stagingBlockerCount: blockers.length,
    stagingBlockers: blockers,
    promotionDecision: blockers.length || promotionBlockers.length ? "NO_GO" : "ELIGIBLE_FOR_PRODUCTION_REVIEW",
    promotionBlockers,
  };
}
