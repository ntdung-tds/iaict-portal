import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  setDatabaseBinding, type D1BindValue, type D1DatabaseLike,
  type D1PreparedStatementLike, type D1RunResult,
} from "./cloudflare-db";
import { GET as list, POST as save, DELETE as remove } from "../app/api/admin/cms/articles/route";

vi.mock("./newsroom-auth", async importOriginal => {
  const original = await importOriginal<typeof import("./newsroom-auth")>();
  return {
    ...original,
    requireNewsroomActor: vi.fn(async (request: Request, _db: D1DatabaseLike, roles: readonly string[]) => {
      const role = request.headers.get("x-test-role") ?? "admin";
      if (!roles.includes(role)) throw new original.NewsroomAuthError(403, "Forbidden");
      return { id: "qa-admin", email: "qa@example.test", displayName: "QA", roles: [role] };
    }),
  };
});

let sqlite: DatabaseSync;
let beforeBatch: (() => void) | null = null;
function dbAdapter(database: DatabaseSync): D1DatabaseLike {
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
        const results: D1RunResult[] = [];
        for (const stmt of statements) results.push(await stmt.run());
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
function req(method: "POST" | "DELETE" | "GET", payload?: unknown, role = "admin") {
  return new Request("https://cms.test/api/admin/cms/articles", {
    method, headers: { "x-test-role": role, ...(payload ? { "content-type": "application/json" } : {}) },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
}
const article = { title: "Draft article", category_id: "cat-1", slug: "qa-article", status: "draft", body: "QA test body" };
const category = { id: "cat-1", name: "QA category", slug: "qa", sort_order: 0 };
function getArticle(id: string) {
  return sqlite.prepare("SELECT * FROM articles WHERE id=?").get(id) as Record<string, unknown> | undefined;
}
function getCategory(id: string) {
  return sqlite.prepare("SELECT * FROM article_categories WHERE id=?").get(id) as Record<string, unknown> | undefined;
}
function counts() {
  return {
    revisions: sqlite.prepare("SELECT COUNT(*) AS n FROM cms_revisions").get()?.n,
    audits: sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n,
  };
}
async function createArticle() {
  const response = await save(req("POST", { action: "save-article", data: article }));
  expect(response.status).toBe(200);
  return (await response.json() as { id: string }).id;
}
function updateArticle(id: string, data: Record<string, unknown>, token?: string, role = "admin") {
  return save(req("POST", { action: "save-article", id, expectedUpdatedAt: token, data: { ...article, ...data } }, role));
}
function deleteArticle(id: string, token?: string) {
  return remove(req("DELETE", { type: "article", id, expectedUpdatedAt: token }));
}
function updateCategory(id: string, data: Record<string, unknown>, expectedCategory: Record<string, unknown> | null) {
  return save(req("POST", { action: "save-category", id, data, expectedCategory }));
}

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("cloudflare/migrations/0001_core.sql", "utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0019_v17_full_cms.sql", "utf8"));
  sqlite.exec("PRAGMA foreign_keys=ON");
  sqlite.exec("INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('qa-admin','qa@example.test','2026-10-29','2026-10-29')");
  sqlite.prepare("INSERT INTO article_categories(id,name,slug,sort_order) VALUES(?,?,?,?)")
    .run(category.id, category.name, category.slug, category.sort_order);
  setDatabaseBinding(dbAdapter(sqlite)); beforeBatch = null;
});
afterEach(() => {
  beforeBatch = null;
  delete (globalThis as { __IAICT_D1_DB__?: D1DatabaseLike }).__IAICT_D1_DB__;
  sqlite.close();
});

describe("CMS articles — atomic operations and optimistic version locks", () => {
  it("creates a draft and exactly one audit", async () => {
    const id = await createArticle();
    expect(getArticle(id)?.status).toBe("draft");
    expect(counts()).toEqual({ revisions: 0, audits: 1 });
  });
  it("rolls back article INSERT if the audit INSERT fails", async () => {
    sqlite.exec("CREATE TRIGGER fail_create_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'forced audit failure'); END");
    const response = await save(req("POST", { action: "save-article", data: article }));
    expect(response.status).toBe(500);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM articles").get()?.n).toBe(0);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });
  it("updates an article and writes a recoverable revision plus audit", async () => {
    const id = await createArticle();
    const response = await updateArticle(id, { title: "Edited" }, String(getArticle(id)?.updated_at));
    expect(response.status).toBe(200);
    expect(getArticle(id)?.title).toBe("Edited");
    expect(counts()).toEqual({ revisions: 1, audits: 2 });
  });
  it("rejects an update without the prior article version", async () => {
    const id = await createArticle();
    const response = await updateArticle(id, { title: "Legacy client" });
    expect(response.status).toBe(409);
    expect(getArticle(id)?.title).toBe(article.title);
    expect(counts()).toEqual({ revisions: 0, audits: 1 });
  });
  it("rolls back update and revision on audit failure", async () => {
    const id = await createArticle();
    sqlite.exec("CREATE TRIGGER fail_update_audit BEFORE INSERT ON audit_logs WHEN NEW.action='cms.article.update' BEGIN SELECT RAISE(ABORT,'forced audit failure'); END");
    const response = await updateArticle(id, { title: "Should not save" }, String(getArticle(id)?.updated_at));
    expect(response.status).toBe(500);
    expect(getArticle(id)?.title).toBe(article.title);
    expect(counts()).toEqual({ revisions: 0, audits: 1 });
  });
  it("rejects a stale admin writer without creating revision or audit", async () => {
    const id = await createArticle();
    const old = String(getArticle(id)?.updated_at);
    expect((await updateArticle(id, { title: "First" }, old)).status).toBe(200);
    const second = await updateArticle(id, { title: "Second" }, old);
    expect(second.status).toBe(409);
    expect(getArticle(id)?.title).toBe("First");
    expect(counts()).toEqual({ revisions: 1, audits: 2 });
  });
  it("blocks editor overwrite after admin publishes between precheck and D1 batch", async () => {
    const id = await createArticle();
    const old = String(getArticle(id)?.updated_at);
    beforeBatch = () => {
      sqlite.prepare("UPDATE articles SET status=?,updated_at=? WHERE id=?")
        .run("published", new Date(Date.parse(old) + 10000).toISOString(), id);
    };
    const response = await updateArticle(id, { title: "Stale editor", status: "draft" }, old, "editor");
    expect(response.status).toBe(409);
    expect(getArticle(id)?.status).toBe("published");
    expect(getArticle(id)?.title).toBe(article.title);
    expect(counts()).toEqual({ revisions: 0, audits: 1 });
  });
  it("blocks editor overwrite when status becomes published but timestamp stays unchanged", async () => {
    const id = await createArticle();
    const old = String(getArticle(id)?.updated_at);
    beforeBatch = () => { sqlite.prepare("UPDATE articles SET status='published' WHERE id=?").run(id); };
    const response = await updateArticle(id, { title: "Unsafe edit" }, old, "editor");
    expect(response.status).toBe(409);
    expect(getArticle(id)?.status).toBe("published");
    expect(counts()).toEqual({ revisions: 0, audits: 1 });
  });
  it("allows the editor to update a draft with a fresh token", async () => {
    const id = await createArticle();
    expect((await updateArticle(id, { status: "review", title: "For review" }, String(getArticle(id)?.updated_at), "editor")).status).toBe(200);
    expect(getArticle(id)?.status).toBe("review");
    expect(counts()).toEqual({ revisions: 1, audits: 2 });
  });
  it("rolls back article deletion if audit fails", async () => {
    const id = await createArticle();
    sqlite.exec("CREATE TRIGGER fail_delete_audit BEFORE INSERT ON audit_logs WHEN NEW.action='cms.article.delete' BEGIN SELECT RAISE(ABORT,'forced audit failure'); END");
    const response = await deleteArticle(id, String(getArticle(id)?.updated_at));
    expect(response.status).toBe(500);
    expect(getArticle(id)).toBeDefined();
    expect(counts()).toEqual({ revisions: 0, audits: 1 });
  });
  it("requires a version token on delete, and retains a snapshot on success", async () => {
    const id = await createArticle();
    expect((await deleteArticle(id)).status).toBe(409);
    expect((await deleteArticle(id, String(getArticle(id)?.updated_at))).status).toBe(200);
    expect(getArticle(id)).toBeUndefined();
    expect(counts()).toEqual({ revisions: 1, audits: 2 });
  });
});

describe("CMS article categories — versionless snapshot compare-and-swap", () => {
  it("rolls back category creation when audit fails", async () => {
    sqlite.exec("CREATE TRIGGER fail_category_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'forced failure'); END");
    const response = await save(req("POST", { action: "save-category", data: { name: "New category" } }));
    expect(response.status).toBe(500);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM article_categories").get()?.n).toBe(1);
  });
  it("blocks category edits without the original snapshot", async () => {
    const res = await updateCategory("cat-1", { name: "Unsafe edit" }, null);
    expect(res.status).toBe(409);
    expect(getCategory("cat-1")?.name).toBe(category.name);
  });
  it("updates a category atomically and records its revision", async () => {
    const res = await updateCategory("cat-1", { name: "New name", sort_order: 2 }, category);
    expect(res.status).toBe(200);
    expect(getCategory("cat-1")?.name).toBe("New name");
    expect(counts()).toEqual({ revisions: 1, audits: 1 });
  });
  it("does not apply a category update after a competing edit", async () => {
    beforeBatch = () => { sqlite.prepare("UPDATE article_categories SET name='Other editor' WHERE id='cat-1'").run(); };
    const response = await updateCategory("cat-1", { name: "Stale writer" }, category);
    expect(response.status).toBe(409);
    expect(getCategory("cat-1")?.name).toBe("Other editor");
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });
  it("rolls back category update and revision when audit fails", async () => {
    sqlite.exec("CREATE TRIGGER fail_category_update BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'forced failure'); END");
    const response = await updateCategory("cat-1", { name: "Rejected" }, category);
    expect(response.status).toBe(500);
    expect(getCategory("cat-1")?.name).toBe(category.name);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });
  it("refuses deleting a category that already has articles", async () => {
    await createArticle();
    const response = await remove(req("DELETE", { type: "category", id: "cat-1", expectedCategory: category }));
    expect(response.status).toBe(400);
    expect(getCategory("cat-1")).toBeDefined();
    expect(counts()).toEqual({ revisions: 0, audits: 1 });
  });
  it("refuses category deletion if an article appears after precheck, without orphan audit", async () => {
    beforeBatch = () => {
      sqlite.exec("INSERT INTO articles(id,title,slug,category_id,body,created_at,updated_at) VALUES('race-1','New article','race','cat-1','body','2026-10-30','2026-10-30')");
    };
    const response = await remove(req("DELETE", { type: "category", id: "cat-1", expectedCategory: category }));
    expect(response.status).toBe(400);
    expect(getCategory("cat-1")).toBeDefined();
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });
  it("rolls back category deletion when audit fails", async () => {
    sqlite.exec("CREATE TRIGGER fail_category_delete BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'forced failure'); END");
    const response = await remove(req("DELETE", { type: "category", id: "cat-1", expectedCategory: category }));
    expect(response.status).toBe(500);
    expect(getCategory("cat-1")).toBeDefined();
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });
  it("deletes an unused category with revision and audit", async () => {
    const response = await remove(req("DELETE", { type: "category", id: "cat-1", expectedCategory: category }));
    expect(response.status).toBe(200);
    expect(getCategory("cat-1")).toBeUndefined();
    expect(counts()).toEqual({ revisions: 1, audits: 1 });
  });
  it("lists current updated_at values and category snapshots for the UI", async () => {
    const id = await createArticle();
    const response = await list(req("GET"));
    expect(response.status).toBe(200);
    const body = await response.json() as { articles: Array<{id:string;updated_at:string}>; categories: Array<{id:string;name:string}> };
    expect(body.articles.find(item => item.id === id)?.updated_at).toBe(getArticle(id)?.updated_at);
    expect(body.categories[0]?.name).toBe(category.name);
  });
});
