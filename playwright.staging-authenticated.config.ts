import { defineConfig } from "@playwright/test";
import { isAbsolute, relative, resolve } from "node:path";
import { lstatSync, realpathSync, statSync } from "node:fs";

// Never run authenticated staging acceptance in shared CI. Browsers and session
// files contain a real Access cookie. The test runner must not make artifacts.
if (process.env.CI) {
  throw new Error("AUTH_ACCEPTANCE_LOCAL_ONLY: never inject a live Access session into CI");
}
if (process.env.IAICT_AUTH_ACCEPTANCE_APPROVED !== "staging-only") {
  throw new Error("AUTH_ACCEPTANCE_APPROVAL_REQUIRED: explicitly approve local staging-only acceptance");
}
const state = process.env.IAICT_ACCESS_STORAGE_STATE;
if (!state || !isAbsolute(state)) {
  throw new Error("AUTH_STATE_REQUIRED: use an absolute local storageState path outside the repository");
}
if (lstatSync(state).isSymbolicLink()) {
  throw new Error("AUTH_STATE_SYMLINK_FORBIDDEN: never follow session file symlinks");
}
const file = realpathSync(resolve(state));
const relativeToRepo = relative(process.cwd(), file);
if (relativeToRepo === "" || (!relativeToRepo.startsWith("..") && !isAbsolute(relativeToRepo))) {
  throw new Error("AUTH_STATE_OUTSIDE_REPOSITORY_REQUIRED: session cookies must never enter git");
}
const info = statSync(file);
if (!info.isFile() || (process.platform !== "win32" && (info.mode & 0o077) !== 0)) {
  throw new Error("AUTH_STATE_PRIVATE_FILE_REQUIRED: state must be a private file (chmod 600)");
}
const allowed = new Set(["admin", "editor", "reviewer", "viewer",
  "news_admin", "news_editor", "news_reviewer"]);
const requested = (process.env.IAICT_EXPECTED_CMS_ROLES ?? "").split(",").map(x => x.trim()).filter(Boolean);
if (!requested.length || requested.some(role => !allowed.has(role)) || new Set(requested).size !== requested.length) {
  throw new Error("EXPECTED_CMS_ROLES_REQUIRED: set one or two valid assigned roles");
}
// This is deliberately hard-coded to staging, never production or a custom URL.
const baseURL = "https://iaict-portal-staging.iaict-platform.workers.dev";
export default defineConfig({
  testDir: "./e2e",
  testMatch: /staging-authenticated\.spec\.ts/,
  timeout: 35_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "test-results-private-auth",
  use: {
    baseURL,
    storageState: file,
    headless: true,
    ignoreHTTPSErrors: false,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
});
