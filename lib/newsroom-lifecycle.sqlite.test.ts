import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  setDatabaseBinding, type D1BindValue, type D1DatabaseLike,
  type D1PreparedStatementLike, type D1RunResult,
} from "./cloudflare-db";
import { POST as ingestRoute } from "../app/api/admin/news/ingest/route";
import { POST as saveCmsArticle } from "../app/api/admin/cms/articles/route";
import { publishApprovedReviewItem, setReviewDecision } from "./news-repository";
import { getPublishedNewsBySlug, listPublishedNews } from "./public-news";
import type { NewsroomActor } from "./newsroom-auth";

// Only the authorized actor is mocked: actual Newsroom/CMS HTTP route handlers,
// RSS adapter, news repository, D1 SQL migrations and public-query code run.
vi.mock("./newsroom-auth", async importOriginal => {
  const original = await importOriginal<typeof import("./newsroom-auth")>();
  return {
    ...original,
    requireNewsroomActor: vi.fn(async (request: Request, _db: D1DatabaseLike, allowed: readonly string[]) => {
      const role = request.headers.get("x-test-role") ?? "news_admin";
      if (!allowed.includes(role)) throw new original.NewsroomAuthError(403, "Forbidden");
      return { id: "qa-admin", email: "admin@example.test", displayName: "QA", roles: [role] };
    }),
  };
});

const migrations = [
  "0001_core.sql",
  "0012_v16_news_ingestion_review.sql",
  "0013_v16_news_source_seed.sql",
  "0014_v16_news_auto_publish_policy.sql",
  "0015_v16_news_source_adapter_config.sql",
  "0016_v16_news_backend_defaults.sql",
  "0017_v16_news_publication_claims.sql",
  "0018_v16_news_scheduler.sql",
  "0019_v17_full_cms.sql",
];
const feed = "<rss version=\"2.0\"><channel><item>" +
  "<title>Thử nghiệm quy trình tin tức IAICT trên cơ sở dữ liệu</title>" +
  "<link>https://mst.gov.vn/tin-tuc/qa-newsroom-lifecycle-20261103</link>" +
  "<description>Bản tin mẫu thử nghiệm không dùng dữ liệu cá nhân.</description>" +
  "<pubDate>Mon, 02 Nov 2026 03:00:00 GMT</pubDate>" +
  "</item></channel></rss>";

let sqlite: DatabaseSync;
let db: D1DatabaseLike;

function adapter(database: DatabaseSync): D1DatabaseLike {
  return {
    prepare(sql: string): D1PreparedStatementLike {
      let values: D1BindValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...params) { values = params; return statement; },
        async first<T>() { return (database.prepare(sql).get(...values as never[]) ?? null) as T | null; },
        async all<T>() { return { results: database.prepare(sql).all(...values as never[]) as T[] }; },
        async run(): Promise<D1RunResult> {
          const result = database.prepare(sql).run(...values as never[]);
          return { success: true, meta: { changes: result.changes } };
        },
      };
      return statement;
    },
    async batch(statements) {
      database.exec("BEGIN");
      try {
        const results: D1RunResult[] = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function ingestionRequest(body: string, contentType = "application/json; charset=utf-8", role = "news_admin") {
  return new Request("https://cms.test/api/admin/news/ingest", {
    method: "POST",
    headers: { "content-type": contentType, "x-test-role": role },
    body,
  });
}
function count(table: string) {
  // Only fixed table names controlled by the test are supplied here.
  if (!["news_ingest_runs", "news_ingest_items", "news_review_queue", "articles",
    "article_provenance", "audit_logs", "cms_revisions", "news_publication_claims"].includes(table)) {
    throw new Error("Invalid test table");
  }
  return Number((sqlite.prepare("SELECT count(*) AS n FROM " + table).get() as { n: number }).n);
}
function pending() {
  return sqlite.prepare("SELECT id, updated_at, workflow_status FROM news_review_queue LIMIT 1")
    .get() as { id: string; updated_at: string; workflow_status: string };
}
const reviewer: NewsroomActor = {
  id: "qa-reviewer", email: "reviewer@example.test", displayName: "QA reviewer", roles: ["news_reviewer"],
};

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  for (const name of migrations) {
    sqlite.exec(readFileSync("cloudflare/migrations/" + name, "utf8"));
  }
  sqlite.exec("PRAGMA foreign_keys=ON");
  sqlite.prepare("INSERT INTO admin_users(id,email,display_name,created_at,updated_at) VALUES(?,?,?,?,?)")
    .run("qa-admin", "admin@example.test", "QA Admin", "2026-11-03", "2026-11-03");
  sqlite.prepare("INSERT INTO admin_users(id,email,display_name,created_at,updated_at) VALUES(?,?,?,?,?)")
    .run("qa-reviewer", "reviewer@example.test", "QA Reviewer", "2026-11-03", "2026-11-03");
  db = adapter(sqlite);
  setDatabaseBinding(db);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as { __IAICT_D1_DB__?: D1DatabaseLike }).__IAICT_D1_DB__;
  sqlite.close();
});

describe("Newsroom actual migration-schema SQLite lifecycle (mock actor, no remote fetch)", () => {
  it("ingests RSS, deduplicates, approves with CAS, publishes atomically and archives from the public site", async () => {
    const fetched = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(feed, { status: 200, headers: { "content-type": "application/rss+xml" } }),
    );
    const request = () => ingestionRequest(JSON.stringify({ sourceId: "mst-gov-vn" }));
    const first = await ingestRoute(request());
    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("no-store");
    const firstBody = await first.json() as { summary: { fetched: number; created: number; duplicates: number; queued: number; autoPublished: number; errors: number } };
    expect(firstBody.summary).toMatchObject({ fetched: 1, created: 1, duplicates: 0, queued: 1, autoPublished: 0, errors: 0 });
    expect(count("news_review_queue")).toBe(1);
    expect(count("articles")).toBe(0);
    expect(await listPublishedNews(db)).toEqual([]);
    expect(Number((sqlite.prepare("SELECT auto_publish_enabled AS n FROM news_workflow_settings WHERE id='default'").get() as {n:number}).n)).toBe(0);

    const second = await ingestRoute(request());
    expect(second.status).toBe(200);
    expect((await second.json() as {summary:{created:number;duplicates:number;queued:number}}).summary)
      .toMatchObject({ created: 0, duplicates: 1, queued: 0 });
    expect(fetched).toHaveBeenCalledTimes(2);
    expect(count("news_ingest_items")).toBe(1);
    expect(count("news_review_queue")).toBe(1);

    const original = pending();
    expect(original.workflow_status).toBe("pending");
    await setReviewDecision(db, reviewer, {
      queueId: original.id, expectedUpdatedAt: original.updated_at, decision: "approved",
    });
    const approved = pending();
    expect(approved.workflow_status).toBe("approved");
    await expect(publishApprovedReviewItem(db, reviewer, approved.id, original.updated_at))
      .rejects.toThrow("NEWS_REVIEW_VERSION_CONFLICT");
    expect(count("articles")).toBe(0);
    expect(count("news_publication_claims")).toBe(0);

    const published = await publishApprovedReviewItem(db, reviewer, approved.id, approved.updated_at);
    expect(count("articles")).toBe(1);
    expect(count("article_provenance")).toBe(1);
    expect(count("news_publication_claims")).toBe(0);
    expect(count("audit_logs")).toBe(4);
    const item = (await listPublishedNews(db))[0];
    expect(item.slug).toBe(published.slug);
    expect(item.sourceName).toContain("Khoa học");
    expect(item.canonicalUrl).toBe("https://mst.gov.vn/tin-tuc/qa-newsroom-lifecycle-20261103");
    expect(await getPublishedNewsBySlug(db, published.slug)).toMatchObject({ id: published.articleId });
    expect(pending().workflow_status).toBe("published");

    await expect(publishApprovedReviewItem(db, reviewer, approved.id, approved.updated_at))
      .rejects.toThrow("NEWS_PUBLICATION_STATE_CONFLICT");
    expect(count("articles")).toBe(1);
    expect(count("audit_logs")).toBe(4);

    const current = sqlite.prepare("SELECT * FROM articles WHERE id=?")
      .get(published.articleId) as Record<string, unknown>;
    const archived = await saveCmsArticle(new Request("https://cms.test/api/admin/cms/articles", {
      method: "POST",
      headers: { "x-test-role": "admin", "content-type": "application/json" },
      body: JSON.stringify({
        action: "save-article", id: published.articleId, expectedUpdatedAt: current.updated_at,
        data: {
          title: current.title, slug: current.slug, category_id: current.category_id,
          status: "archived", body: current.body,
          tags_json: current.tags_json, seo_json: current.seo_json,
        },
      }),
    }));
    expect(archived.status).toBe(200);
    expect(archived.headers.get("cache-control")).toBe("no-store");
    expect(await listPublishedNews(db)).toEqual([]);
    expect(await getPublishedNewsBySlug(db, published.slug)).toBeNull();
    expect(count("cms_revisions")).toBe(1);
    expect(count("audit_logs")).toBe(5);
    expect(sqlite.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("rejects a stale review decision without changing status or appending an approval audit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(feed, { status: 200 }));
    expect((await ingestRoute(ingestionRequest('{"sourceId":"mst-gov-vn"}'))).status).toBe(200);
    const first = pending();
    await setReviewDecision(db, reviewer, {
      queueId: first.id, expectedUpdatedAt: first.updated_at, decision: "approved",
    });
    await expect(setReviewDecision(db, reviewer, {
      queueId: first.id, expectedUpdatedAt: first.updated_at, decision: "rejected",
    })).rejects.toThrow("NEWS_REVIEW_VERSION_CONFLICT");
    expect(pending().workflow_status).toBe("approved");
    expect(count("articles")).toBe(0);
    expect(count("audit_logs")).toBe(2);
  });

  it("returns 400 on bad JSON / wrong payload type / content-type without fetching or writing to D1", async () => {
    const fetched = vi.spyOn(globalThis, "fetch");
    for (const payload of ["{", "null", "[]", "42", '"text"', '{"sourceId":23}', "{}"]) {
      const response = await ingestRoute(ingestionRequest(payload));
      expect(response.status, payload).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    const wrongMedia = await ingestRoute(ingestionRequest('{"sourceId":"mst-gov-vn"}', "text/plain"));
    expect(wrongMedia.status).toBe(400);
    expect(wrongMedia.headers.get("cache-control")).toBe("no-store");
    const denied = await ingestRoute(ingestionRequest('{"sourceId":"mst-gov-vn"}', "application/json", "viewer"));
    expect(denied.status).toBe(403);
    expect(denied.headers.get("cache-control")).toBe("no-store");
    expect(fetched).not.toHaveBeenCalled();
    expect(count("news_ingest_runs")).toBe(0);
    expect(count("news_review_queue")).toBe(0);
    expect(count("audit_logs")).toBe(0);
  });

  it("records a failed feed fetch without publishing any news or leaving a running ingest", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("upstream unavailable", { status: 503 }));
    const response = await ingestRoute(ingestionRequest('{"sourceId":"mst-gov-vn"}'));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(count("news_ingest_runs")).toBe(1);
    expect(sqlite.prepare("SELECT status FROM news_ingest_runs LIMIT 1").get()?.status).toBe("failed");
    expect(sqlite.prepare("SELECT last_error FROM news_sources WHERE id='mst-gov-vn'").get()?.last_error)
      .toContain("503");
    expect(count("news_review_queue")).toBe(0);
    expect(count("articles")).toBe(0);
    expect(await listPublishedNews(db)).toEqual([]);
  });
});
