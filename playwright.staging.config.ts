import { defineConfig } from "@playwright/test";

const baseURL = process.env.STAGING_BASE_URL ?? "https://iaict-portal-staging.iaict-platform.workers.dev";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /staging-acceptance\.spec\.ts/,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 1,
  workers: 1,
  // Only text-only status reports. QA images/videos belong in the private Drive folder,
  // not repository/CI runner artifacts. See the dedicated manual visual QA process.
  reporter: "list",
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: false,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
});
