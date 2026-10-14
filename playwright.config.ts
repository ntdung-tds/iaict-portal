import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    // The production bundle is verified by the dedicated build step in CI.
    // Exercise browser behavior against Vinext's local production server so
    // client hydration is validated without deploying a Cloudflare Worker.
    command: "npx vinext start --port 3000",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
