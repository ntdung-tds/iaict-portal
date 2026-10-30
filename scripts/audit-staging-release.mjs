import { execFileSync } from "node:child_process";
import { evaluateStagingRelease } from "./release-readiness.mjs";

// Audit a separate immutable staging candidate against the ACTUAL remote
// release branch's workflow content. No Cloudflare credentials or write calls.
const git = (...args) => execFileSync("git", args, {
  encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
}).trim();
const releaseBranch = "release/staging-v17-hardened-20261029";
const release = "refs/remotes/origin/" + releaseBranch;
const head = git("rev-parse", "HEAD");
const intended = process.env.IAICT_FROZEN_CANDIDATE_SHA;
// On the audit branch, head includes audit documentation commits. Its ancestor
// must still contain the original audited full CMS release candidate commit.
const sourceCandidate = "5fd56b8609f3dd8049f5826f0f402d741a5a574b";
const shaValid = /^[a-f0-9]{40}$/i.test(head);
const exists = (...args) => {
  try { execFileSync("git", args, {stdio:"ignore"}); return true; }
  catch { return false; }
};
if (!exists("merge-base", "--is-ancestor", sourceCandidate, "HEAD")) {
  throw new Error("The audit branch no longer includes the fully tested source candidate");
}
const baseAncestor = exists("merge-base", "--is-ancestor", release, "HEAD");
const migrationDelta = git("diff", "--name-only", release, "HEAD")
  .split("\n").filter(path => /^cloudflare\/migrations\/\d{4}_/.test(path));
const fromRelease = (path) => git("show", `${release}:${path}`);
const result = evaluateStagingRelease({
  releaseBranch,
  candidateSha: shaValid ? head : "",
  releaseAncestor: baseAncestor,
  changedCanonicalMigrations: migrationDelta,
  releaseWorkflow: fromRelease(".github/workflows/release-staging-once-20261029.yml"),
  manualDeployWorkflow: fromRelease(".github/workflows/deploy-staging.yml"),
  approvedCandidateSha: intended,
  realAccessJwtAcceptance: false,  // Cannot be certified without live new Worker.
  authorizedQaIdentity: false,     // Real non-admin identity matrix incomplete.
  productionAccessRootsReady: false, // Explicit production exact root coverage missing.
});
console.log(`[release-audit] AUDIT_COMPLETED decision=${result.decision} candidate_sha=${head}`);
for (const blocker of result.stagingBlockers) {
  console.log(`[release-audit] BLOCKER ${blocker.code}: ${blocker.detail}`);
}
console.log(`[release-audit] staging_blockers=${result.stagingBlockerCount}, promotion=${result.promotionDecision}, acceptance_blockers=${result.promotionBlockers.map(x => x.code).join(",")}, canonical_migration_delta=${migrationDelta.length}, baseline_ancestor=${baseAncestor}`);
if (process.argv.includes("--require-go") && result.decision !== "ELIGIBLE_FOR_MANUAL_STAGING_PILOT_REVIEW") {
  process.exitCode = 2;
}
