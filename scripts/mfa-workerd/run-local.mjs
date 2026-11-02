#!/usr/bin/env node
/** Build exact TS implementation into an ephemeral local workerd-only probe. */
import { build } from "esbuild";
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const binary = resolve(root, "node_modules/.bin/workerd");
const config = resolve(root, "scripts/mfa-workerd/config.capnp");
const entry = resolve(root, "scripts/mfa-workerd/probe.ts");
const generated = resolve(root, "scripts/mfa-workerd/probe.bundle.mjs");
if (![binary, config, entry].every(existsSync)) {
  console.error("[mfa-workerd] BLOCKED: local binary or source missing");
  process.exit(2);
}
let version = "NOT_DETERMINED";
try { version = JSON.parse(readFileSync(resolve(root, "node_modules/workerd/package.json"), "utf8")).version; }
catch { /* preserve explicit unknown runtime version */ }
let child;
let startupError = null, diagnostics = "";
const sleep = ms => new Promise(done => setTimeout(done, ms));

try {
  await build({
    entryPoints: [entry], outfile: generated, bundle: true,
    platform: "neutral", format: "esm", target: "es2022", logLevel: "silent",
  });
  child = spawn(binary, ["serve", config], {
    cwd: root, stdio: ["ignore", "ignore", "pipe"],
  });
  child.on("error", err => { startupError = err.code || "SPAWN_ERROR"; });
  child.stderr.on("data", part => { diagnostics = (diagnostics + String(part)).slice(-400); });
  let response, data;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (startupError || child.exitCode !== null) break;
    try {
      response = await fetch("http://127.0.0.1:19388/mfa-crypto-probe", {
        signal: AbortSignal.timeout(2000),
      });
      data = await response.json();
      break;
    } catch { await sleep(200); }
  }
  if (!response || !data) throw Error("LOCAL_WORKERD_NO_PROBE: " + (startupError ?? diagnostics.slice(-200)));
  const expected = [
    "NONEXTRACTABLE_KEY", "ENVELOPE_SHAPE", "ROUNDTRIP", "UNIQUE_IV",
    "OWNER_BOUND", "FACTOR_BOUND", "KEY_VERSION_BOUND",
    "SWAPPED_IV_BLOCKED", "SWAPPED_CIPHERTEXT_BLOCKED",
    "WRONG_KEY_BLOCKED", "MALFORMED_IV_BLOCKED",
  ];
  const valid = response.status === 200 && data.test_id === "IAM-FUT-009" &&
    data.runtime === "LOCAL_WORKERD" && data.deployed === false &&
    data.compatibility_date === "2026-10-12" &&
    data.passed === expected.length &&
    Object.keys(data.results || {}).length === expected.length &&
    expected.every(key => data.results[key] === "PASS");
  console.log("[mfa-workerd] OBSERVED " + JSON.stringify({
    source: "lib/mfa-secret-crypto.ts (esbuild bundled into isolated workerd)",
    workerd_npm_version: version, compatibility_date: data.compatibility_date,
    test_id: "IAM-FUT-009", passed: data.passed,
    check_ids: expected, verdict: valid ? "PASS" : "FAIL",
    actual_http_status: response.status, worker_deployed: false,
    credentials_used: false, d1_r2_access_used: false,
  }));
  if (!valid) throw Error("ISOLATED_AES_GCM_PROBE_FAILED_" + (data.sanitized_error ?? response.status));
} catch (error) {
  console.error("[mfa-workerd] FAIL " + (error instanceof Error ? error.message : "UNKNOWN"));
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null) child.kill("SIGTERM");
  await rm(generated, { force: true });
}
