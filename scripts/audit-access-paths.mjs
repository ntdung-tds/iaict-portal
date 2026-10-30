/**
 * Fail-closed Cloudflare Access application destination audit.
 *
 * Never equate /admin/* with /admin or /api/admin/* with /api/admin:
 * require independently configured roots and descendants. Cloudflare's
 * destinations field supersedes the deprecated self_hosted_domains field.
 * This module is pure and does not communicate with Cloudflare.
 */
export const PROTECTED_ADMIN_PATHS = Object.freeze([
  "/admin", "/admin/*", "/api/admin", "/api/admin/*",
]);

function publicUris(application) {
  if (Array.isArray(application?.destinations) && application.destinations.length > 0) {
    return application.destinations
      .filter(entry => entry?.type === "public" && typeof entry.uri === "string")
      .map(entry => ({ uri: entry.uri, overrides: entry.overrides ?? [] }));
  }
  if (!Array.isArray(application?.self_hosted_domains)) return [];
  return application.self_hosted_domains
    .filter(uri => typeof uri === "string")
    .map(uri => ({ uri, overrides: [] }));
}

/**
 * Pure checklist, not a substitute for live negative-auth browser tests.
 * Requires explicit roots and descendants; a wildcard must not accidentally
 * inherit another app's policy. No secrets or user identities are handled.
 */
export function auditAccessApplication({ application, hostname, audience }) {
  const problems = [];
  if (!application || application.type !== "self_hosted") {
    problems.push("ACCESS_APP_NOT_SELF_HOSTED");
  }
  if (!audience || application?.aud !== audience) {
    problems.push("ACCESS_APP_AUDIENCE_MISMATCH");
  }
  if (!/^[a-z0-9.-]+$/i.test(hostname ?? "")) {
    problems.push("ACCESS_HOSTNAME_INVALID");
  }
  const destinations = publicUris(application);
  const expected = PROTECTED_ADMIN_PATHS.map(path => hostname + path);
  const actual = new Set(destinations.map(d => d.uri));
  const missing = expected.filter(uri => !actual.has(uri));
  if (missing.length) problems.push("ACCESS_DESTINATION_MISSING");

  // A path-specific public override can bypass the authentication policy.
  for (const entry of destinations) {
    if (!Array.isArray(entry.overrides)) {
      problems.push("ACCESS_DESTINATION_OVERRIDE_MALFORMED");
    } else if (entry.overrides.some(rule => rule?.behavior === "public")) {
      problems.push("ACCESS_PUBLIC_OVERRIDE_REQUIRES_REVIEW");
    }
  }

  return {
    ok: problems.length === 0,
    problems: [...new Set(problems)],
    missing,
    checked: expected,
    audienceMatches: application?.aud === audience,
    destinationField: Array.isArray(application?.destinations) && application.destinations.length > 0
      ? "destinations" : "self_hosted_domains",
  };
}
