/**
 * Staging-only, anonymous availability probe for the historical intermittent
 * HTTP 503 reported in GitHub Issue #30.
 *
 * Read-only GETs; no cookies, credentials, screenshots, traces, D1 or writes.
 * Each attempt is reported. A later HTTP 200 NEVER conceals an earlier 503.
 */
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const STAGING_ORIGIN = "https://iaict-portal-staging.iaict-platform.workers.dev";
export const PUBLIC_PATHS = Object.freeze([
  "/", "/giai-phap-dich-vu", "/api/health", "/tin-tuc",
]);

const requestHeaders = Object.freeze({
  "Accept": "text/html,application/json",
  "Cache-Control": "no-cache",
  "User-Agent": "IAICT-staging-readonly-QA/1.0",
});

/**
 * Return structured results for independently verifiable evidence.
 * Caller can supply a fake fetch and a no-op wait in unit tests.
 */
export async function probeStaging({
  request = fetch,
  pause = sleep,
  cycles = 6,
  paths = PUBLIC_PATHS,
  report = line => console.log(line),
} = {}) {
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > 10 ||
      !Array.isArray(paths) && paths !== PUBLIC_PATHS) {
    throw new Error("INVALID_STAGING_PROBE_OPTIONS");
  }
  if (!Array.from(paths).length || Array.from(paths).some(p =>
    typeof p !== "string" || !PUBLIC_PATHS.includes(p))) {
    throw new Error("INVALID_STAGING_PUBLIC_PATH");
  }

  const observations = [];
  for (let cycle = 1; cycle <= cycles; cycle++) {
    for (const path of paths) {
      // Never make production or arbitrary origins a CLI option.
      const url = new URL(path, STAGING_ORIGIN);
      let status = null;
      let errorType = null;
      let latencyMs = 0;
      const begin = performance.now();
      try {
        const response = await request(url.href, {
          method: "GET",
          headers: requestHeaders,
          cache: "no-store",
          redirect: "manual",
          signal: AbortSignal.timeout(12000),
        });
        status = response.status;
        // Avoid reading or retaining any response bodies, even public ones.
        await response.body?.cancel();
      } catch (error) {
        errorType = error instanceof Error ? error.name.replace(/[^A-Za-z]/g, "").slice(0,32) : "RequestError";
      }
      latencyMs = Math.round(performance.now() - begin);
      const ok = status === 200 && errorType === null;
      const observation = { cycle, path, status, errorType, latencyMs, ok };
      observations.push(observation);
      report("[staging-availability] " + JSON.stringify(observation));
    }
    if (cycle < cycles) await pause(1000);
  }
  const failures = observations.filter(o => !o.ok);
  const summary = {
    ok: failures.length === 0,
    total: observations.length,
    passed: observations.length - failures.length,
    failed: failures.length,
    http503: observations.filter(o => o.status === 503).length,
    http5xx: observations.filter(o => o.status !== null && o.status >= 500).length,
    networkErrors: observations.filter(o => o.errorType !== null).length,
  };
  report("[staging-availability] SUMMARY " + JSON.stringify(summary));
  return { ...summary, observations };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await probeStaging();
  if (!result.ok) {
    console.error("[staging-availability] FAIL: a later passing response cannot erase any failed attempt");
    process.exitCode = 1;
  }
}
