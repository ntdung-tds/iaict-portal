import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const database = process.env.IAICT_STAGING_D1_NAME ?? "iaict-portal-staging-db";
const config = process.env.IAICT_STAGING_WRANGLER_CONFIG ?? "wrangler.staging-migrations.jsonc";
const migrationsDir = "cloudflare/migrations";
const immutableLegacyMax = 11;

function runWrangler(args, { capture = false } = {}) {
  const result = spawnSync("npx", ["wrangler", ...args], {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = capture ? `\n${result.stdout ?? ""}\n${result.stderr ?? ""}` : "";
    throw new Error(`wrangler ${args.join(" ")} failed with exit code ${result.status}${detail}`);
  }

  return capture ? `${result.stdout ?? ""}\n${result.stderr ?? ""}` : "";
}

function executeCommand(sql, { capture = false, json = false } = {}) {
  const args = [
    "d1",
    "execute",
    database,
    "--remote",
    "--config",
    config,
    "--command",
    sql,
  ];
  if (json) args.push("--json");
  return runWrangler(args, { capture });
}

function collectMigrationNames(value, names = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectMigrationNames(item, names);
    return names;
  }
  if (!value || typeof value !== "object") return names;
  if (typeof value.name === "string" && /^\d{4}_.+\.sql$/.test(value.name)) {
    names.add(value.name);
  }
  for (const item of Object.values(value)) collectMigrationNames(item, names);
  return names;
}

console.log(`[staging-migrations] target=${database}`);
console.log(`[staging-migrations] config=${config}`);

// Match Wrangler's canonical bookkeeping table so a database can be bootstrapped
// without modifying immutable historical migration files.
executeCommand(`CREATE TABLE IF NOT EXISTS d1_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`);

let applied = new Set();
try {
  const raw = executeCommand("SELECT name FROM d1_migrations ORDER BY id;", {
    capture: true,
    json: true,
  });
  applied = collectMigrationNames(JSON.parse(raw.trim()));
} catch (error) {
  console.error("[staging-migrations] unable to read d1_migrations as JSON");
  throw error;
}

const immutableLegacy = readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .filter((name) => Number(name.slice(0, 4)) <= immutableLegacyMax)
  .sort();

for (const name of immutableLegacy) {
  if (applied.has(name)) {
    console.log(`[staging-migrations] skip legacy ${name} (already applied)`);
    continue;
  }

  const file = join(migrationsDir, name);
  console.log(`[staging-migrations] apply immutable legacy ${name} via d1 execute --file`);
  runWrangler([
    "d1",
    "execute",
    database,
    "--remote",
    "--config",
    config,
    "--file",
    file,
  ]);

  const escaped = name.replaceAll("'", "''");
  executeCommand(`INSERT OR IGNORE INTO d1_migrations(name) VALUES ('${escaped}');`);
  applied.add(name);
}

console.log("[staging-migrations] legacy baseline complete; applying forward migrations with Wrangler migrations apply");
runWrangler([
  "d1",
  "migrations",
  "apply",
  database,
  "--remote",
  "--config",
  config,
]);

console.log("[staging-migrations] complete");
