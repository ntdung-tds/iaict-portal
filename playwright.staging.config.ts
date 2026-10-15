import { defineConfig } from "@playwright/test";

const baseURL = process.env.STAGING_BASE_URL ?? "https://iaict-portal-staging.iaict-platform.workers.dev";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /staging-acceptance\.spec\.ts/,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 1,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report-staging" }]] : "list",
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: false,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
});
