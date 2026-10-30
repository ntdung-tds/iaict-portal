import test from "node:test";
import assert from "node:assert/strict";
import { evaluateStagingRelease } from "./release-readiness.mjs";

const sha = "a".repeat(40);
const releaseBranch = "release/staging-v17-hardened-20261029";
const workflow = `name: release
on:
  workflow_dispatch:
    inputs:
      expected_worker_version:
        required: true
      approved_release_sha:
        required: true
jobs:
  deploy:
    env:
      IAICT_APPROVED_STAGING_COMMIT: \$\{{ inputs.approved_release_sha }}
      IAICT_EXPECTED_STAGING_WORKER_VERSION: \$\{{ inputs.expected_worker_version }}
    steps:
      - run: node scripts/verify-staging-release.mjs
`;
const ready = {
  releaseBranch,
  candidateSha: sha,
  releaseAncestor: true,
  changedCanonicalMigrations: [],
  releaseWorkflow: workflow,
  manualDeployWorkflow: workflow,
  approvedCandidateSha: sha,
  realAccessJwtAcceptance: true,
  authorizedQaIdentity: true,
};
const assess = change => evaluateStagingRelease({ ...ready, ...change });
const has = (result, code) => result.blockers.some(x => x.code === code);

test("a fully controlled, reviewed candidate is only eligible for *separate* approval", () => {
  const result = assess({});
  assert.equal(result.decision, "ELIGIBLE_FOR_MANUAL_APPROVAL");
  assert.equal(result.blockerCount, 0);
});

test("the deployed release workflow's push trigger is a hard NO-GO", () => {
  const result = assess({ releaseWorkflow: workflow.replace(
    "on:\n  workflow_dispatch:", "on:\n  push:\n    branches: [release/staging-v17-hardened-20261029]\n  workflow_dispatch:",
  ) });
  assert.equal(result.decision, "NO_GO");
  assert.ok(has(result, "LIVE_RELEASE_PUSH_TRIGGER"));
});

test("an unsafe manually dispatched staging workflow with auto migrations blocks release", () => {
  const result = assess({ manualDeployWorkflow: workflow +
    "\n      - run: npm run deploy:staging\n" });
  assert.ok(has(result, "LIVE_DEPLOY_MAY_MIGRATE"));
});

test("the deployed branch, not the safer draft PR head, determines release safety", () => {
  const old = `name: old
on:
  workflow_dispatch:
jobs:
  deploy:
    steps:
      - run: npm run verify
`;
  const result = assess({ releaseWorkflow: old });
  assert.ok(has(result, "LIVE_DEPLOY_NO_APPROVED_SHA"));
  assert.ok(has(result, "LIVE_DEPLOY_NO_VERSION_PIN"));
  assert.ok(has(result, "LIVE_DEPLOY_NO_PREFLIGHT"));
});

test("no recorded human-approved exact SHA means NO-GO", () => {
  for (const approvedCandidateSha of [undefined, "", "b".repeat(40)]) {
    const result = assess({ approvedCandidateSha });
    assert.ok(has(result, "HUMAN_RELEASE_APPROVAL_MISSING"));
  }
});

test("a candidate missing the release baseline or modifying applied migrations is blocked", () => {
  assert.ok(has(assess({ releaseAncestor: false }), "RELEASE_BASE_NOT_ANCESTOR"));
  assert.ok(has(assess({ changedCanonicalMigrations: ["cloudflare/migrations/0014_v16_news_auto_publish_policy.sql"] }),
    "MIGRATION_HISTORY_MUTATED"));
});

test("synthetic JWT test success cannot substitute for real Access JWT acceptance", () => {
  const result = assess({ realAccessJwtAcceptance: false });
  assert.equal(result.decision, "NO_GO");
  assert.ok(has(result, "REAL_JWT_ACCEPTANCE_PENDING"));
});

test("missing authorized non-admin acceptance is recorded as a blocker, not hidden as PASS", () => {
  const result = assess({ authorizedQaIdentity: false });
  assert.ok(has(result, "ROLE_QA_IDENTITY_GAP"));
});

test("unrecognized branch or nonimmutable candidate SHA is a blocker", () => {
  assert.ok(has(assess({ releaseBranch: "main" }), "RELEASE_BRANCH_UNEXPECTED"));
  assert.ok(has(assess({ candidateSha: "HEAD" }), "RC_SHA_NOT_IMMUTABLE"));
});
