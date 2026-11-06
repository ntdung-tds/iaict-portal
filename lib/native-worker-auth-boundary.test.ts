import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike, D1RunResult } from "./cloudflare-db";
import { NATIVE_COOKIE, NATIVE_VERIFIED_EMAIL_HEADER } from "./native-auth";

vi.mock("vinext/server/fetch-handler", () => ({
  default: {
    fetch: async (request: Request, env: { DB: D1DatabaseLike }) => {
      if (!new URL(request.url).pathname.startsWith("/api/admin/")) {
        return Response.json({ isPublic: true });
      }
      const { requireNewsroomActor, NewsroomAuthError } = await import("./newsroom-auth");
      try {
        const actor = await requireNewsroomActor(request, env.DB, ["admin"]);
        return Response.json({ ok: true, actor });
      } catch (error) {
        if (error instanceof NewsroomAuthError) {
          return Response.json({ error: error.message }, { status: error.status });
        }
        throw error;
      }
    },
  },
}));
vi.mock("./public-redirects", () => ({ resolvePublicRedirect: async () => null }));
vi.mock("./cms-public-cors", () => ({
  withPublicPreviewCors: (_req: Request, response: Response) => response,
}));

import worker from "../worker";

class Prepared implements D1PreparedStatementLike {
  bound: D1BindValue[] = [];
  constructor(readonly sql: string, private readonly owner: FakeDb) {}
  bind(...values: D1BindValue[]): D1PreparedStatementLike { this.bound = values; return this; }
  async first<T>(): Promise<T | null> {
    if (this.sql.includes("FROM iaict_auth_sessions s")) {
      this.owner.sessionReads += 1;
      this.owner.sessionSql = this.sql;
      this.owner.sessionBind = this.bound;
      if (this.owner.sessionActive) return { email: "qa@example.test" } as T;
      return null;
    }
    if (this.sql.includes("FROM admin_users u")) {
      this.owner.roleReads += 1;
      this.owner.roleBind = this.bound;
      if (this.owner.roleActive) {
        return {
          id: "qa-id", email: "qa@example.test",
          display_name: "QA", role_codes: this.owner.role,
        } as T;
      }
      return null;
    }
    throw new Error("Unexpected SQL / prohibited business read");
  }
  async all<T>(): Promise<{ results: T[] }> { throw new Error("Prohibited SQL all"); }
  async run(): Promise<D1RunResult> { throw new Error("Prohibited write"); }
}
class FakeDb implements D1DatabaseLike {
  sessionActive = true;
  roleActive = true;
  role = "admin";
  sessionReads = 0;
  roleReads = 0;
  sessionBind: D1BindValue[] = [];
  roleBind: D1BindValue[] = [];
  sessionSql = "";
  prepare(sql: string): D1PreparedStatementLike { return new Prepared(sql, this); }
  async batch(): Promise<D1RunResult[]> { throw new Error("Prohibited D1 writes"); }
}
let db: FakeDb;
beforeEach(() => { db = new FakeDb(); });
afterEach(() => {
  delete (globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean })
    .__IAICT_NATIVE_AUTH_ENABLED__;
});
const ctx = { waitUntil(_promise: Promise<unknown>) {} };
const ROOT = "https://iaict-portal-staging.iaict-platform.workers.dev";
const COOKIE = NATIVE_COOKIE + "=" + "a".repeat(64);
type Options = { native?: boolean; cookie?: string; forgedEmail?: string; method?: string; origin?: string };
async function call(path: string, opts: Options = {}) {
  const headers = new Headers();
  if (opts.cookie) headers.set("Cookie", opts.cookie);
  if (opts.forgedEmail) headers.set(NATIVE_VERIFIED_EMAIL_HEADER, opts.forgedEmail);
  if (opts.origin) headers.set("Origin", opts.origin);
  return worker.fetch(new Request(ROOT + path, {method:opts.method ?? "GET", headers}), {
    DB: db,
    IAICT_NATIVE_AUTH_ENABLED: opts.native === false ? "false" : "true",
    ACCESS_TEAM_DOMAIN: "https://lucky-sun-c4ca.cloudflareaccess.com",
    ACCESS_POLICY_AUD: "a".repeat(64),
  }, ctx);
}

describe("native authentication at actual Worker ingress, before CMS role lookup", () => {
  it("blocks forged internal actor header without D1 lookups", async () => {
    const result = await call("/api/admin/cms/session", {
      forgedEmail: "admin@example.test",
    });
    expect(result.status).toBe(401);
    expect(db.sessionReads).toBe(0);
    expect(db.roleReads).toBe(0);
  });
  it("production feature-off ignores a native session cookie", async () => {
    const result = await call("/api/admin/cms/session", {native:false,cookie:COOKIE});
    expect(result.status).toBe(401);
    expect(db.sessionReads).toBe(0);
  });
  it("accepts a verified live D1 session only when CMS RBAC grants admin", async () => {
    const result = await call("/api/admin/cms/session", {cookie:COOKIE});
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({actor:{email:"qa@example.test",roles:["admin"]}});
    expect(db.sessionReads).toBe(1);
    expect(db.roleReads).toBe(1);
    expect(db.sessionSql).toContain("s.revoked_at IS NULL");
    expect(db.sessionSql).toContain("s.expires_at>?");
    expect(db.sessionSql).toContain("u.is_active=1");
    expect(db.sessionBind[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(db.sessionBind[0]).not.toBe("a".repeat(64));
    expect(db.roleBind[0]).toBe("qa@example.test");
  });
  it.each([
    ["revoked or expired native session", () => {db.sessionActive=false;}],
    ["inactive user in role lookup", () => {db.roleActive=false;}],
  ])("fails closed for %s", async (_label, change) => {
    change();
    const response = await call("/api/admin/cms/session", {cookie:COOKIE});
    expect(response.status).toBe(db.sessionActive ? 403 : 401);
    expect(db.roleReads).toBe(db.sessionActive ? 1 : 0);
  });
  it("blocks non-admin roles even with a valid native session", async () => {
    db.role="viewer";
    const response=await call("/api/admin/cms/session",{cookie:COOKIE});
    expect(response.status).toBe(403);
    expect(db.sessionReads).toBe(1);
    expect(db.roleReads).toBe(1);
  });
  it("blocks native state-changing API requests with absent or untrusted Origin", async () => {
    for (const origin of [undefined, "https://evil.invalid", "null"]) {
      const response=await call("/api/admin/cms/session",{
        cookie:COOKIE,method:"POST",origin,
      });
      expect(response.status).toBe(403);
    }
    expect(db.roleReads).toBe(0);
  });
  it("allows same-origin request past CSRF boundary but still requires a CMS role", async () => {
    db.role="viewer";
    const response=await call("/api/admin/cms/session", {
      cookie:COOKIE,method:"POST",origin:ROOT,
    });
    expect(response.status).toBe(403);
    expect(db.roleReads).toBe(1);
  });
});
