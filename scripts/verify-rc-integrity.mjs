/**
 * Staging RC — independent Git DAG + source-contract verification.
 * Run with FULL git history (checkout fetch-depth: 0). No API credentials.
 * Never merges, deploys, or writes to Cloudflare/D1.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const errors = [];
const assert = (ok, message) => { if (!ok) errors.push(message); };
const source = (path) => readFileSync(path, "utf8");
const contains = (path, text) => assert(source(path).includes(text), `Missing required ${path} contract: ${text}`);

/** Pin actual reviewed PR head commits, never mutable branch names. */
const reviewed = [
  ["PR #8  CMS baseline", "9a270e29723f8f2c61c61609c7b3ff4dc97ff5e1"],
  ["PR #9  Atomic user roles", "328c0289161e3676719707ea134283ecfe31fd9b"],
  ["PR #10 Atomic content CAS", "d63014f5913e97f9e49cc7b4b3d09401a6424a80"],
  ["PR #11 Last-admin D1 guard", "2d2c59f56db1f8b3283f0c9018b6f749640f59fa"],
  ["PR #12 Editor CAS", "27186657cf63ba8c1826414063a586d0e7a73d8f"],
  ["PR #14 Article CAS", "0d0ca788be3c9b2a8e274e80678b4823b114e7ef"],
  ["PR #15 Newsroom review CAS", "2136ce92a9ff12a6cc6abb0bfe69d0ae70a709f1"],
  ["PR #17 Browser QA", "ed9048f0b3f45af826e33406a272f7e24a6371f7"],
  ["PR #18 Scheduler fencing", "4198fcdd253b4e45c8d002aa537f36c3a6f6f7dc"],
  ["PR #19 Access JWT", "1ccca9fea37d2873dde66892ec69435bf09cc749"],
  ["PR #20 Publication policy", "e8dd0d70aeb19d9eee7d38665eb23eed8c4d6ca9"],
  ["PR #21 Release safety", "f3f701c2769a4e779e7e140d5635e499d5b827a9"],
];
const releaseBase = "release/staging-v17-hardened-20261029";
const releaseRef = `refs/remotes/origin/${releaseBase}`;

for (const [label, sha] of reviewed) {
  try {
    git("merge-base", "--is-ancestor", sha, "HEAD");
    console.log(`[rc-graph] PASS: ${label}, commit ${sha.slice(0,12)} is in HEAD ancestry`);
  } catch {
    errors.push(`${label} commit ${sha} missing from RC ancestry`);
  }
}
try {
  git("merge-base", "--is-ancestor", releaseRef, "HEAD");
  console.log(`[rc-graph] PASS: ${releaseBase} is ancestor of this RC`);
} catch {
  errors.push(`RC does not descend from existing ${releaseBase}; do NOT deploy`);
}
for (let i=1;i<reviewed.length;i++) {
  try { git("merge-base", "--is-ancestor", reviewed[i-1][1], reviewed[i][1]); }
  catch { errors.push(`PR order broken: ${reviewed[i-1][0]} is not an ancestor of ${reviewed[i][0]}`); }
}

const migrations = readdirSync("cloudflare/migrations")
  .filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
assert(migrations.length === 21, `Expected 21 migrations; got ${migrations.length}`);
assert(migrations[0] === "0001_core.sql" &&
       migrations.at(-1) === "0021_v17_admin_role_normalization.sql",
       "D1 migration identity changed unexpectedly");
try {
  const changed = git("diff", "--name-only", releaseRef, "HEAD").split("\n").filter(Boolean);
  const canonical = changed.filter(p => /^cloudflare\/migrations\/\d{4}_/.test(p));
  assert(canonical.length === 0, `Forward-only migrations changed from release baseline: ${canonical.join(", ")}`);
  for (const required of [
    "lib/news-scheduler.ts",
    "lib/news-repository.ts",
    "lib/cloudflare-access-jwt.ts",
    "worker.ts",
    "cloudflare.config.ts",
    "scripts/verify-staging-release.mjs",
    "scripts/verify-release-safety.mjs",
    ".github/workflows/deploy-staging.yml",
    ".github/workflows/staging-acceptance.yml",
  ]) {
    assert(changed.includes(required), `Expected security/QA delta missing from RC: ${required}`);
  }
  console.log(`[rc-graph] release branch delta: ${changed.length} files; canonical migrations unchanged`);
} catch (e) {
  errors.push(`Cannot independently compare RC tree to release: ${String(e).slice(0,200)}`);
}

contains("worker.ts", "verifyCloudflareAccessRequest(request");
contains("lib/cloudflare-access-jwt.ts", 'header.alg !== "RS256"');
contains("cloudflare.config.ts", "ACCESS_POLICY_AUD: bindings.text(");
contains("lib/news-repository.ts", "NEWS_AUTO_PUBLISH_GUARD_REQUIRED");
contains("lib/news-repository.ts", "w.auto_publish_enabled=1");
contains("lib/news-scheduler.ts", "NEWS_SCHEDULER_LEASE_LOST");
contains("lib/news-scheduler.ts", "claim.lease_token=?");
contains("scripts/verify-staging-release.mjs", "IAICT_EXPECTED_STAGING_WORKER_VERSION");
contains("scripts/verify-release-safety.mjs", "upload-artifact@");
contains(".github/workflows/deploy-staging.yml", "workflow_dispatch:");
contains(".github/workflows/release-staging-once-20261029.yml", "workflow_dispatch:");

if (errors.length) {
  for (const error of errors) console.error(`[rc-graph] FAIL: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`[rc-graph] PASS: ${reviewed.length} reviewed PR SHA ancestors, 21 unchanged migrations, required security contracts`);
}
