/**
 * Three-way static safety gate for the MANUAL authenticated staging suite.
 * Never reads the private storageState file or imports production secrets.
 */
import { readFileSync } from "node:fs";

const config = readFileSync("playwright.staging-authenticated.config.ts", "utf8");
const spec = readFileSync("e2e/staging-authenticated.spec.ts", "utf8");
const standard = readFileSync("playwright.staging.config.ts", "utf8");
const gitignore = readFileSync(".gitignore", "utf8");
const failures = [];
const requireSource = (body, needle, reason) => {
  if (!body.includes(needle)) failures.push(reason);
};
requireSource(config, "if (process.env.CI)", "Authenticated Access cookies must never be used on CI");
requireSource(config, "IAICT_AUTH_ACCEPTANCE_APPROVED", "Must require explicit staging-only approval");
requireSource(config, "isAbsolute(state)", "Session-state file must be an absolute path");
requireSource(config, "AUTH_STATE_OUTSIDE_REPOSITORY_REQUIRED", "Session-state file must be outside git repository");
requireSource(config, "AUTH_STATE_PRIVATE_FILE_REQUIRED", "Session-state file must have private file permissions");
requireSource(config, 'screenshot: "off"', "Session screenshots must be disabled");
requireSource(config, 'trace: "off"', "Authenticated session traces must be disabled");
requireSource(config, 'video: "off"', "Authenticated session video must be disabled");
requireSource(config, 'reporter: "list"', "HTML/JUnit reporters are disallowed for sensitive session tests");
requireSource(config, '"https://iaict-portal-staging.iaict-platform.workers.dev"', "Staging-only exact hostname required");
requireSource(config, "staging-authenticated", "Dedicated auth-only testMatch is required");
requireSource(standard, "staging-acceptance", "Public browser suite must not run authenticated tests");
requireSource(gitignore, ".playwright-auth/", "Local session credentials must be ignored by git");
requireSource(gitignore, "test-results-private-auth/", "Private browser test results must be ignored by git");
requireSource(spec, "IAICT_EXPECTED_CMS_ROLES", "Explicit expected role set must be checked");
requireSource(spec, "maxRedirects: 0", "Do not silently follow Access authentication redirects");
const lower = spec.toLowerCase();
if (/\brequest\.(post|put|patch|delete)\s*\(/i.test(spec) ||
    /\b(page\.)?(screenshot|video|tracing)\s*\(/i.test(spec) ||
    /\bconsole\.(log|warn|error)\s*\(/i.test(spec)) {
  failures.push("Authenticated browser test must never mutate or record session material");
}
if (/\bgithub\.com\b|iaict-portal\.iaict-platform\.workers\.dev/.test(config)) {
  failures.push("Authenticated browser configuration contains prohibited production/GitHub destinations");
}
if (failures.length) {
  for (const problem of failures) console.error(`[auth-qa-safety] FAIL: ${problem}`);
  process.exitCode = 1;
} else {
  console.log("[auth-qa-safety] PASS: manual staging-only, external private cookie file, read-only GET and zero capture");
}
