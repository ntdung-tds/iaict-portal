import { withPublicPreviewCors } from "./lib/cms-public-cors";
import { isProtectedAdminPath, verifyCloudflareAccessRequest } from "./lib/cloudflare-access-jwt";
import handler from "vinext/server/fetch-handler";
import { setDatabaseBinding, type D1DatabaseLike } from "./lib/cloudflare-db";
import { runScheduledNewsIngestion } from "./lib/news-scheduler";
import { resolvePublicRedirect } from "./lib/public-redirects";

type WorkerEnv = {
  DB: D1DatabaseLike;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_POLICY_AUD?: string;
  [key: string]: unknown;
};

type ScheduledControllerLike = {
  cron: string;
  scheduledTime: number;
};

type ExecutionContextLike = {
  waitUntil(promise: Promise<unknown>): void;
};

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContextLike) {
    // Verify the assertion before routing. Raw Access headers alone are not identity proof.
    if (isProtectedAdminPath(new URL(request.url).pathname)) {
      try {
        await verifyCloudflareAccessRequest(request, {
          teamDomain: env.ACCESS_TEAM_DOMAIN,
          audience: env.ACCESS_POLICY_AUD,
        });
      } catch {
        return Response.json({ error: "Cloudflare Access authentication required" }, {
          status: 401,
          headers: { "cache-control": "no-store" },
        });
      }
    }
    setDatabaseBinding(env.DB);
    const redirect = await resolvePublicRedirect(request, env.DB);
    if (redirect) return redirect;
    return withPublicPreviewCors(request, await handler.fetch(request, env, ctx));
  },

  async scheduled(
    controller: ScheduledControllerLike,
    env: WorkerEnv,
    ctx: ExecutionContextLike,
  ) {
    setDatabaseBinding(env.DB);
    ctx.waitUntil(
      runScheduledNewsIngestion(env.DB, {
        cronExpression: controller.cron,
        scheduledTime: controller.scheduledTime,
      })
        .then((result) => {
          console.log("IAICT newsroom scheduler completed", {
            runId: result.runId,
            status: result.status,
            due: result.due,
            claimed: result.claimed,
            succeeded: result.succeeded,
            failed: result.failed,
            skipped: result.skipped,
          });
        })
        .catch((error: unknown) => {
          console.error(
            "IAICT newsroom scheduler failed",
            error instanceof Error ? error.message : String(error),
          );
        }),
    );
  },
};