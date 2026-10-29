import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  setDatabaseBinding,
  type D1BindValue,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
  type D1RunResult,
} from "./cloudflare-db";
import { GET as getCollection, POST as saveCollection, DELETE as deleteCollection } from "../app/api/admin/cms/collection/route";
import { POST as restoreRevision } from "../app/api/admin/cms/revisions/route";
import { POST as saveSettings } from "../app/api/admin/cms/settings/route";

vi.mock("./newsroom-auth", async importOriginal => {
  const original = await importOriginal<typeof import("./newsroom-auth")>();
  return {
    ...original,
    requireNewsroomActor: vi.fn(async (request: Request, _db: D1DatabaseLike, allowedRoles: readonly string[]) => {
      const role = request.headers.get("x-test-role") ?? "admin";
      if (!allowedRoles.includes(role)) throw new original.NewsroomAuthError(403, "Forbidden");
      return { id: "qa-admin", email: "qa@example.test", displayName: "QA", roles: [role] };
    }),
  };
});

let sqlite: DatabaseSync;
let beforeBatch: (() => void) | null = null;

function adapter(database: DatabaseSync): D1DatabaseLike {
  return {
    prepare(sql: string): D1PreparedStatementLike {
      let params: D1BindValue[] = [];
      const stmt: D1PreparedStatementLike = {
        bind(...values) { params = values; return stmt; },
        async first<T>() { return (database.prepare(sql).get(...params as never[]) ?? null) as T | null; },
        async all<T>() { return { results: database.prepare(sql).all(...params as never[]) as T[] }; },
        async run(): Promise<D1RunResult> {
          const info = database.prepare(sql).run(...params as never[]);
          return { success: true, meta: { changes: info.changes } };
        },
      };
      return stmt;
    },
    async batch(statements) {
      if (beforeBatch) { const action = beforeBatch; beforeBatch = null; action(); }
      database.exec("BEGIN");
      try {
        const outcomes: D1RunResult[] = [];
        for (const stmt of statements) outcomes.push(await stmt.run());
        database.exec("COMMIT");
        return outcomes;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function request(method: "GET" | "POST" | "DELETE", path: string, data?: unknown) {
  return new Request("https://cms.test" + path, {
    method,
    headers: { "x-test-role": "admin", ...(data ? { "content-type": "application/json" } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
function save(id: string | null, data: Record<string, unknown>, token?: string) {
  return saveCollection(request("POST", "/api/admin/cms/collection", {
    module: "products", id, data, expectedUpdatedAt: token,
  }));
}
function remove(id: string, token?: string) {
  return deleteCollection(request("DELETE", "/api/admin/cms/collection", { module: "products", id, expectedUpdatedAt: token }));
}
const sample = { title: "Nền tảng A", slug: "nen-tang-a", summary: "Dữ liệu thử", status: "draft" };
function record(id: string) {
  return sqlite.prepare("SELECT * FROM products WHERE id=?").get(id) as Record<string, unknown> | undefined;
}
function totals() {
  return {
    revisions: Number(sqlite.prepare("SELECT COUNT(*) AS n FROM cms_revisions").get()?.n),
    audits: Number(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n),
  };
}
async function create() {
  const res = await save(null, sample);
  expect(res.status).toBe(200);
  return (await res.json() as { id: string }).id;
}

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("cloudflare/migrations/0001_core.sql", "utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0019_v17_full_cms.sql", "utf8"));
  sqlite.exec("INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('qa-admin','qa@example.test','2026-10-29','2026-10-29')");
  setDatabaseBinding(adapter(sqlite));
  beforeBatch = null;
});
afterEach(() => {
  beforeBatch = null;
  delete (globalThis as { __IAICT_D1_DB__?: D1DatabaseLike }).__IAICT_D1_DB__;
  sqlite.close();
});

describe("CMS transactional integrity", () => {
  it("creates content with exactly one audit", async () => {
    const id = await create();
    expect(record(id)?.title).toBe(sample.title);
    expect(totals()).toEqual({ revisions: 0, audits: 1 });
  });
  it("rolls back a newly created record if audit fails", async () => {
    sqlite.exec("CREATE TRIGGER reject_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'forced audit failure'); END");
    const res = await save(null, sample);
    expect(res.status).toBe(500);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM products").get()?.n).toBe(0);
    expect(totals()).toEqual({ revisions: 0, audits: 0 });
  });
  it("rolls back update, revision and audit on audit failure", async () => {
    const id = await create();
    const before = record(id);
    sqlite.exec("CREATE TRIGGER reject_update_audit BEFORE INSERT ON audit_logs WHEN NEW.action='cms.entity.update' BEGIN SELECT RAISE(ABORT,'forced update failure'); END");
    const res = await save(id, { title: "Should not persist" });
    expect(res.status).toBe(500);
    expect(record(id)).toEqual(before);
    expect(totals()).toEqual({ revisions: 0, audits: 1 });
  });
  it("rolls back revision if content update itself fails", async () => {
    const id = await create();
    sqlite.exec("CREATE TRIGGER reject_update BEFORE UPDATE ON products BEGIN SELECT RAISE(ABORT,'forced update failure'); END");
    const res = await save(id, { title: "Rejected" });
    expect(res.status).toBe(500);
    expect(record(id)?.title).toBe(sample.title);
    expect(totals()).toEqual({ revisions: 0, audits: 1 });
  });
  it("rolls back delete and revision on audit failure", async () => {
    const id = await create();
    sqlite.exec("CREATE TRIGGER reject_delete_audit BEFORE INSERT ON audit_logs WHEN NEW.action='cms.entity.delete' BEGIN SELECT RAISE(ABORT,'forced delete audit failure'); END");
    const res = await remove(id);
    expect(res.status).toBe(500);
    expect(record(id)?.title).toBe(sample.title);
    expect(totals()).toEqual({ revisions: 0, audits: 1 });
  });
  it("deletes content and keeps exactly one recoverable snapshot", async () => {
    const id = await create();
    expect((await remove(id)).status).toBe(200);
    expect(record(id)).toBeUndefined();
    expect(totals()).toEqual({ revisions: 1, audits: 2 });
  });
});

describe("CMS two-writer optimistic concurrency", () => {
  it("returns 409 for the stale second editor without recording extra history", async () => {
    const id = await create();
    const old = String(record(id)?.updated_at);
    expect((await save(id, { title: "Editor one" }, old)).status).toBe(200);
    expect(record(id)?.updated_at).not.toBe(old);
    const stale = await save(id, { title: "Editor two" }, old);
    expect(stale.status).toBe(409);
    expect(record(id)?.title).toBe("Editor one");
    expect(totals()).toEqual({ revisions: 1, audits: 2 });
  });
  it("refuses a stale delete without deleting content", async () => {
    const id = await create();
    const old = String(record(id)?.updated_at);
    await save(id, { title: "Updated elsewhere" }, old);
    const res = await remove(id, old);
    expect(res.status).toBe(409);
    expect(record(id)?.title).toBe("Updated elsewhere");
    expect(totals()).toEqual({ revisions: 1, audits: 2 });
  });
  it("prevents update races after the initial version read but before D1 batch", async () => {
    const id = await create();
    const old = String(record(id)?.updated_at);
    beforeBatch = () => {
      sqlite.prepare("UPDATE products SET title=?,updated_at=? WHERE id=?")
        .run("Competing writer", "2026-10-31T00:00:00.000Z", id);
    };
    const res = await save(id, { title: "Stale writer" }, old);
    expect(res.status).toBe(409);
    expect(record(id)?.title).toBe("Competing writer");
    expect(totals()).toEqual({ revisions: 0, audits: 1 });
  });
  it("prevents delete races after the initial read", async () => {
    const id = await create();
    const old = String(record(id)?.updated_at);
    beforeBatch = () => {
      sqlite.prepare("UPDATE products SET title=?,updated_at=? WHERE id=?")
        .run("Competing writer", "2026-10-31T00:00:00.000Z", id);
    };
    expect((await remove(id, old)).status).toBe(409);
    expect(record(id)?.title).toBe("Competing writer");
    expect(totals()).toEqual({ revisions: 0, audits: 1 });
  });
  it("deletes with a fresh token and retains its history", async () => {
    const id = await create();
    expect((await remove(id, String(record(id)?.updated_at))).status).toBe(200);
    expect(record(id)).toBeUndefined();
    expect(totals()).toEqual({ revisions: 1, audits: 2 });
  });
  it("returns updated_at to the UI for optimistic preconditions", async () => {
    const id = await create();
    const response = await getCollection(request("GET", "/api/admin/cms/collection?module=products"));
    expect(response.status).toBe(200);
    const data = await response.json() as { items: Array<{ id: string; updated_at: string }> };
    expect(data.items.find(item => item.id === id)?.updated_at).toBe(record(id)?.updated_at);
  });
});

describe("CMS settings and restore audit atomicity", () => {
  it("rolls back site settings and snapshot when audit insertion fails", async () => {
    const before = sqlite.prepare("SELECT * FROM site_settings WHERE id='default'").get();
    sqlite.exec("CREATE TRIGGER reject_settings_audit BEFORE INSERT ON audit_logs WHEN NEW.action='cms.settings.update' BEGIN SELECT RAISE(ABORT,'forced failure'); END");
    const res = await saveSettings(request("POST", "/api/admin/cms/settings", {
      organizationName: "Test organization", settings: { siteTitle: "New title" },
    }));
    expect(res.status).toBe(500);
    expect(sqlite.prepare("SELECT * FROM site_settings WHERE id='default'").get()).toEqual(before);
    expect(totals()).toEqual({ revisions: 0, audits: 0 });
  });
  it("rolls back restored content if restore audit fails", async () => {
    const id = await create();
    await save(id, { title: "Changed" });
    const revision = sqlite.prepare("SELECT id FROM cms_revisions WHERE entity_type='products' LIMIT 1").get() as { id: string };
    sqlite.exec("CREATE TRIGGER reject_restore_audit BEFORE INSERT ON audit_logs WHEN NEW.action='cms.revision.restore' BEGIN SELECT RAISE(ABORT,'forced failure'); END");
    const res = await restoreRevision(request("POST", "/api/admin/cms/revisions", { revisionId: revision.id }));
    expect(res.status).toBe(500);
    expect(record(id)?.title).toBe("Changed");
    expect(totals()).toEqual({ revisions: 1, audits: 2 });
  });
  it("restores a prior snapshot with a coherent restore audit", async () => {
    const id = await create();
    await save(id, { title: "Changed" });
    const revision = sqlite.prepare("SELECT id FROM cms_revisions WHERE entity_type='products' LIMIT 1").get() as { id: string };
    const res = await restoreRevision(request("POST", "/api/admin/cms/revisions", { revisionId: revision.id }));
    expect(res.status).toBe(200);
    expect(record(id)?.title).toBe(sample.title);
    expect(totals()).toEqual({ revisions: 2, audits: 4 });
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE action='cms.revision.restore'").get()?.n).toBe(1);
  });
});
