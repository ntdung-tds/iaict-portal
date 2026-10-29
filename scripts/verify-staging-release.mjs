/**
 * Safe, read-only staging preflight for a one-time CMS v17 release.
 *
 * Fails closed if Worker version, D1 ID, account, or migration set differs.
 * No SQL changes and no secret values are printed.
 */
import { readdirSync, readFileSync } from "node:fs";

const accountId = "bad2f1dcbd36ca891c3e312d610a22cd";
const databaseId = "aa4a97e7-60c5-4da4-9f0b-d469ece811b4";
const worker = "iaict-portal-staging";
const expectedWorkerVersion = "293841c3-5e16-4cb2-bd10-5ae38d299f42";
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
  `Worker changed from pinned v42. Expected ${expectedWorkerVersion}, got ${deployedVersion || "none"}.`);

const result = await cf("POST", `${root}/d1/database/${databaseId}/query`, {
  sql: "SELECT name FROM d1_migrations ORDER BY name",
});
const rows = Array.isArray(result) ? result[0]?.results : result?.results;
assert(Array.isArray(rows), "Could not read staging D1 migration history.");
const remote = rows.map((r) => r.name).sort();
assert(remote.length === local.length && remote.every((name, i) => name === local[i]),
  "Staging database migration history does not match the release. No deployment.");
console.log(`[staging-preflight] PASS: account, Worker v42, D1 ID, ${remote.length} matching migrations.`);

try {
  const bookmark = await cf("GET", `${root}/d1/database/${databaseId}/time_travel/bookmark`);
  console.log(`[staging-preflight] D1 Time Travel bookmark: ${bookmark.bookmark ?? "unavailable"}`);
} catch {
  console.warn("[staging-preflight] D1 bookmark unavailable to CI token; prior bookmark captured via Cloudflare API.");
}
