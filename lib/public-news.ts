import type { D1DatabaseLike } from "./cloudflare-db";

export type PublishedNewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryId: string;
  publishedAt: string | null;
  sourceName: string | null;
  canonicalUrl: string | null;
  attributionText: string | null;
};

export type PublishedNewsDetail = PublishedNewsItem & {
  body: string;
  sourcePublishedAt: string | null;
  fetchedAt: string | null;
};

export async function listPublishedNews(
  db: D1DatabaseLike,
  limit = 12,
): Promise<PublishedNewsItem[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 30);
  const { results } = await db
    .prepare(`
      SELECT
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.category_id AS categoryId,
        a.published_at AS publishedAt,
        p.source_name AS sourceName,
        p.canonical_url AS canonicalUrl,
        p.attribution_text AS attributionText
      FROM articles a
      LEFT JOIN article_provenance p ON p.article_id = a.id
      WHERE a.status = 'published'
      ORDER BY COALESCE(a.published_at, a.created_at) DESC
      LIMIT ?
    `)
    .bind(safeLimit)
    .all<PublishedNewsItem>();
  return results;
}

export async function getPublishedNewsBySlug(
  db: D1DatabaseLike,
  slug: string,
): Promise<PublishedNewsDetail | null> {
  return db
    .prepare(`
      SELECT
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.category_id AS categoryId,
        a.published_at AS publishedAt,
        a.body,
        p.source_name AS sourceName,
        p.canonical_url AS canonicalUrl,
        p.attribution_text AS attributionText,
        p.source_published_at AS sourcePublishedAt,
        p.fetched_at AS fetchedAt
      FROM articles a
      LEFT JOIN article_provenance p ON p.article_id = a.id
      WHERE a.status = 'published' AND a.slug = ?
      LIMIT 1
    `)
    .bind(slug)
    .first<PublishedNewsDetail>();
}
