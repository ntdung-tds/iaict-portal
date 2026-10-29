import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import { CMS_ADMIN_ROLES, CMS_EDIT_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { canMutatePublication } from "@/lib/cms-publication-permissions";
import { NewsroomAuthError, requireNewsroomActor, type NewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function nowIso() { return new Date().toISOString(); }
function invalid(message: string): never { throw new Error(`INVALID_ARTICLE_${message}`); }
function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140);
}
function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Unknown article CMS error";
  const validation = message.startsWith("INVALID_ARTICLE_");
  const conflict = /UNIQUE constraint failed/i.test(message);
  return Response.json({ error: translateCmsError(message), code: cmsErrorCode(message) }, { status: conflict ? 409 : validation ? 400 : 500 });
}
async function audit(db: ReturnType<typeof getDatabaseBinding>, actor: NewsroomActor, action: string, entityType: string, entityId: string) {
  await db.prepare(`INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at) VALUES(?,?,?,?,?,'{}',?)`)
    .bind(crypto.randomUUID(), actor.id, action, entityType, entityId, nowIso()).run();
}
async function revision(db: ReturnType<typeof getDatabaseBinding>, actor: NewsroomActor, entityType: string, entityId: string, snapshot: Row) {
  await db.prepare(`INSERT INTO cms_revisions(id, entity_type, entity_id, actor_user_id, snapshot_json, created_at) VALUES(?,?,?,?,?,?)`)
    .bind(crypto.randomUUID(), entityType, entityId, actor.id, JSON.stringify(snapshot), nowIso()).run();
}

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_READ_ROLES);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const status = (url.searchParams.get("status") ?? "").trim();
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    if (q) { clauses.push("(lower(a.title) LIKE ? OR lower(COALESCE(a.excerpt,'')) LIKE ? OR lower(a.slug) LIKE ?)"); values.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (status) {
      if (!["draft", "review", "published", "archived"].includes(status)) invalid("STATUS");
      clauses.push("a.status = ?"); values.push(status);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const articles = await db.prepare(`
      SELECT a.*, c.name AS category_name
      FROM articles a JOIN article_categories c ON c.id = a.category_id
      ${where}
      ORDER BY a.featured DESC, a.updated_at DESC LIMIT 120
    `).bind(...values).all<Row>();
    const categories = await db.prepare(`SELECT id, name, slug, sort_order FROM article_categories ORDER BY sort_order, name`).all<Row>();
    const media = await db.prepare(`SELECT id,filename,public_url,alt FROM media WHERE type='image' ORDER BY updated_at DESC LIMIT 200`).all<Row>();
    return Response.json({ ok: true, actor, articles: articles.results, categories: categories.results, media: media.results });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_EDIT_ROLES);
    const body = await request.json() as { action?: string; id?: string; data?: Row };
    const action = body.action ?? "save-article";
    const data = body.data ?? {};

    if (action === "save-category") {
      const name = String(data.name ?? "").trim();
      const slug = String(data.slug ?? "").trim() || slugify(name);
      const sortOrder = Number(data.sort_order ?? 0);
      if (!name || !slug) invalid("CATEGORY_REQUIRED");
      if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) invalid("NAVIGATION_SORT_ORDER");
      const id = body.id?.trim() || crypto.randomUUID();
      if (body.id) {
        const current = await db.prepare(`SELECT * FROM article_categories WHERE id=?`).bind(id).first<Row>();
        if (!current) invalid("CATEGORY_NOT_FOUND");
        await revision(db, actor, "article_categories", id, current);
        await db.prepare(`UPDATE article_categories SET name=?, slug=?, sort_order=? WHERE id=?`).bind(name, slug, sortOrder, id).run();
      } else {
        await db.prepare(`INSERT INTO article_categories(id,name,slug,sort_order) VALUES(?,?,?,?)`).bind(id, name, slug, sortOrder).run();
      }
      await audit(db, actor, body.id ? "cms.article_category.update" : "cms.article_category.create", "article_categories", id);
      return Response.json({ ok: true, id });
    }

    const title = String(data.title ?? "").trim();
    const categoryId = String(data.category_id ?? "").trim();
    const slug = String(data.slug ?? "").trim() || slugify(title);
    const status = String(data.status ?? "draft").trim();
    const articleBody = String(data.body ?? "").trim();
    const excerpt = String(data.excerpt ?? "").trim() || null;
    const heroMediaId = String(data.hero_media_id ?? "").trim() || null;
    const featured = data.featured === true || data.featured === 1 ? 1 : 0;

    let tagsJson = "[]";
    let seoJson = "{}";
    try {
      const parsed = JSON.parse(String(data.tags_json ?? "[]"));
      if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) invalid("TAGS_JSON");
      tagsJson = JSON.stringify(parsed.map((item) => item.trim()).filter(Boolean));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("INVALID_ARTICLE_")) throw error;
      invalid("TAGS_JSON");
    }
    try {
      const parsed = JSON.parse(String(data.seo_json ?? "{}"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) invalid("SEO_JSON");
      seoJson = JSON.stringify(parsed);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("INVALID_ARTICLE_")) throw error;
      invalid("SEO_JSON");
    }

    if (!title || !categoryId || !slug || !articleBody) invalid("REQUIRED_FIELDS");
    if (!["draft", "review", "published", "archived"].includes(status)) invalid("STATUS");
    if (!canMutatePublication(actor.roles, null, status)) {
      throw new NewsroomAuthError(403, "Only a CMS administrator may publish articles");
    }
    const category = await db.prepare(`SELECT id FROM article_categories WHERE id=?`).bind(categoryId).first<{id:string}>();
    if (!category) invalid("CATEGORY_NOT_FOUND");
    if (heroMediaId) {
      const media = await db.prepare(`SELECT id,type FROM media WHERE id=?`).bind(heroMediaId).first<{id:string;type:string}>();
      if (!media) invalid("HERO_MEDIA_NOT_FOUND");
      if (media.type !== "image") invalid("HERO_MEDIA_IMAGE_REQUIRED");
    }

    const timestamp = nowIso();
    const id = body.id?.trim() || crypto.randomUUID();
    if (body.id) {
      const current = await db.prepare(`SELECT * FROM articles WHERE id=?`).bind(id).first<Row>();
      if (!current) invalid("NOT_FOUND");
      if (!canMutatePublication(actor.roles, current.status, status)) {
        throw new NewsroomAuthError(403, "Only a CMS administrator may modify published articles");
      }
      await revision(db, actor, "articles", id, current);
      const publishedAt = status === "published" ? String(current.published_at ?? timestamp) : current.published_at;
      await db.prepare(`UPDATE articles SET title=?,slug=?,category_id=?,status=?,body=?,excerpt=?,tags_json=?,hero_media_id=?,seo_json=?,featured=?,updated_at=?,published_at=? WHERE id=?`)
        .bind(title, slug, categoryId, status, articleBody, excerpt, tagsJson, heroMediaId, seoJson, featured, timestamp, publishedAt as string | null, id).run();
    } else {
      await db.prepare(`INSERT INTO articles(id,title,slug,category_id,status,body,excerpt,tags_json,author_user_id,hero_media_id,published_at,attachments_json,seo_json,featured,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id, title, slug, categoryId, status, articleBody, excerpt, tagsJson, actor.id, heroMediaId, status === "published" ? timestamp : null, "[]", seoJson, featured, timestamp, timestamp).run();
    }
    await audit(db, actor, body.id ? "cms.article.update" : "cms.article.create", "articles", id);
    return Response.json({ ok: true, id });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    const body = await request.json() as { type?: string; id?: string };
    const id = body.id?.trim() ?? "";
    if (!id) invalid("ID");
    if (body.type === "category") {
      const used = await db.prepare(`SELECT COUNT(*) AS count FROM articles WHERE category_id=?`).bind(id).first<{count:number}>();
      if (Number(used?.count ?? 0) > 0) invalid("CATEGORY_IN_USE");
      const current = await db.prepare(`SELECT * FROM article_categories WHERE id=?`).bind(id).first<Row>();
      if (!current) invalid("CATEGORY_NOT_FOUND");
      await revision(db, actor, "article_categories", id, current);
      await db.prepare(`DELETE FROM article_categories WHERE id=?`).bind(id).run();
      await audit(db, actor, "cms.article_category.delete", "article_categories", id);
    } else {
      const current = await db.prepare(`SELECT * FROM articles WHERE id=?`).bind(id).first<Row>();
      if (!current) invalid("NOT_FOUND");
      await revision(db, actor, "articles", id, current);
      await db.prepare(`DELETE FROM articles WHERE id=?`).bind(id).run();
      await audit(db, actor, "cms.article.delete", "articles", id);
    }
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
