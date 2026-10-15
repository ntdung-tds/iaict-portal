import handler from "vinext/server/fetch-handler";
import type { D1DatabaseLike } from "./lib/cloudflare-db";
import { runScheduledNewsIngestion } from "./lib/news-scheduler";

type WorkerEnv = {
  DB: D1DatabaseLike;
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
    return handler.fetch(request, env, ctx);
  },

  async scheduled(
    controller: ScheduledControllerLike,
    env: WorkerEnv,
    ctx: ExecutionContextLike,
  ) {
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
