import { defineConfig } from "@playwright/test";

const e2eRuntime = process.env.E2E_RUNTIME === "vinext" ? "vinext" : "next";
const webServerCommand = e2eRuntime === "vinext"
  ? "npm run dev -- --host 127.0.0.1 --port 3000"
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
