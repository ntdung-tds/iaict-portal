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

// B3.15 is deliberately isolated from the public/default E2E suites.
// No live Access cookie may be exported into CI, logs or repository files.
const mediaConfig = readFileSync("playwright.staging-media-authenticated.config.ts", "utf8");
const mediaSpec = readFileSync("e2e-private/media-b315.spec.ts", "utf8");
requireSource(mediaConfig, "if (process.env.CI)", "B3.15 must reject CI");
requireSource(mediaConfig, "IAICT_MEDIA_E2E_APPROVED", "B3.15 needs staging-only approval");
requireSource(mediaConfig, 'testDir: "./e2e-private"', "B3.15 must not be discovered by default E2E");
requireSource(mediaConfig, "isAbsolute(state)", "B3.15 session must use an absolute external path");
requireSource(mediaConfig, "MEDIA_B315_STATE_OUTSIDE_REPOSITORY_REQUIRED", "B3.15 session cannot be inside repo");
requireSource(mediaConfig, "MEDIA_B315_STATE_PRIVATE_FILE_REQUIRED", "B3.15 session must be chmod 600");
requireSource(mediaConfig, '"https://iaict-portal-staging.iaict-platform.workers.dev"', "B3.15 only on exact staging host");
requireSource(mediaConfig, 'screenshot: "off"', "B3.15 screenshots must be disabled");
requireSource(mediaConfig, 'trace: "off"', "B3.15 traces must be disabled");
requireSource(mediaConfig, 'video: "off"', "B3.15 videos must be disabled");
requireSource(mediaConfig, 'retries: 0', "B3.15 real writes cannot be retried automatically");
requireSource(mediaConfig, 'reporter: "list"', "B3.15 must use text-only reporter");
requireSource(mediaSpec, "MEDIA_B315_PRIVATE_STAGING_CONFIG_REQUIRED", "B3.15 spec must guard against wrong config");
requireSource(mediaSpec, "CMS-MEDIA-012 partial", "B3.15 cannot claim complete E2E from browser-only upload");
if (/\b(page\.)?(screenshot|video|tracing)\s*\(/i.test(mediaSpec) ||
    /\bconsole\.(log|warn|error)\s*\(/i.test(mediaSpec)) {
  failures.push("B3.15 cannot capture or log private authenticated material");
}
if (/\biaict-portal\.iaict-platform\.workers\.dev\b/.test(mediaConfig + mediaSpec)) {
  failures.push("B3.15 cannot name the production Worker hostname");
}

if (failures.length) {
  for (const problem of failures) console.error(`[auth-qa-safety] FAIL: ${problem}`);
  process.exitCode = 1;
} else {
  console.log("[auth-qa-safety] PASS: manual staging-only, external private cookie file, read-only GET and zero capture");
}
