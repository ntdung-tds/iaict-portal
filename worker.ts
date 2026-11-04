import { withPublicPreviewCors } from "./lib/cms-public-cors";
import { NATIVE_VERIFIED_EMAIL_HEADER, nativeActorEmail, nativeAuthEnabled, sameOriginPost } from "./lib/native-auth";
import { isProtectedAdminPath, verifyCloudflareAccessRequest } from "./lib/cloudflare-access-jwt";
import handler from "vinext/server/fetch-handler";
import { setDatabaseBinding, type D1DatabaseLike } from "./lib/cloudflare-db";
import { setPrivateMediaR2Runtime, type MediaR2BucketLike } from "./lib/media-r2-runtime";
import { cleanupExpiredPrivateMedia } from "./lib/media-r2-cleanup";
import { runScheduledNewsIngestion } from "./lib/news-scheduler";
import { resolvePublicRedirect } from "./lib/public-redirects";

type WorkerEnv = {
  DB: D1DatabaseLike;
  MEDIA_BUCKET?: MediaR2BucketLike;
  MEDIA_R2_QUARANTINE_ENABLED?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_POLICY_AUD?: string;
  IAICT_NATIVE_AUTH_ENABLED?: string;
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
    // Client-supplied internal identity headers are never trusted, even on public routes.
    const headers = new Headers(request.headers);
    headers.delete(NATIVE_VERIFIED_EMAIL_HEADER);
    const path = new URL(request.url).pathname;
    const nativeEnabled = nativeAuthEnabled(env.IAICT_NATIVE_AUTH_ENABLED);
    (globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean })
      .__IAICT_NATIVE_AUTH_ENABLED__ = nativeEnabled;
    if (isProtectedAdminPath(path)) {
      let accessValid = false;
      try {
        await verifyCloudflareAccessRequest(request, {
          teamDomain: env.ACCESS_TEAM_DOMAIN,
          audience: env.ACCESS_POLICY_AUD,
        });
        accessValid = true;
      } catch {
        // The native cookie is checked against D1 and the user's current active state.
      }
      if (!accessValid && nativeEnabled) {
        let email: string | null = null;
        try { email = await nativeActorEmail(request, env.DB); } catch { /* fail closed */ }
        if (email) {
          if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !sameOriginPost(request)) {
            return Response.json({ error: "Invalid request origin" }, {
              status: 403, headers: { "cache-control": "no-store" },
            });
          }
          headers.delete("Cf-Access-Authenticated-User-Email");
          headers.delete("Cf-Access-Jwt-Assertion");
          headers.set(NATIVE_VERIFIED_EMAIL_HEADER, email);
        } else {
          return Response.json({ error: "Authentication required" }, {
            status: 401, headers: { "cache-control": "no-store" },
          });
        }
      } else if (!accessValid) {
        return Response.json({ error: "Cloudflare Access authentication required" }, {
          status: 401, headers: { "cache-control": "no-store" },
        });
      }
    }
    request = new Request(request, { headers });
    setDatabaseBinding(env.DB);
    // Staging-only quarantined R2: disabled by default. Missing bindings clear
    // prior state and can never turn production into a file-serving endpoint.
    setPrivateMediaR2Runtime(env.MEDIA_BUCKET, env.MEDIA_R2_QUARANTINE_ENABLED === "true");
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
    if (env.MEDIA_BUCKET && env.MEDIA_R2_QUARANTINE_ENABLED === "true") {
      // Independently bounded Media janitor; never purge if the staging
      // feature gate is off. Production is permanently unbound by config.
      ctx.waitUntil(cleanupExpiredPrivateMedia(env.DB, env.MEDIA_BUCKET)
        .then(result => console.log("IAICT Media quarantine cleanup", result))
        .catch(() => console.error("IAICT Media quarantine cleanup failed")));
    }
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