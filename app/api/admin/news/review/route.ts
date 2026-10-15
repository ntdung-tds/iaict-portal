import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { NEWSROOM_READ_ROLES } from "@/lib/cms-roles";
import { listReviewQueue } from "@/lib/news-repository";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";
import { NEWS_REVIEW_STATUSES, type NewsReviewStatus } from "@/lib/news-workflow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, NEWSROOM_READ_ROLES);

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "pending";
    if (!NEWS_REVIEW_STATUSES.includes(statusParam as NewsReviewStatus)) {
      return Response.json({ error: "Invalid review status" }, { status: 400 });
    }

    const limitParam = Number(url.searchParams.get("limit") ?? "30");
    const limit = Number.isFinite(limitParam) ? limitParam : 30;
    const items = await listReviewQueue(db, { status: statusParam as NewsReviewStatus, limit });

    return Response.json({ ok: true, actor, status: statusParam, items }, { status: 200 });
  } catch (error) {
    if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : "Unknown newsroom error";
    return Response.json({ error: message }, { status: 500 });
  }
}
