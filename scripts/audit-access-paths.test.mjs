import test from "node:test";
import assert from "node:assert/strict";
import { auditAccessApplication, PROTECTED_ADMIN_PATHS } from "./audit-access-paths.mjs";

const host = "iaict-portal-staging.iaict-platform.workers.dev";
const aud = "a".repeat(64);
const app = (paths = PROTECTED_ADMIN_PATHS, changes = {}) => ({
  type: "self_hosted",
  aud,
  destinations: paths.map(path => ({ type: "public", uri: host + path })),
  ...changes,
});
const run = application => auditAccessApplication({ application, hostname: host, audience: aud });

test("accepts four explicit protected roots and descendant paths", () => {
  const result = run(app());
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.problems, []);
});

test("fails when /api/admin root is missing even if /api/admin/* exists", () => {
  const result = run(app(["/admin", "/admin/*", "/api/admin/*"]));
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [host + "/api/admin"]);
  assert.ok(result.problems.includes("ACCESS_DESTINATION_MISSING"));
});

test("fails when /admin root is missing even if /admin/* exists", () => {
  const result = run(app(["/admin/*", "/api/admin", "/api/admin/*"]));
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [host + "/admin"]);
});

test("does not accept matching deprecated self_hosted_domains over active destinations", () => {
  const result = run(app(["/admin/*"], {
    self_hosted_domains: PROTECTED_ADMIN_PATHS.map(path => host + path),
  }));
  assert.equal(result.destinationField, "destinations");
  assert.equal(result.ok, false);
  assert.equal(result.missing.length, 3);
});

test("supports legacy self_hosted_domains only when no modern destinations are configured", () => {
  const result = run({
    type: "self_hosted", aud,
    self_hosted_domains: PROTECTED_ADMIN_PATHS.map(path => host + path),
  });
  assert.equal(result.destinationField, "self_hosted_domains");
  assert.equal(result.ok, true);
});

test("rejects other application's audience, public overrides and wrong app type", () => {
  assert.ok(run(app(PROTECTED_ADMIN_PATHS, { aud: "b".repeat(64) }))
    .problems.includes("ACCESS_APP_AUDIENCE_MISMATCH"));
  assert.ok(run(app(PROTECTED_ADMIN_PATHS, { type: "saas" }))
    .problems.includes("ACCESS_APP_NOT_SELF_HOSTED"));
  const overridden = app();
  overridden.destinations[0].overrides = [{ behavior: "public", path_pattern: "/admin" }];
  assert.ok(run(overridden).problems.includes("ACCESS_PUBLIC_OVERRIDE_REQUIRES_REVIEW"));
});

test("does not accept a different hostname or prefix as coverage", () => {
  const result = run(app(PROTECTED_ADMIN_PATHS.map(p => "/tenant" + p)));
  assert.equal(result.ok, false);
  assert.equal(result.missing.length, 4);
});

test("explicit observed staging and production destinations are incomplete", () => {
  const staging = run(app(["/admin", "/admin/*", "/api/admin/*"]));
  assert.deepEqual(staging.missing, [host + "/api/admin"]);
  const prodHost = "iaict-portal.iaict-platform.workers.dev";
  const prod = auditAccessApplication({
    application: {
      type: "self_hosted", aud,
      destinations: ["/admin/*", "/api/admin/*"]
        .map(path => ({ type: "public", uri: prodHost + path })),
    },
    hostname: prodHost, audience: aud,
  });
  assert.deepEqual(prod.missing, [prodHost + "/admin", prodHost + "/api/admin"]);
});
