import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { getPublishedNewsBySlug, listPublishedNews } from "@/lib/public-news";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
  "Content-Type": "application/json; charset=utf-8",
};

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() ?? "";

    if (slug) {
      if (!/^[a-z0-9-]{3,160}$/.test(slug)) {
        return Response.json({ error: "Invalid news slug" }, { status: 400 });
      }
      const item = await getPublishedNewsBySlug(db, slug);
      if (!item) return Response.json({ error: "News article not found" }, { status: 404 });
      return Response.json({ ok: true, item }, { status: 200, headers: CACHE_HEADERS });
    }

    const requestedLimit = Number(url.searchParams.get("limit") ?? "12");
    const limit = Number.isFinite(requestedLimit) ? requestedLimit : 12;
    const items = await listPublishedNews(db, limit);
    return Response.json({ ok: true, items }, { status: 200, headers: CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown public news error";
    return Response.json({ error: message }, { status: 500 });
  }
}
