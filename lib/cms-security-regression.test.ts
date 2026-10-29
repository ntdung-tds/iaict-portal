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
import { canMutatePublication, PUBLICATION_MODULES } from "./cms-publication-permissions";
import { getCmsModule } from "./cms-schema";
import { GET as collectionGet, POST as collectionPost } from "../app/api/admin/cms/collection/route";
import { POST as articlePost } from "../app/api/admin/cms/articles/route";
import { GET as revisionGet } from "../app/api/admin/cms/revisions/route";

vi.mock("./newsroom-auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("./newsroom-auth")>();
  return {
    ...original,
    requireNewsroomActor: vi.fn(async (request: Request, _db: D1DatabaseLike, allowedRoles: readonly string[]) => {
      const role = request.headers.get("x-test-role") ?? "viewer";
      if (!allowedRoles.includes(role)) {
        throw new original.NewsroomAuthError(403, "Role not allowed");
      }
      return { id: "qa-user", email: "qa@example.test", displayName: "QA User", roles: [role] };
    }),
  };
});

let sqlite: DatabaseSync;

function makeDb(database: DatabaseSync): D1DatabaseLike {
  return {
    prepare(sql: string): D1PreparedStatementLike {
      let params: D1BindValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...values) { params = values; return statement; },
        async first<T>() {
          return (database.prepare(sql).get(...params as never[]) ?? null) as T | null;
        },
        async all<T>() {
          return { results: database.prepare(sql).all(...params as never[]) as T[] };
        },
        async run(): Promise<D1RunResult> {
          const info = database.prepare(sql).run(...params as never[]);
          return { success: true, meta: { changes: info.changes } };
        },
      };
      return statement;
    },
    async batch(statements) {
      database.exec("BEGIN");
      try {
        const outcomes: D1RunResult[] = [];
        for (const statement of statements) outcomes.push(await statement.run());
        database.exec("COMMIT");
        return outcomes;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function send(method: "GET" | "POST", path: string, role: string, body?: unknown): Request {
  return new Request("https://staging.example.test" + path, {
    method,
    headers: { "x-test-role": role, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const product = {
  title: "Nền tảng thử nghiệm",
  slug: "nen-tang-thu-nghiem",
  summary: "Nền tảng dành cho kiểm thử",
  status: "draft",
};
const article = {
  title: "Bản tin thử nghiệm",
  slug: "ban-tin-thu-nghiem",
  category_id: "cat-1",
  body: "Bản tin chỉ sử dụng trong bài test.",
  status: "draft",
};

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("cloudflare/migrations/0001_core.sql", "utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0019_v17_full_cms.sql", "utf8"));
  sqlite.exec("INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('qa-user','qa@example.test','2026-10-29','2026-10-29')");
  sqlite.exec("INSERT INTO article_categories(id,name,slug) VALUES('cat-1','Thử nghiệm','thu-nghiem')");
  sqlite.exec("INSERT INTO leads(id,type,source_url,contact_name,email,consent_at,created_at,updated_at) VALUES('lead-1','consulting','/lien-he','Người thử nghiệm','private@example.test','2026-10-29','2026-10-29','2026-10-29')");
  setDatabaseBinding(makeDb(sqlite));
});

afterEach(() => {
  delete (globalThis as { __IAICT_D1_DB__?: D1DatabaseLike }).__IAICT_D1_DB__;
  sqlite.close();
});

describe("CMS publication permissions (backend regression)", () => {
  it("covers every published public CMS module", () => {
    expect([...PUBLICATION_MODULES]).toEqual([
      "pages", "products", "solutions", "courses", "projects", "experts", "partners", "events",
    ]);
    for (const key of PUBLICATION_MODULES) expect(getCmsModule(key)?.statusColumn).toBe("status");
  });

  it("does not permit editors to create or change a published record", () => {
    expect(canMutatePublication(["editor"], null, "published")).toBe(false);
    expect(canMutatePublication(["editor"], "published", "draft")).toBe(false);
    expect(canMutatePublication(["editor"], "published", "published")).toBe(false);
    expect(canMutatePublication(["editor"], "draft", "review")).toBe(true);
    expect(canMutatePublication(["admin"], "published", "draft")).toBe(true);
  });

  it("lets editor save drafts but rejects publishing via the collection API", async () => {
    const created = await collectionPost(send("POST", "/api/admin/cms/collection", "editor", {
      module: "products", data: product,
    }));
    expect(created.status).toBe(200);
    const { id } = await created.json() as { id: string };
    const attempt = await collectionPost(send("POST", "/api/admin/cms/collection", "editor", {
      module: "products", id, data: { status: "published" },
    }));
    expect(attempt.status).toBe(403);
    expect(sqlite.prepare("SELECT status FROM products WHERE id=?").get(id)?.status).toBe("draft");
  });

  it("rejects editor editing or unpublishing content already live", async () => {
    const created = await collectionPost(send("POST", "/api/admin/cms/collection", "admin", {
      module: "products", data: { ...product, status: "published" },
    }));
    expect(created.status).toBe(200);
    const { id } = await created.json() as { id: string };
    const attempt = await collectionPost(send("POST", "/api/admin/cms/collection", "editor", {
      module: "products", id, data: { title: "Unauthorized change", status: "draft" },
    }));
    expect(attempt.status).toBe(403);
    expect(sqlite.prepare("SELECT status,title FROM products WHERE id=?").get(id)).toMatchObject({
      status: "published", title: product.title,
    });
  });

  it("rejects editor article publication and editing published articles", async () => {
    const denied = await articlePost(send("POST", "/api/admin/cms/articles", "editor", {
      data: { ...article, status: "published" },
    }));
    expect(denied.status).toBe(403);
    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM articles").get()?.count).toBe(0);
    const created = await articlePost(send("POST", "/api/admin/cms/articles", "admin", {
      data: { ...article, status: "published" },
    }));
    expect(created.status).toBe(200);
    const { id } = await created.json() as { id: string };
    const deniedUpdate = await articlePost(send("POST", "/api/admin/cms/articles", "editor", {
      id, data: { ...article, title: "Unauthorized change", status: "draft" },
    }));
    expect(deniedUpdate.status).toBe(403);
    expect(sqlite.prepare("SELECT status,title FROM articles WHERE id=?").get(id)).toMatchObject({
      status: "published", title: article.title,
    });
  });
});

describe("CRM confidential data isolation (backend regression)", () => {
  it.each(["leads", "registrations"])("marks the %s module as admin-only", (module) => {
    expect(getCmsModule(module)?.adminOnly).toBe(true);
  });

  it.each(["viewer", "editor", "reviewer"])("blocks %s from listing leads", async (role) => {
    const res = await collectionGet(send("GET", "/api/admin/cms/collection?module=leads", role));
    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toContain("private@example.test");
  });

  it.each(["viewer", "editor"])("blocks %s from listing course registrations", async (role) => {
    const res = await collectionGet(send("GET", "/api/admin/cms/collection?module=registrations", role));
    expect(res.status).toBe(403);
  });

  it("lets an administrator access lead records for follow-up", async () => {
    const res = await collectionGet(send("GET", "/api/admin/cms/collection?module=leads", "admin"));
    expect(res.status).toBe(200);
    expect((await res.json() as { items: Array<{ id: string }> }).items[0]?.id).toBe("lead-1");
  });

  it("does not expose lead revision snapshots to the viewer role", async () => {
    sqlite.exec("INSERT INTO cms_revisions(id,entity_type,entity_id,snapshot_json,created_at) VALUES('rev-1','leads','lead-1','{\"email\":\"private@example.test\"}','2026-10-29')");
    const res = await revisionGet(send("GET", "/api/admin/cms/revisions?entityType=leads", "viewer"));
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).not.toContain("private@example.test");
  });
});
