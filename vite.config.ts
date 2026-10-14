import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import vinext from "vinext";

const isGithubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  plugins: [
    vinext(),
    ...(
      isGithubPages
        ? []
        : [
            cloudflare({
              viteEnvironment: {
                name: "rsc",
                childEnvironments: ["ssr"],
              },
            }),
          ]
    ),
  ],
});
