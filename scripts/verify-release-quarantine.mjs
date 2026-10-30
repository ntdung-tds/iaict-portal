/**
 * Exact, fail-closed quarantine of dangerous legacy staging deploy workflows.
 * This SOURCE check cannot disable active workflow registrations on release.
 */
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";

const manual = [
  "name: HOLD - legacy manual staging deployment quarantined",
  "on:",
  "  workflow_dispatch:",
  "permissions:",
  "  contents: read",
  "jobs:",
  "  blocked:",
  "    runs-on: ubuntu-latest",
  "    timeout-minutes: 2",
  "    steps:",
  "      - name: Fail closed - D1 and Worker deployment prohibited",
  "        run: |",
  '          echo "::error::Legacy manual deploy is quarantined. No Cloudflare credentials or D1 migration commands are used."',
  '          echo "::error::See docs/STAGING_RELEASE_BRANCH_QUARANTINE_2026-10-30.md"',
  "          exit 1",
].join("\n") + "\n";
const automatic = [
  "name: HOLD - legacy one-time staging release quarantined",
  "on:",
  "  workflow_dispatch:",
  "permissions:",
  "  contents: read",
  "jobs:",
  "  blocked:",
  "    runs-on: ubuntu-latest",
  "    timeout-minutes: 2",
  "    steps:",
  "      - name: Fail closed - release authorization required",
  "        run: |",
  '          echo "::error::Legacy staging release workflow is quarantined. No Worker or D1 deployment is permitted."',
  '          echo "::error::See docs/STAGING_RELEASE_BRANCH_QUARANTINE_2026-10-30.md"',
  "          exit 1",
].join("\n") + "\n";

export const expectedQuarantinedWorkflows = Object.freeze({
  "deploy-staging.yml": manual,
  "release-staging-once-20261029.yml": automatic,
});
const requiredWorkflows = Object.freeze([
  "ci.yml", "cms-ui-review.yml", "deploy-staging.yml", "pages-ui.yml",
  "release-staging-once-20261029.yml", "runtime-e2e.yml",
  "staging-acceptance.yml",
]);

// Ignore YAML comments and newline platform differences; all executable
// YAML fields, workflow steps and exact shell commands remain immutable.
export function withoutYamlComments(value) {
  return String(value).replace(/\r\n/g, "\n").split("\n")
    .filter(line => line.trim().length > 0 && !/^\s*#/.test(line))
    .join("\n").trim() + "\n";
}
export function auditReleaseQuarantine(workflows) {
  const issues = [];
  const names = Object.keys(workflows);
  for (const name of requiredWorkflows) {
    if (!Object.hasOwn(workflows, name)) {
      issues.push("REQUIRED_WORKFLOW_MISSING:" + name);
    }
  }
  for (const [name, expected] of Object.entries(expectedQuarantinedWorkflows)) {
    if (!Object.hasOwn(workflows, name)) continue;
    if (withoutYamlComments(workflows[name]) !== withoutYamlComments(expected)) {
      issues.push("LEGACY_DEPLOY_NOT_QUARANTINED:" + name);
    }
  }
  // A Pages website-publishing artifact is not a GitHub QA artifact.
  for (const name of names) {
    const source = withoutYamlComments(workflows[name]);
    if (/actions\/upload-artifact@/i.test(source)) {
      issues.push("GITHUB_QA_ARTIFACT_UPLOAD_FORBIDDEN:" + name);
    }
    if (name !== "pages-ui.yml" && /actions\/upload-pages-artifact@/i.test(source)) {
      issues.push("PAGES_ARTIFACT_OUTSIDE_PUBLISHER:" + name);
    }
  }
  return { ok: issues.length === 0, issues, count: names.length };
}
export function readWorkflowSources(directory = ".github/workflows") {
  const sources = {};
  for (const name of readdirSync(directory).filter(x => /\.ya?ml$/.test(x))) {
    sources[name] = readFileSync(join(directory, name), "utf8");
  }
  return sources;
}
if (process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const audit = auditReleaseQuarantine(readWorkflowSources());
  if (!audit.ok) {
    for (const issue of audit.issues) console.error("[release-quarantine] FAIL: " + issue);
    process.exitCode = 1;
  } else {
    console.log("[release-quarantine] PASS: " + audit.count + " workflows; both legacy deploy paths fail closed; no GitHub QA uploads");
  }
}
