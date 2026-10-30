import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "lib/cms-*.test.ts", "lib/public-visual-seo-regression.test.ts", "lib/news-scheduler.test.ts", "lib/news-scheduler-lease.test.ts", "lib/cloudflare-access-jwt.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**", "dist/**"],
    environment: "node",
  },
});
