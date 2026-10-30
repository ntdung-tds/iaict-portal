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
