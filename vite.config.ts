import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import vinext from "vinext";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const isPlaywrightE2E = process.env.PLAYWRIGHT_E2E === "true";
const useCloudflareRuntime = !isGithubPages && !isPlaywrightE2E;

export default defineConfig({
  plugins: [
    vinext(),
    ...(useCloudflareRuntime
      ? [
          cloudflare({
            viteEnvironment: {
              name: "rsc",
              childEnvironments: ["ssr"],
            },
          }),
        ]
      : []),
  ],
});
