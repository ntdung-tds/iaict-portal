import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    // CI already verifies the Cloudflare production build separately. Build a
    // Vinext-only production bundle for browser tests so hydration is exercised
    // in production mode without deploying or depending on Worker preview packaging.
    command: "npx vite build --mode e2e && npx vinext start --port 3000",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
