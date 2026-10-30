/**
 * Safe, read-only staging preflight for a one-time CMS v17 release.
 *
 * Fails closed if Worker version, D1 ID, account, or migration set differs.
 * No SQL changes and no secret values are printed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { auditAccessApplication } from "./audit-access-paths.mjs";

const accountId = "bad2f1dcbd36ca891c3e312d610a22cd";
const databaseId = "aa4a97e7-60c5-4da4-9f0b-d469ece811b4";
const worker = "iaict-portal-staging";
const expectedWorkerVersion = process.env.IAICT_EXPECTED_STAGING_WORKER_VERSION;
// A human must identify the exact live Worker version when explicitly starting
// the staging release. Never use a stale version hardcoded in an old workflow.
if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(expectedWorkerVersion ?? "")) {
  throw new Error("[staging-preflight] Expected Worker version UUID is required. No deployment permitted.");
}
const token = process.env.CLOUDFLARE_API_TOKEN;

function assert(ok, message) {
  if (!ok) throw new Error(`[staging-preflight] ${message}`);
}

assert(token, "Cloudflare API token missing. No deployment permitted.");
assert(process.env.CLOUDFLARE_ACCOUNT_ID === accountId, "Cloudflare account does not match pinned staging account.");

const config = JSON.parse(
  readFileSync("wrangler.staging-migrations.jsonc", "utf8").replace(/^\s*\/\/.*$/gm, ""),
);
assert(config.name === "iaict-portal-staging-migrations", "Unexpected D1 migration config Worker.");
const binding = config.d1_databases?.find((item) => item.binding === "DB");
assert(binding?.database_id === databaseId, "Staging D1 database ID mismatch.");
assert(binding?.database_name === "iaict-portal-staging-db", "Staging D1 name mismatch.");

const local = readdirSync("cloudflare/migrations")
  .filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
assert(local.length === 21, `Expected 21 local migrations, got ${local.length}.`);
assert(local.at(-1) === "0021_v17_admin_role_normalization.sql", "Unexpected migration end.");

async function cf(method, path, body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  assert(response.ok && data.success, `${method} ${path} was not permitted or failed (HTTP ${response.status}).`);
  return data.result;
}
const root = `/accounts/${accountId}`;
const deployments = await cf("GET", `${root}/workers/scripts/${worker}/deployments`);
const deployedVersion = deployments.deployments?.[0]?.versions?.[0]?.version_id;
assert(deployments.deployments?.[0]?.versions?.[0]?.percentage === 100, "Staging Worker currently split across versions.");
assert(deployedVersion === expectedWorkerVersion,
  `Worker changed from the explicitly pinned live staging version. Expected ${expectedWorkerVersion}, got ${deployedVersion || "none"}.`);

const result = await cf("POST", `${root}/d1/database/${databaseId}/query`, {
  sql: "SELECT name FROM d1_migrations ORDER BY name",
});
const rows = Array.isArray(result) ? result[0]?.results : result?.results;
assert(Array.isArray(rows), "Could not read staging D1 migration history.");
const remote = rows.map((r) => r.name).sort();
assert(remote.length === local.length && remote.every((name, i) => name === local[i]),
  "Staging database migration history does not match the release. No deployment.");

// Validate the authorization database is ready without reading identities.
// A valid Access session would still be locked out if no active CMS admin exists.
const adminResult = await cf("POST", `${root}/d1/database/${databaseId}/query`, {
  sql: `SELECT COUNT(DISTINCT u.id) AS active_admins
    FROM admin_users u
    JOIN admin_user_roles ur ON ur.user_id=u.id
    JOIN roles r ON r.id=ur.role_id
    WHERE u.is_active=1 AND r.code='admin'`,
});
const adminRows = Array.isArray(adminResult) ? adminResult[0]?.results : adminResult?.results;
const activeAdmins = Number(adminRows?.[0]?.active_admins);
assert(Number.isSafeInteger(activeAdmins) && activeAdmins >= 1,
  "No active CMS administrator in staging D1; would lock out all Access-authenticated admins. No deployment.");
console.log(`[staging-preflight] Active CMS admin readiness PASS (${activeAdmins} present; identities not read).`);

// Cloudflare Access public destinations have to include BOTH exact roots and
// descendants. The /api/admin/* wildcard is not treated as proof for /api/admin.
// The newer destinations array supersedes deprecated self_hosted_domains.
const stagingAccessAppId = "b9d6786d-8ba8-4b72-ab7b-ebf8c29ed715";
const stagingAccessHostname = "iaict-portal-staging.iaict-platform.workers.dev";
const expectedStagingAudience = "c21e351bf4647a54e10e65348f2cca417de5203fe606c2281d43fa8c08d007e8";
const workerConfig = readFileSync("cloudflare.config.ts", "utf8");
assert(workerConfig.includes(expectedStagingAudience),
  "Pinned staging AUD disagrees with code Worker Access AUD binding.");
const accessApp = await cf("GET", `${root}/access/apps/${stagingAccessAppId}`);
const access = auditAccessApplication({
  application: accessApp,
  hostname: stagingAccessHostname,
  audience: expectedStagingAudience,
});
assert(access.ok,
  `Access staging app has incomplete destinations/policy: ${access.problems.join(", ")}; missing ${access.missing.join(", ")}. No deployment.`);
console.log("[staging-preflight] Cloudflare Access staging roots, descendants and AUD verified.");

console.log(`[staging-preflight] PASS: account, pinned staging Worker, D1 ID, ${remote.length} matching migrations.`);

try {
  const bookmark = await cf("GET", `${root}/d1/database/${databaseId}/time_travel/bookmark`);
  console.log(`[staging-preflight] D1 Time Travel bookmark: ${bookmark.bookmark ?? "unavailable"}`);
} catch {
  console.warn("[staging-preflight] D1 bookmark unavailable to CI token; prior bookmark captured via Cloudflare API.");
}
