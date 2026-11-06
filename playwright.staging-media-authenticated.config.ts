import { defineConfig } from "@playwright/test";
import { isAbsolute, relative, resolve } from "node:path";
import { lstatSync, realpathSync, statSync } from "node:fs";

// Dedicated manual-only B3.15 runner. Do not use QA Access cookies in CI,
// the main Playwright suite, Github Actions, Drive, or the repository.
if (process.env.CI) {
  throw new Error("MEDIA_B315_LOCAL_ONLY: do not run a real Access session in CI");
}
if (process.env.IAICT_MEDIA_E2E_APPROVED !== "staging-only") {
  throw new Error("MEDIA_B315_APPROVAL_REQUIRED: staging-only acceptance is required");
}
const role = process.env.IAICT_MEDIA_QA_ROLE;
if (!role || !["admin", "editor", "viewer"].includes(role)) {
  throw new Error("MEDIA_B315_ROLE_REQUIRED: admin, editor or viewer");
}
const state = process.env.IAICT_ACCESS_STORAGE_STATE;
if (!state || !isAbsolute(state)) {
  throw new Error("MEDIA_B315_PRIVATE_STATE_REQUIRED: absolute path outside repository");
}
if (lstatSync(state).isSymbolicLink()) {
  throw new Error("MEDIA_B315_STATE_SYMLINK_FORBIDDEN");
}
const file = realpathSync(resolve(state));
const rel = relative(process.cwd(), file);
if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) {
  throw new Error("MEDIA_B315_STATE_OUTSIDE_REPOSITORY_REQUIRED");
}
const info = statSync(file);
if (!info.isFile() || (process.platform !== "win32" && (info.mode & 0o077) !== 0)) {
  throw new Error("MEDIA_B315_STATE_PRIVATE_FILE_REQUIRED: chmod 600");
}
const baseURL = "https://iaict-portal-staging.iaict-platform.workers.dev";
export default defineConfig({
  testDir: "./e2e-private",
  testMatch: /media-b315\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
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
