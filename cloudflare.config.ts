import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "iaict-portal-staging",
    entrypoint: "./worker.ts",
    compatibilityDate: "2026-10-12",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      DB: bindings.d1({ name: "iaict-portal-staging-db" }),
    },
    triggers: [
      // Cron Triggers execute in UTC. This frequent tick only discovers sources
      // that are due; source-specific cadence is stored in D1 and editable in CMS.
      triggers.scheduled({ schedule: "*/15 * * * *" }),
    ],
  }),
});
