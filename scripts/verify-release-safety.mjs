/**
 * Read-only static release safety policy, run on EVERY pull request.
 * The runner may generate screenshots, but GitHub must not retain QA media.
 * Authenticated direct-to-Drive PNG uploads need separately approved CI credentials.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const workflowsDir = ".github/workflows";
const workflows = readdirSync(workflowsDir)
  .filter(name => /\.ya?ml$/.test(name));
const issues = [];
const read = path => readFileSync(path, "utf8");
const fail = reason => issues.push(reason);

for (const name of workflows) {
  const file = join(workflowsDir, name);
  const source = read(file);
  // Never use GitHub Actions artifact storage for test images, videos or traces.
  // GitHub Pages deployable-site artifact is a separate publishing format.
  if (/uses:\s*actions\/upload-artifact@/i.test(source)) {
    fail(`${file}: QA artifact upload to GitHub is prohibited`);
  }
}

const manualWorkflows = [
  "deploy-staging.yml",
  "release-staging-once-20261029.yml",
];
for (const name of manualWorkflows) {
  const source = read(join(workflowsDir, name));
  const trigger = source.match(/^on:\s*\n([\s\S]*?)(?=^permissions:|^concurrency:|^jobs:)/m)?.[1];
  if (!trigger || !/^[ \t]+workflow_dispatch:\s*$/m.test(trigger) ||
      /^[ \t]+(?:push|pull_request|schedule):\s*$/m.test(trigger)) {
    fail(`${name}: staging deployment must be dispatch-only`);
  }
  if (!source.includes("expected_worker_version") ||
      !source.includes("IAICT_EXPECTED_STAGING_WORKER_VERSION")) {
    fail(`${name}: explicitly pinned live staging Worker version required`);
  }
  if (!source.includes("approved_release_sha") ||
      !source.includes("IAICT_APPROVED_STAGING_COMMIT") ||
      !source.includes('test "$GITHUB_SHA" = "$IAICT_APPROVED_STAGING_COMMIT"')) {
    fail(`${name}: explicit immutable release SHA approval must match GitHub dispatch SHA`);
  }
  if (!source.includes("scripts/verify-staging-release.mjs")) {
    fail(`${name}: read-only Cloudflare/D1 preflight required`);
  }
  if (!source.includes("refs/heads/release/staging-v17-hardened-20261029")) {
    fail(`${name}: restrict deployment to authorized release branch`);
  }
  if (!source.includes("environment: staging")) {
    fail(`${name}: staging GitHub environment required`);
  }
  if (/npm run deploy:staging|migrate:staging|migrate:production|deploy:production/.test(source)) {
    fail(`${name}: release may not implicitly migrate D1 or deploy production`);
  }
}

const preflight = read("scripts/verify-staging-release.mjs");
if (!preflight.includes("IAICT_EXPECTED_STAGING_WORKER_VERSION") ||
    !preflight.includes("deployedVersion === expectedWorkerVersion")) {
  fail("staging preflight must compare manually pinned Worker version to live deployment");
}
if (!preflight.includes("validateApprovedStagingCommit") ||
    !preflight.includes("GITHUB_SHA") ||
    !preflight.includes("validateRollbackReadiness") ||
    !preflight.includes("/versions/") ||
    !preflight.includes("/time_travel/bookmark")) {
  fail("Staging preflight must verify reviewed source SHA, retrievable Worker rollback and D1 bookmark");
}
if (!preflight.includes('remote.length === local.length') ||
    !preflight.includes('remote.every((name, i) => name === local[i])')) {
  fail("staging preflight must fail if D1 migration histories diverge");
}


// A pinned staging release must independently query Access and verify exact
// /admin, /api/admin roots and wildcard descendants; otherwise a prefix can
// escape an edge Access application despite passing signed JWT unit tests.
const pathAudit = read("scripts/audit-access-paths.mjs");
if (!preflight.includes("auditAccessApplication") ||
    !preflight.includes("access/apps/") ||
    !pathAudit.includes("ACCESS_DESTINATION_MISSING")) {
  fail("staging preflight requires live Cloudflare Access destination audit");
}
for (const exact of ['"/admin"', '"/admin/*"', '"/api/admin"', '"/api/admin/*"']) {
  if (!pathAudit.includes(exact)) {
    fail(`Access destination audit must require ${exact}`);
  }
}
if (!pathAudit.includes("application.destinations") ||
    !pathAudit.includes("ACCESS_PUBLIC_OVERRIDE_REQUIRES_REVIEW")) {
  fail("Access audit must inspect current destinations and reject public bypass overrides");
}

// The CMS release must never rely only on synthetic JWTs: public key
// readiness, active D1 administrators and the exact Access roots are gates.
if (!preflight.includes("active_admins") ||
    !preflight.includes("No active CMS administrator")) {
  fail("Staging release must check active admin accounts in D1 without reading user identities");
}
for (const name of manualWorkflows) {
  const source = read(join(workflowsDir, name));
  if (!source.includes("verify-access-jwks-readiness.mjs")) {
    fail(`${name}: public Cloudflare Access JWKS preflight is required`);
  }
}
if (!read(join(workflowsDir, "ci.yml")).includes("verify-access-jwks-readiness.mjs")) {
  fail("Every PR must exercise the read-only public Access key readiness probe");
}

if (issues.length) {
  for (const issue of issues) console.error(`[release-safety] FAIL: ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`[release-safety] PASS: ${workflows.length} workflow files, no GitHub QA uploads, staging manual-only and fail-closed`);
}
