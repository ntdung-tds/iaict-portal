import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    // Keep the Cloudflare Worker runtime, but force production React during
    // Vite dev so client hydration does not depend on development-only eval().
    command: "npm run dev -- --host 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: "production",
    },
  },
});
