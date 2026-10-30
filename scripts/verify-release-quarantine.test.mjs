import test from "node:test";
import assert from "node:assert/strict";
import {
  auditReleaseQuarantine, expectedQuarantinedWorkflows,
  readWorkflowSources,
} from "./verify-release-quarantine.mjs";

const baseline = () => ({
  "ci.yml": "name: test\non:\n  pull_request:\n",
  "cms-ui-review.yml": "name: cms\n",
  "deploy-staging.yml": expectedQuarantinedWorkflows["deploy-staging.yml"],
  "pages-ui.yml": "name: Pages\nuses: actions/upload-pages-artifact@v5\n",
  "release-staging-once-20261029.yml": expectedQuarantinedWorkflows["release-staging-once-20261029.yml"],
  "runtime-e2e.yml": "name: browser\n",
  "staging-acceptance.yml": "name: live\n",
});
const failed = (inputs, code) =>
  assert.ok(auditReleaseQuarantine(inputs).issues.some(x => x.includes(code)));

test("canonical quarantine allows no Worker release or GitHub QA upload", () => {
  assert.deepEqual(auditReleaseQuarantine(baseline()).issues, []);
});
test("YAML comments and CRLF are permitted", () => {
  const x = baseline();
  x["deploy-staging.yml"] = "# review note\r\n" + x["deploy-staging.yml"].replace(/\n/g, "\r\n");
  assert.equal(auditReleaseQuarantine(x).ok, true);
});
test("legacy release push trigger is denied", () => {
  const x = baseline();
  x["release-staging-once-20261029.yml"] = x["release-staging-once-20261029.yml"]
    .replace("  workflow_dispatch:", "  push:\n    branches: [release/staging-v17-hardened-20261029]");
  failed(x, "LEGACY_DEPLOY_NOT_QUARANTINED");
});
test("manual D1 bootstrap or Worker deploy command is denied", () => {
  const x = baseline();
  x["deploy-staging.yml"] += "      - run: npm run deploy:staging\n";
  failed(x, "LEGACY_DEPLOY_NOT_QUARANTINED");
});
test("removing fail-closed exit is denied", () => {
  const x = baseline();
  x["deploy-staging.yml"] = x["deploy-staging.yml"].replace("          exit 1\n", "");
  failed(x, "LEGACY_DEPLOY_NOT_QUARANTINED");
});
test("a second job is denied", () => {
  const x = baseline();
  x["release-staging-once-20261029.yml"] += "  deploy:\n    runs-on: ubuntu-latest\n";
  failed(x, "LEGACY_DEPLOY_NOT_QUARANTINED");
});
test("GitHub QA artifact upload on staging acceptance is rejected", () => {
  const x = baseline();
  x["staging-acceptance.yml"] += "uses: actions/upload-artifact@v4\n";
  failed(x, "GITHUB_QA_ARTIFACT_UPLOAD_FORBIDDEN");
});
test("GitHub QA artifact upload on CI is rejected", () => {
  const x = baseline();
  x["ci.yml"] += "uses: actions/upload-artifact@v4\n";
  failed(x, "GITHUB_QA_ARTIFACT_UPLOAD_FORBIDDEN");
});
test("a missing legacy workflow is denied", () => {
  const x = baseline();
  delete x["deploy-staging.yml"];
  failed(x, "REQUIRED_WORKFLOW_MISSING");
});
test("Pages-publishing artifacts outside Pages workflow are denied", () => {
  const x = baseline();
  x["runtime-e2e.yml"] += "uses: actions/upload-pages-artifact@v5\n";
  failed(x, "PAGES_ARTIFACT_OUTSIDE_PUBLISHER");
});
test("live repository workflow sources comply", () => {
  const audit = auditReleaseQuarantine(readWorkflowSources());
  assert.deepEqual(audit.issues, []);
  assert.ok(audit.count >= 7);
});
