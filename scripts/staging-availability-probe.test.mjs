import test from "node:test";
import assert from "node:assert/strict";
import { PUBLIC_PATHS, STAGING_ORIGIN, probeStaging } from "./staging-availability-probe.mjs";

function response(status = 200) {
  return new Response(null, { status, headers: { "Content-Type": "text/html" } });
}

const quiet = { pause: async () => {}, report: () => {} };

test("staging-only probe reads four public routes for two sweeps", async () => {
  const urls = [];
  const result = await probeStaging({
    ...quiet, cycles: 2,
    request: async (url, options) => {
      urls.push(url);
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "manual");
      assert.equal(options.cache, "no-store");
      assert.equal(options.headers["Cache-Control"], "no-cache");
      return response();
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.total, 8);
  assert.equal(result.failed, 0);
  assert.deepEqual(urls, [...PUBLIC_PATHS, ...PUBLIC_PATHS].map(x => STAGING_ORIGIN + x));
});

test("a later 200 does NOT hide an earlier intermittent 503", async () => {
  let index = 0;
  const result = await probeStaging({
    ...quiet, cycles: 2, paths: ["/"],
    request: async () => response(++index === 1 ? 503 : 200),
  });
  assert.equal(result.ok, false);
  assert.equal(result.http503, 1);
  assert.equal(result.failed, 1);
  assert.deepEqual(result.observations.map(x => x.status), [503, 200]);
});

test("unauthenticated edge redirect is not counted as a public-page PASS", async () => {
  const result = await probeStaging({
    ...quiet, cycles: 1, paths: ["/tin-tuc"],
    request: async () => response(302),
  });
  assert.equal(result.ok, false);
  assert.equal(result.failed, 1);
});

test("network and browser API failures are never reclassified as HTTP 503", async () => {
  const result = await probeStaging({
    ...quiet, cycles: 1, paths: ["/"],
    request: async () => { throw new TypeError("network failure"); },
  });
  assert.equal(result.ok, false);
  assert.equal(result.networkErrors, 1);
  assert.equal(result.http503, 0);
  assert.equal(result.observations[0].errorType, "TypeError");
});

test("an HTTP 429 is a failed HTTP response, not a Browser Rendering API quota", async () => {
  const result = await probeStaging({
    ...quiet, cycles: 1, paths: ["/"],
    request: async () => response(429),
  });
  assert.equal(result.ok, false);
  assert.equal(result.failed, 1);
  assert.equal(result.http503, 0);
  assert.equal(result.observations[0].status, 429);
});

test("rejects arbitrary URLs, credentials and caller-provided production hosts", async () => {
  for (const path of [
    "https://iaict-portal.iaict-platform.workers.dev/",
    "//example.com", "/api/admin", "/admin", "/?secret=abc",
    "/%2fapi/admin",
  ]) {
    await assert.rejects(probeStaging({ ...quiet, cycles: 1, paths: [path], request: async () => response() }),
      /INVALID_STAGING_PUBLIC_PATH/);
  }
});

test("rejects invalid sweep counts before any network request", async () => {
  for (const cycles of [0, 11, 1.5]) {
    await assert.rejects(probeStaging({ ...quiet, cycles, request: async () => response() }),
      /INVALID_STAGING_PROBE_OPTIONS/);
  }
});


test("exposes CF-Ray and safe public classifications for a 503 without examining its body", async () => {
  const logs = [];
  let readBody = false;
  const result = await probeStaging({
    ...quiet, cycles: 1, paths: ["/"],
    report: entry => logs.push(entry),
    request: async () => {
      const response = new Response("synthetic error page", {
        status: 503, headers: {
          "CF-Ray": "8aa9bb11223344dd-BKK",
          "Server": "cloudflare",
          "CF-Cache-Status": "DYNAMIC",
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": "sensitive-session=SECRET_SHOULD_NOT_LOG",
          "X-Internal-Error": "SECRET_SHOULD_NOT_LOG",
        },
      });
      const original = response.text.bind(response);
      response.text = async () => { readBody = true; return original(); };
      return response;
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.http503, 1);
  assert.deepEqual(result.observations[0].failureHeaders, {
    cfRay: "8aa9bb11223344dd-BKK", serverClass: "cloudflare",
    cacheClass: "DYNAMIC", contentClass: "html",
  });
  assert.equal(readBody, false);
  assert.equal(logs.some(line => line.includes("SECRET_SHOULD_NOT_LOG")), false);
});

test("invalid CF-Ray and arbitrary server headers never leak raw diagnostic values", async () => {
  const result = await probeStaging({
    ...quiet, cycles: 1, paths: ["/tin-tuc"],
    request: async () => new Response(null, { status: 503, headers: {
      "CF-Ray": "evil;Authorization=secret",
      "Server": "private-custom-service",
      "CF-Cache-Status": "private_value",
      "Content-Type": "text/plain",
      "X-Private-Token": "never-log-me",
    }}),
  });
  assert.deepEqual(result.observations[0].failureHeaders, {
    cfRay: null, serverClass: "other",
    cacheClass: null, contentClass: "other",
  });
  assert.equal(JSON.stringify(result).includes("never-log-me"), false);
  assert.equal(JSON.stringify(result).includes("private-custom-service"), false);
});

test("successful 200 responses do not add diagnostics or alter fail-closed outcomes", async () => {
  let index = 0;
  const result = await probeStaging({
    ...quiet, cycles: 2, paths: ["/"],
    request: async () => new Response(null, { status: ++index === 1 ? 503 : 200,
      headers: { "CF-Ray": "8aa9bb11223344dd-BKK" } }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.failed, 1);
  assert.equal(result.observations[0].failureHeaders.cfRay, "8aa9bb11223344dd-BKK");
  assert.equal("failureHeaders" in result.observations[1], false);
});
