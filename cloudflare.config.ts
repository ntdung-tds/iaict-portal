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
      // These audience tags identify Access apps; each deployment uses its own.
      ACCESS_TEAM_DOMAIN: bindings.text("https://lucky-sun-c4ca.cloudflareaccess.com"),
      ACCESS_POLICY_AUD: bindings.text(
        isStaging
          ? "c21e351bf4647a54e10e65348f2cca417de5203fe606c2281d43fa8c08d007e8"
          : "c36902ee86f6f3481c5fc117d8f60fa6e31547eef016f2dfa8e2e06dcd06be8a",
      ),
    },
    triggers: [
      // Cron Triggers execute in UTC. This frequent tick only discovers sources
      // that are due; source-specific cadence is stored in D1 and editable in CMS.
      triggers.scheduled({ schedule: "*/15 * * * *" }),
    ],
  }),
});
