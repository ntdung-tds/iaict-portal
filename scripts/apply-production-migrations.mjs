import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const database = process.env.IAICT_PRODUCTION_D1_NAME ?? "iaict-portal-db";
const config = process.env.IAICT_PRODUCTION_WRANGLER_CONFIG ?? "wrangler.production-migrations.jsonc";
const migrationsDir = "cloudflare/migrations";

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

  return capture ? (result.stdout ?? "") : "";
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

console.log(`[production-migrations] target=${database}`);
console.log(`[production-migrations] config=${config}`);
console.log("[production-migrations] mode=canonical-file-import");

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
  console.error("[production-migrations] unable to read d1_migrations as JSON");
  throw error;
}

const migrations = readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();

for (const name of migrations) {
  if (applied.has(name)) {
    console.log(`[production-migrations] skip ${name} (already applied)`);
    continue;
  }

  const file = join(migrationsDir, name);
  console.log(`[production-migrations] apply ${name} via d1 execute --file`);
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

console.log("[production-migrations] verifying Wrangler sees no pending migrations");
runWrangler([
  "d1",
  "migrations",
  "list",
  database,
  "--remote",
  "--config",
  config,
]);

console.log(`[production-migrations] complete (${applied.size}/${migrations.length} recorded)`);
