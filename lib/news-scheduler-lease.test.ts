import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import { ingestNewsSource } from "./news-repository";
import { runScheduledNewsIngestion } from "./news-scheduler";

vi.mock("./news-repository", () => ({ ingestNewsSource: vi.fn() }));

let sqlite: DatabaseSync;
const mockedIngest = vi.mocked(ingestNewsSource);
const summary = { runId: "ingest-qa", sourceId: "source-1", fetched: 1,
  created: 1, duplicates: 0, queued: 1, autoPublished: 0, errors: 0 };

function d1(database: DatabaseSync): D1DatabaseLike {
  return {
    prepare(sql: string): D1PreparedStatementLike {
      let params: D1BindValue[] = [];
      const stmt: D1PreparedStatementLike = {
        bind(...values) { params = values; return stmt; },
        async first<T>() { return (database.prepare(sql).get(...params as never[]) ?? null) as T | null; },
        async all<T>() { return { results: database.prepare(sql).all(...params as never[]) as T[], success: true }; },
        async run() { const result = database.prepare(sql).run(...params as never[]); return { success: true, meta: { changes: result.changes } }; },
      };
      return stmt;
    },
    async batch(statements) {
      database.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec("COMMIT");
        return results;
      } catch (error) { database.exec("ROLLBACK"); throw error; }
    },
  };
}
const scheduledTime = () => Date.now();
const next = (id = "source-1") => sqlite.prepare("SELECT next_scheduled_at FROM news_sources WHERE id=?").get(id)?.next_scheduled_at;

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec([
    "CREATE TABLE news_sources (id TEXT PRIMARY KEY, name TEXT NOT NULL, is_active INTEGER DEFAULT 1, schedule_enabled INTEGER DEFAULT 1, schedule_interval_minutes INTEGER DEFAULT 30, schedule_retry_minutes INTEGER DEFAULT 15, next_scheduled_at TEXT, last_scheduled_at TEXT, updated_at TEXT NOT NULL)",
    "CREATE TABLE news_scheduler_claims (source_id TEXT PRIMARY KEY, lease_token TEXT UNIQUE NOT NULL, claimed_at TEXT NOT NULL, lease_until TEXT NOT NULL, scheduler_run_id TEXT NOT NULL)",
    "CREATE TABLE news_scheduler_runs (id TEXT PRIMARY KEY, scheduled_key TEXT NOT NULL UNIQUE, cron_expression TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, metadata_json TEXT DEFAULT '{}', due_count INTEGER DEFAULT 0, claimed_count INTEGER DEFAULT 0, succeeded_count INTEGER DEFAULT 0, failed_count INTEGER DEFAULT 0, skipped_count INTEGER DEFAULT 0)",
    "CREATE TABLE audit_logs (id TEXT PRIMARY KEY, actor_user_id TEXT, action TEXT, entity_type TEXT, entity_id TEXT, metadata_json TEXT, created_at TEXT)",
    "INSERT INTO news_sources(id,name,next_scheduled_at,updated_at) VALUES ('source-1','QA source','2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z')",
  ].join(";\n") + ";");
  mockedIngest.mockReset();
  mockedIngest.mockResolvedValue({ ...summary });
});
afterEach(() => sqlite.close());

describe("Newsroom scheduler D1 lease fencing", () => {
  it("updates next run and releases a lease it still owns", async () => {
    const result = await runScheduledNewsIngestion(d1(sqlite), { cronExpression: "*/15 * * * *", scheduledTime: scheduledTime() });
    expect(result.status).toBe("succeeded");
    expect(next()).not.toBe("2025-01-01T00:00:00.000Z");
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM news_scheduler_claims").get()?.n).toBe(0);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n).toBe(1);
  });
  it("does not allow stale invocation to overwrite a new lease owner", async () => {
    mockedIngest.mockImplementation(async () => {
      sqlite.exec("UPDATE news_scheduler_claims SET lease_token='new-owner' WHERE source_id='source-1'");
      return { ...summary };
    });
    await runScheduledNewsIngestion(d1(sqlite), { cronExpression: "*/15 * * * *", scheduledTime: scheduledTime() });
    expect(next()).toBe("2025-01-01T00:00:00.000Z");
    expect(sqlite.prepare("SELECT lease_token FROM news_scheduler_claims").get()?.lease_token).toBe("new-owner");
  });
  it("does not update the schedule after its lease expires during ingest", async () => {
    mockedIngest.mockImplementation(async () => {
      sqlite.exec("UPDATE news_scheduler_claims SET lease_until='2000-01-01T00:00:00.000Z'");
      return { ...summary };
    });
    await runScheduledNewsIngestion(d1(sqlite), { cronExpression: "*/15 * * * *", scheduledTime: scheduledTime() });
    expect(next()).toBe("2025-01-01T00:00:00.000Z");
  });
  it("continues another source when the first ingest fails", async () => {
    sqlite.exec("INSERT INTO news_sources(id,name,next_scheduled_at,updated_at) VALUES('source-2','Second source','2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z')");
    mockedIngest.mockImplementation(async (_db, sourceId) => {
      if (sourceId === "source-1") throw new Error("Origin timed out");
      return { ...summary, sourceId };
    });
    const result = await runScheduledNewsIngestion(d1(sqlite), { cronExpression: "*/15 * * * *", scheduledTime: scheduledTime() });
    expect(result.status).toBe("partial");
    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(next("source-2")).not.toBe("2025-01-01T00:00:00.000Z");
  });
});
