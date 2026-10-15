import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

const deployTarget = process.env.IAICT_DEPLOY_TARGET === "staging" ? "staging" : "production";
const isStaging = deployTarget === "staging";

export default defineConfig({
  worker: defineWorker({
    name: isStaging ? "iaict-portal-staging" : "iaict-portal",
    entrypoint: "./worker.ts",
    compatibilityDate: "2026-10-12",
    compatibilityFlags: ["nodejs_compat"],
    workersDev: true,
    previewUrls: false,
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      DB: bindings.d1({ name: isStaging ? "iaict-portal-staging-db" : "iaict-portal-db" }),
    },
    triggers: [
      // Cron Triggers execute in UTC. This frequent tick only discovers sources
      // that are due; source-specific cadence is stored in D1 and editable in CMS.
      triggers.scheduled({ schedule: "*/15 * * * *" }),
    ],
  }),
});
