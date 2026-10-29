import { getDatabaseBinding, type D1PreparedStatementLike } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import { CMS_ADMIN_ROLES, CMS_EDIT_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { canMutatePublication } from "@/lib/cms-publication-permissions";
import { NewsroomAuthError, requireNewsroomActor, type NewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type CategoryVersion = { name: string; slug: string; sort_order: number };
type ArticleRequest = { action?: string; type?: string; id?: string; data?: Row; expectedUpdatedAt?: unknown; expectedCategory?: unknown };
type Database = ReturnType<typeof getDatabaseBinding>;

function nowIso() { return new Date().toISOString(); }
function nextUpdatedAt(previous: unknown) {
  const last = typeof previous === "string" ? Date.parse(previous) : Number.NaN;
  return new Date(Number.isFinite(last) ? Math.max(Date.now(), last + 1) : Date.now()).toISOString();
}
function invalid(message: string): never { throw new Error(`INVALID_ARTICLE_${message}`); }
function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140);
}
function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Unknown article CMS error";
  const validation = message.startsWith("INVALID_ARTICLE_");
  const conflict = /UNIQUE constraint failed/i.test(message) || message === "INVALID_ARTICLE_CONFLICT";
  return Response.json({ error: translateCmsError(message), code: cmsErrorCode(message) }, { status: conflict ? 409 : validation ? 400 : 500 });
}
function auditStatement(db: Database, actor: NewsroomActor, action: string, entityType: string, entityId: string, revisionId?: string): D1PreparedStatementLike {
  const id = crypto.randomUUID(), time = nowIso();
  if (revisionId) {
    return db.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
      SELECT ?,?,?,?,?,'{}',? FROM cms_revisions WHERE id=?`).bind(id, actor.id, action, entityType, entityId, time, revisionId);
  }
  return db.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
    VALUES(?,?,?,?,?,'{}',?)`).bind(id, actor.id, action, entityType, entityId, time);
}
function revisionStatement(db: Database, actor: NewsroomActor, type: string, id: string, current: Row, predicate: string, params: Array<string | number>): { statement: D1PreparedStatementLike; revisionId: string } {
  const revisionId = crypto.randomUUID();
  const table = type === "articles" ? "articles" : "article_categories";
  return {
    revisionId,
    statement: db.prepare(`INSERT INTO cms_revisions(id,entity_type,entity_id,actor_user_id,snapshot_json,created_at)
      SELECT ?,?,?,?,?,? FROM ${table} WHERE id=? AND ${predicate}`)
      .bind(revisionId, type, id, actor.id, JSON.stringify(current), nowIso(), id, ...params),
  };
}
function requireChanged(results: Awaited<ReturnType<Database["batch"]>>, index: number) {
  // A conditional D1 batch can commit successfully with zero matching rows.
  if (results[index]?.meta?.changes === 0) invalid("CONFLICT");
  if (typeof results[index]?.meta?.changes !== "number") throw new Error("Missing D1 batch change metadata");
}
function articleVersion(body: ArticleRequest, current: Row) {
  const expected = body.expectedUpdatedAt;
  if (typeof expected !== "string" || !expected.trim() || expected !== current.updated_at) invalid("CONFLICT");
  return expected;
}
function categoryVersion(body: ArticleRequest, current: Row): CategoryVersion {
  const input = body.expectedCategory;
  if (!input || typeof input !== "object" || Array.isArray(input)) invalid("CONFLICT");
  const version = input as Partial<CategoryVersion>;
  if (typeof version.name !== "string" || typeof version.slug !== "string" || typeof version.sort_order !== "number" ||
      version.name !== current.name || version.slug !== current.slug || version.sort_order !== current.sort_order) invalid("CONFLICT");
  return version as CategoryVersion;
}
function categoryPredicate(version: CategoryVersion) {
  return { clause: "name=? AND slug=? AND sort_order=?", values: [version.name, version.slug, version.sort_order] as Array<string | number> };
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
    const body = await request.json() as ArticleRequest;
    const action = body.action ?? "save-article";
    const data = body.data ?? {};
    if (!data || typeof data !== "object" || Array.isArray(data)) invalid("REQUIRED_FIELDS");

    if (action === "save-category") {
      const name = String(data.name ?? "").trim();
      const slug = String(data.slug ?? "").trim() || slugify(name);
      const sortOrder = Number(data.sort_order ?? 0);
      if (!name || !slug) invalid("CATEGORY_REQUIRED");
      if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) invalid("NAVIGATION_SORT_ORDER");
      const id = body.id?.trim() || crypto.randomUUID();
      if (body.id) {
        const current = await db.prepare("SELECT * FROM article_categories WHERE id=?").bind(id).first<Row>();
        if (!current) invalid("CATEGORY_NOT_FOUND");
        const version = categoryPredicate(categoryVersion(body, current));
        const { statement, revisionId } = revisionStatement(db, actor, "article_categories", id, current, version.clause, version.values);
        const results = await db.batch([
          statement,
          db.prepare(`UPDATE article_categories SET name=?,slug=?,sort_order=? WHERE id=? AND ${version.clause}`)
            .bind(name, slug, sortOrder, id, ...version.values),
          auditStatement(db, actor, "cms.article_category.update", "article_categories", id, revisionId),
        ]);
        requireChanged(results, 1);
      } else {
        await db.batch([
          db.prepare("INSERT INTO article_categories(id,name,slug,sort_order) VALUES(?,?,?,?)").bind(id, name, slug, sortOrder),
          auditStatement(db, actor, "cms.article_category.create", "article_categories", id),
        ]);
      }
      return Response.json({ ok: true, id });
    }
    if (action !== "save-article") invalid("STATUS");

    const title = String(data.title ?? "").trim();
    const categoryId = String(data.category_id ?? "").trim();
    const slug = String(data.slug ?? "").trim() || slugify(title);
    const status = String(data.status ?? "draft").trim();
    const articleBody = String(data.body ?? "").trim();
    const excerpt = String(data.excerpt ?? "").trim() || null;
    const heroMediaId = String(data.hero_media_id ?? "").trim() || null;
    const featured = data.featured === true || data.featured === 1 ? 1 : 0;
    let tagsJson = "[]", seoJson = "{}";
    try {
      const parsed = JSON.parse(String(data.tags_json ?? "[]"));
      if (!Array.isArray(parsed) || parsed.some(item => typeof item !== "string")) invalid("TAGS_JSON");
      tagsJson = JSON.stringify(parsed.map(item => item.trim()).filter(Boolean));
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
    const category = await db.prepare("SELECT id FROM article_categories WHERE id=?").bind(categoryId).first<{id:string}>();
    if (!category) invalid("CATEGORY_NOT_FOUND");
    if (heroMediaId) {
      const media = await db.prepare("SELECT id,type FROM media WHERE id=?").bind(heroMediaId).first<{id:string;type:string}>();
      if (!media) invalid("HERO_MEDIA_NOT_FOUND");
      if (media.type !== "image") invalid("HERO_MEDIA_IMAGE_REQUIRED");
    }

    const timestamp = nowIso(), id = body.id?.trim() || crypto.randomUUID();
    if (body.id) {
      const current = await db.prepare("SELECT * FROM articles WHERE id=?").bind(id).first<Row>();
      if (!current) invalid("NOT_FOUND");
      if (!canMutatePublication(actor.roles, current.status, status)) {
        throw new NewsroomAuthError(403, "Only a CMS administrator may modify published articles");
      }
      const expected = articleVersion(body, current);
      const nextTime = nextUpdatedAt(current.updated_at);
      const publishedAt = status === "published" ? String(current.published_at ?? nextTime) : current.published_at;
      const editorGuard = actor.roles.includes("admin") ? "" : " AND status <> 'published'";
      const predicate = `updated_at=?${editorGuard}`;
      const { statement, revisionId } = revisionStatement(db, actor, "articles", id, current, predicate, [expected]);
      const results = await db.batch([
        statement,
        db.prepare(`UPDATE articles SET title=?,slug=?,category_id=?,status=?,body=?,excerpt=?,tags_json=?,hero_media_id=?,seo_json=?,featured=?,updated_at=?,published_at=?
          WHERE id=? AND ${predicate}`)
          .bind(title, slug, categoryId, status, articleBody, excerpt, tagsJson, heroMediaId, seoJson, featured, nextTime, publishedAt as string | null, id, expected),
        auditStatement(db, actor, "cms.article.update", "articles", id, revisionId),
      ]);
      requireChanged(results, 1);
    } else {
      await db.batch([
        db.prepare(`INSERT INTO articles(id,title,slug,category_id,status,body,excerpt,tags_json,author_user_id,hero_media_id,published_at,attachments_json,seo_json,featured,created_at,updated_at)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .bind(id, title, slug, categoryId, status, articleBody, excerpt, tagsJson, actor.id, heroMediaId,
            status === "published" ? timestamp : null, "[]", seoJson, featured, timestamp, timestamp),
        auditStatement(db, actor, "cms.article.create", "articles", id),
      ]);
    }
    return Response.json({ ok: true, id });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    const body = await request.json() as ArticleRequest;
    const id = body.id?.trim() ?? "";
    if (!id) invalid("ID");
    if (body.type === "category") {
      const current = await db.prepare("SELECT * FROM article_categories WHERE id=?").bind(id).first<Row>();
      if (!current) invalid("CATEGORY_NOT_FOUND");
      const version = categoryPredicate(categoryVersion(body, current));
      const used = await db.prepare("SELECT COUNT(*) AS count FROM articles WHERE category_id=?").bind(id).first<{count:number}>();
      if (Number(used?.count ?? 0) > 0) invalid("CATEGORY_IN_USE");
      const { statement, revisionId } = revisionStatement(db, actor, "article_categories", id, current,
        `${version.clause} AND NOT EXISTS(SELECT 1 FROM articles WHERE category_id=?)`, [...version.values, id]);
      const results = await db.batch([
        statement,
        db.prepare(`DELETE FROM article_categories WHERE id=? AND ${version.clause} AND NOT EXISTS(SELECT 1 FROM articles WHERE category_id=?)`)
          .bind(id, ...version.values, id),
        auditStatement(db, actor, "cms.article_category.delete", "article_categories", id, revisionId),
      ]);
      if (results[1]?.meta?.changes === 0) {
        const nowUsed = await db.prepare("SELECT 1 AS used FROM articles WHERE category_id=? LIMIT 1").bind(id).first();
        if (nowUsed) invalid("CATEGORY_IN_USE");
      }
      requireChanged(results, 1);
    } else {
      const current = await db.prepare("SELECT * FROM articles WHERE id=?").bind(id).first<Row>();
      if (!current) invalid("NOT_FOUND");
      const expected = articleVersion(body, current);
      const { statement, revisionId } = revisionStatement(db, actor, "articles", id, current, "updated_at=?", [expected]);
      const results = await db.batch([
        statement,
        db.prepare("DELETE FROM articles WHERE id=? AND updated_at=?").bind(id, expected),
        auditStatement(db, actor, "cms.article.delete", "articles", id, revisionId),
      ]);
      requireChanged(results, 1);
    }
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
