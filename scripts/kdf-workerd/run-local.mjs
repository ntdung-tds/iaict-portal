#!/usr/bin/env node
// Launch a self-contained workerd process on loopback; never contact Cloudflare.
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const binary = resolve(root, "node_modules/.bin/workerd");
const config = resolve(root, "scripts/kdf-workerd/config.capnp");
if (!existsSync(binary) || !existsSync(config)) {
  console.error("[kdf-workerd] BLOCKED: local binary/config missing (run npm ci)");
  process.exit(2);
}
let version = "NOT_DETERMINED";
try { version = JSON.parse(readFileSync(resolve(root, "node_modules/workerd/package.json"), "utf8")).version; }
catch { /* refuse to fabricate a version */ }
const child = spawn(binary, ["serve", config], { cwd: root, stdio: ["ignore", "ignore", "pipe"] });
let stderr = "";
let startupError = null;
child.on("error", e => { startupError = e.code || e.name || "STARTUP_ERROR"; });
child.stderr.on("data", chunk => { stderr = (stderr + String(chunk)).slice(-1200); });
const pause = ms => new Promise(done => setTimeout(done, ms));
const uri = "http://127.0.0.1:19387/kdf-probe";

try {
  let data;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (startupError || child.exitCode !== null) break;
    try {
      const response = await fetch(uri, { signal: AbortSignal.timeout(2500) });
      if (response.ok) { data = await response.json(); break; }
    } catch { /* workerd is starting */ }
    await pause(200);
  }
  if (!data) throw Error("WORKERD_NO_PROBE_RESULT: " + (startupError || "local process did not respond") + " " + stderr.slice(-300));
  const expected = [100000, 100001];
  if (data.isolation !== "LOCAL_WORKERD" ||
    data.compatibility_date !== "2026-10-12" ||
    data.results?.length !== 2 ||
    !data.results.every((r, i) => r.iterations === expected[i] &&
      ["SUCCESS", "REJECTED"].includes(r.outcome) &&
      Number.isFinite(r.elapsed_ms)) ||
    data.deferred?.outcome !== "NOT_RUN_RESOURCE_GATE")
    throw Error("INVALID_LOCAL_WORKERD_PROBE_RESULT");
  const report = {
    runtime: "workerd", workerd_npm_version: version,
    compatibility_date: data.compatibility_date,
    compatibility_flags: data.compatibility_flags,
    environment: "LOCAL_WORKERD", results: data.results,
    deferred: data.deferred, worker_deployed: false,
    real_credentials_used: false, d1_r2_access_used: false
  };
  console.log("[kdf-workerd] OBSERVED " + JSON.stringify(report));
  if (data.results[0].outcome !== "SUCCESS" || data.results[0].bits !== 256)
    throw Error("BASELINE_100000_NOT_SUPPORTED");
  console.log("[kdf-workerd] PASS: runtime boundary observed; not live staging authentication");
} catch (e) {
  console.error("[kdf-workerd] FAIL: " + (e instanceof Error ? e.message : "UNEXPECTED_FAILURE"));
  process.exitCode = 1;
} finally {
  if (child.exitCode === null) child.kill("SIGTERM");
}
