import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "lib/cms-*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**", "dist/**"],
    environment: "node",
  },
});
