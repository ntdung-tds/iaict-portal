import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { deleteCmsRecord, listCmsRecords, saveCmsRecord } from "@/lib/cms-repository";
import { getCmsModule } from "@/lib/cms-schema";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Unknown CMS error";
  const status = message.startsWith("INVALID_CMS_") ? 400 : 500;
  return Response.json({ error: message.replace(/^INVALID_CMS_/, "") }, { status });
}

function moduleFrom(value: unknown) {
  const moduleKey = typeof value === "string" ? value.trim() : "";
  const config = getCmsModule(moduleKey);
  if (!config) throw new Error("INVALID_CMS_MODULE");
  return { moduleKey, config };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { moduleKey, config } = moduleFrom(url.searchParams.get("module"));
    const db = getDatabaseBinding();
    const roles = config.adminOnly ? ["admin"] as const : ["admin", "editor", "reviewer"] as const;
    const actor = await requireNewsroomActor(request, db, roles);
    const limitRaw = Number(url.searchParams.get("limit") ?? "80");
    const result = await listCmsRecords(db, moduleKey, {
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      limit: Number.isFinite(limitRaw) ? limitRaw : 80,
    });
    return Response.json({ ok: true, module: config, actor, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { module?: unknown; id?: unknown; data?: unknown };
    const { moduleKey, config } = moduleFrom(body.module);
    const db = getDatabaseBinding();
    const roles = config.adminOnly ? ["admin"] as const : ["admin", "editor"] as const;
    const actor = await requireNewsroomActor(request, db, roles);
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;
    const data = body.data && typeof body.data === "object" && !Array.isArray(body.data)
      ? body.data as Record<string, unknown>
      : {};
    const entityId = await saveCmsRecord(db, actor, moduleKey, id, data);
    return Response.json({ ok: true, id: entityId });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { module?: unknown; id?: unknown };
    const { moduleKey } = moduleFrom(body.module);
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return Response.json({ error: "ID_REQUIRED" }, { status: 400 });
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, ["admin"]);
    await deleteCmsRecord(db, actor, moduleKey, id);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
