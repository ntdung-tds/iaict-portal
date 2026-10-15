import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { NEWSROOM_ADMIN_ROLES, NEWSROOM_READ_ROLES } from "@/lib/cms-roles";
import {
  getNewsroomOverview,
  updateNewsroomSettings,
  updateNewsSourceSettings,
} from "@/lib/newsroom-settings";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";
import type { NewsPublicationMode, NewsWorkflowSettings } from "@/lib/news-workflow";

export const dynamic = "force-dynamic";

type SettingsBody = {
  action?: unknown;
  settings?: Partial<NewsWorkflowSettings>;
  sourceId?: unknown;
  publicationMode?: unknown;
  isActive?: unknown;
  scheduleEnabled?: unknown;
  scheduleIntervalMinutes?: unknown;
  scheduleRetryMinutes?: unknown;
};

function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Unknown newsroom error";
  const status = message.startsWith("INVALID_") ? 400 : 500;
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, NEWSROOM_READ_ROLES);
    return Response.json({ ok: true, actor, ...(await getNewsroomOverview(db)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, NEWSROOM_ADMIN_ROLES);
    const body = await request.json() as SettingsBody;

    if (body.action === "update-settings") {
      const settings = await updateNewsroomSettings(db, actor, body.settings ?? {});
      return Response.json({ ok: true, settings });
    }

    if (body.action === "update-source") {
      const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim() : "";
      const publicationMode = typeof body.publicationMode === "string" ? body.publicationMode as NewsPublicationMode : "inherit";
      if (!sourceId) return Response.json({ error: "sourceId is required" }, { status: 400 });

      await updateNewsSourceSettings(db, actor, {
        sourceId,
        publicationMode,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
        scheduleEnabled: typeof body.scheduleEnabled === "boolean" ? body.scheduleEnabled : undefined,
        scheduleIntervalMinutes: typeof body.scheduleIntervalMinutes === "number" ? body.scheduleIntervalMinutes : undefined,
        scheduleRetryMinutes: typeof body.scheduleRetryMinutes === "number" ? body.scheduleRetryMinutes : undefined,
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unsupported settings action" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
