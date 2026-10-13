import { defineConfig } from "@playwright/test";

type E2ERuntime = "next" | "vinext" | "cloudflare";

const requestedRuntime = process.env.E2E_RUNTIME;
const e2eRuntime: E2ERuntime = requestedRuntime === "vinext" || requestedRuntime === "cloudflare"
  ? requestedRuntime
  : "next";

const webServerCommand = e2eRuntime === "vinext"
  ? "npm run dev:vinext -- --host 127.0.0.1 --port 3000"
  : e2eRuntime === "cloudflare"
    ? "npx wrangler dev --port 3000"
    : "npx next dev --hostname 127.0.0.1 --port 3000";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    command: webServerCommand,
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
