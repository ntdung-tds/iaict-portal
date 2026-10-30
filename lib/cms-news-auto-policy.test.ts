import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import { fetchNewsSourceCandidates } from "./news-source-adapters";
import { ingestNewsSource } from "./news-repository";

vi.mock("./news-source-adapters", () => ({ fetchNewsSourceCandidates: vi.fn() }));
const mockFetch = vi.mocked(fetchNewsSourceCandidates);
let sqlite: DatabaseSync;
let beforeAutoClaim: (() => void) | null;
const sourceId = "policy-source";
const candidate = {
  sourceId,
  title: "Chính sách công nghệ số thử nghiệm tự động xuất bản",
  sourceUrl: "https://example.org/news/policy",
  canonicalUrl: "https://example.org/news/policy",
  excerpt: "Bài viết chính thức phục vụ kiểm thử.",
  sourcePublishedAt: "2026-10-29T00:00:00.000Z",
};

function adapter(db: DatabaseSync): D1DatabaseLike {
  return {
    prepare(sql: string): D1PreparedStatementLike {
      let args: D1BindValue[] = [];
      const stmt: D1PreparedStatementLike = {
        bind(...values) { args = values; return stmt; },
        async first<T>() { return (db.prepare(sql).get(...args as never[]) ?? null) as T | null; },
        async all<T>() { return { results: db.prepare(sql).all(...args as never[]) as T[] }; },
        async run() {
          const result = db.prepare(sql).run(...args as never[]);
          return { success: true, meta: { changes: result.changes } };
        },
      };
      return stmt;
    },
    async batch(statements) {
      if (beforeAutoClaim && statements[0] && /INSERT INTO news_publication_claims/i.test((statements[0] as unknown as {sql?: string}).sql ?? "")) {
        beforeAutoClaim();
        beforeAutoClaim = null;
      }
      db.exec("BEGIN");
      try {
        const results = [];
        for (const stmt of statements) results.push(await stmt.run());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

// The wrapper must expose SQL for a pre-transaction race injection.
function raceAdapter(db: DatabaseSync): D1DatabaseLike {
  const original = adapter(db);
  return {
    ...original,
    prepare(sql: string) {
      const stmt = original.prepare(sql);
      Object.defineProperty(stmt, "sql", { value: sql });
      return stmt;
    },
  };
}

function count(table: string): number {
  if (!["articles", "article_provenance", "news_publication_claims"].includes(table)) throw Error("unsupported test table");
  return Number(sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);
}
function row() {
  return sqlite.prepare("SELECT workflow_status,approval_mode,article_id FROM news_review_queue LIMIT 1").get();
}
async function ingest() {
  return ingestNewsSource(raceAdapter(sqlite), sourceId);
}

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  for (const file of [
    "0001_core.sql", "0012_v16_news_ingestion_review.sql",
    "0014_v16_news_auto_publish_policy.sql", "0017_v16_news_publication_claims.sql",
  ]) sqlite.exec(readFileSync(`cloudflare/migrations/${file}`, "utf8"));
  sqlite.exec(`
    INSERT INTO article_categories(id,name,slug) VALUES('cat','QA policies','qa-policies');
    INSERT INTO article_categories(id,name,slug) VALUES('other','Other category','other');
    INSERT INTO news_sources(
      id,name,homepage_url,entry_url,trust_level,publication_mode,
      attribution_mode,default_category_id,created_at,updated_at
    ) VALUES (
      'policy-source','QA news','https://example.org','https://example.org/rss',
      'official','inherit','source_name_and_link','cat','2026','2026'
    );
    UPDATE news_workflow_settings SET auto_publish_enabled=1,
      auto_publish_min_trust='official', auto_publish_max_per_run=10
      WHERE id='default';
  `);
  beforeAutoClaim = null;
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    candidates: [candidate],
    fetchedAt: "2026-10-30T00:00:00.000Z",
    strategy: "rss",
    entryUrl: "https://example.org/rss",
  } as never);
});

afterEach(() => { beforeAutoClaim = null; sqlite.close(); });

describe("atomic auto-publication policy guard", () => {
  it("publishes eligible content when the policy and source are unchanged", async () => {
    const summary = await ingest();
    expect(summary).toMatchObject({ created: 1, autoPublished: 1, queued: 0, errors: 0 });
    expect(row()?.workflow_status).toBe("published");
    expect(count("articles")).toBe(1);
    expect(count("article_provenance")).toBe(1);
    expect(count("news_publication_claims")).toBe(0);
  });

  it.each([
    ["global auto-publish disabled", "UPDATE news_workflow_settings SET auto_publish_enabled=0 WHERE id='default'"],
    ["trust threshold policy changed", "UPDATE news_workflow_settings SET auto_publish_min_trust='reference' WHERE id='default'"],
    ["require source publish date changed", "UPDATE news_workflow_settings SET require_source_published_at=1 WHERE id='default'"],
    ["source forced to manual", "UPDATE news_sources SET publication_mode='manual' WHERE id='policy-source'"],
    ["source deactivated", "UPDATE news_sources SET is_active=0 WHERE id='policy-source'"],
    ["source category replaced", "UPDATE news_sources SET default_category_id='other' WHERE id='policy-source'"],
    ["source trust level changed", "UPDATE news_sources SET trust_level='reference' WHERE id='policy-source'"],
  ])("keeps item in review if %s just before D1 publication batch", async (_label, sql) => {
    beforeAutoClaim = () => sqlite.exec(sql);
    const summary = await ingest();
    expect(summary).toMatchObject({ created: 1, queued: 1, autoPublished: 0, errors: 0 });
    expect(row()?.workflow_status).toBe("pending");
    expect(row()?.article_id).toBeNull();
    expect(count("articles")).toBe(0);
    expect(count("article_provenance")).toBe(0);
    expect(count("news_publication_claims")).toBe(0);
  });
});
