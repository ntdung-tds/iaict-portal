/**
 * IAM-ACC-008. Execute actual worker.ts ingress, native-auth.ts, real
 * newsroom-auth RBAC SQL and unmodified IAM migrations in disposable
 * Miniflare D1. vinext page handler is deliberately MOCKED; this is a
 * LOCAL_WORKER_INGRESS_REAL_D1 test, NOT deployed Access/browser acceptance.
 * No hosted database, actual Access JWT, passwords or secrets are touched.
 */
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import type { D1DatabaseLike } from "./cloudflare-db";
import { NATIVE_COOKIE, authenticateNativePassword, setNativePassword } from "./native-auth";

// Real policy source, but the expected permitted-role sets below are
// independently specified, so a regression in these constants is caught.
vi.mock("vinext/server/fetch-handler", () => ({
  default: {
    fetch: async (request: Request, env: { DB: D1DatabaseLike }) => {
      const { requireNewsroomActor, NewsroomAuthError } = await import("./newsroom-auth");
      const roles = await import("./cms-roles");
      const gates: Record<string, readonly string[]> = {
        "/api/admin/_qa/cms-read": roles.CMS_READ_ROLES,
        "/api/admin/_qa/cms-edit": roles.CMS_EDIT_ROLES,
        "/api/admin/_qa/cms-admin": roles.CMS_ADMIN_ROLES,
        "/api/admin/_qa/news-read": roles.NEWSROOM_READ_ROLES,
        "/api/admin/_qa/news-edit": roles.NEWSROOM_EDIT_ROLES,
        "/api/admin/_qa/news-review": roles.NEWSROOM_REVIEW_ROLES,
        "/api/admin/_qa/news-admin": roles.NEWSROOM_ADMIN_ROLES,
      };
      const allow = gates[new URL(request.url).pathname];
      if (!allow) return new Response("QA dispatch route missing", { status: 404 });
      try {
        const actor = await requireNewsroomActor(request, env.DB, allow as readonly (typeof roles.CMS_ROLE_CODES)[number][]);
        return Response.json({ ok: true, userId: actor.id, roles: actor.roles });
      } catch (e) {
        if (e instanceof NewsroomAuthError) return Response.json({ error: e.message }, { status: e.status });
        throw e;
      }
    },
  },
}));
vi.mock("./public-redirects", () => ({ resolvePublicRedirect: async () => null }));
vi.mock("./cms-public-cors", () => ({
  withPublicPreviewCors: (_r: Request, response: Response) => response,
}));
import worker from "../worker";

const root = "https://iaict-portal-staging.iaict-platform.workers.dev";
const roleNames = [
  "admin", "editor", "reviewer", "viewer",
  "news_admin", "news_editor", "news_reviewer", "admin2",
] as const;
type RoleName = (typeof roleNames)[number];
const roleCode = (role: RoleName) => role === "admin2" ? "admin" : role;
const username = (role: RoleName) => "qa-ingress-" + role;
const email = (role: RoleName) => username(role) + "@example.test";
const randomPassword = () => "Qa*2-" + randomBytes(18).toString("hex");

const expected: Record<string, readonly string[]> = {
  "cms-read": ["admin", "editor", "reviewer", "viewer"],
  "cms-edit": ["admin", "editor"],
  "cms-admin": ["admin"],
  "news-read": ["admin", "editor", "reviewer", "viewer", "news_admin", "news_editor", "news_reviewer"],
  "news-edit": ["admin", "editor", "news_admin", "news_editor"],
  "news-review": ["admin", "reviewer", "news_admin", "news_reviewer"],
  "news-admin": ["admin", "news_admin"],
};

describe("real native ingress and RBAC against disposable original-schema D1; mocked HTTP dispatch", () => {
  let mf: Miniflare;
  let db: D1DatabaseLike;
  const sessions = new Map<RoleName, string>();
  const ctx = { waitUntil(_promise: Promise<unknown>) {} };

  async function fetchGate(
    role: RoleName | null, gate = "cms-read",
    options?: { method?: string; origin?: string; forgedActor?: string; cookie?: string; native?: boolean },
  ) {
    const headers = new Headers();
    const token = role ? sessions.get(role) : undefined;
    if (options?.cookie ?? token) headers.set("Cookie", NATIVE_COOKIE + "=" + (options?.cookie ?? token));
    if (options?.origin) headers.set("Origin", options.origin);
    if (options?.forgedActor) headers.set("X-IAICT-Verified-Email", options.forgedActor);
    return worker.fetch(new Request(root + "/api/admin/_qa/" + gate, {
      method: options?.method ?? "GET", headers,
    }), {
      DB: db, IAICT_NATIVE_AUTH_ENABLED: options?.native === false ? "false" : "true",
      // Neither real Access assertion nor JWKS is present in any request.
    }, ctx);
  }

  beforeAll(async () => {
    mf = new Miniflare(convertV4MiniflareOptions({
      modules: true, script: "export default { fetch() { return new Response('isolated') } }",
      compatibilityDate: "2026-10-12", compatibilityFlags: ["nodejs_compat"],
      d1Databases: { DB: randomUUID() },
    }));
    db = await mf.getD1Database("DB") as unknown as D1DatabaseLike;
    for (const name of [
      "0001_core.sql", "0022_iaict_native_auth.sql",
      "0023_iaict_auth_pbkdf2_workers.sql", "0024_iaict_activation_invites.sql",
    ]) {
      const sql = await readFile(new URL("../cloudflare/migrations/" + name, import.meta.url), "utf8");
      for (const part of sql.split(/;\s*(?:\r?\n|$)/).map(x => x.trim()).filter(Boolean)) {
        await db.prepare(part).run();
      }
    }
    for (const role of new Set(roleNames.map(roleCode))) {
      await db.prepare("INSERT INTO roles(id,code,name) VALUES(?,?,?)")
        .bind("role-" + role, role, role).run();
    }
    for (const role of roleNames) {
      await db.prepare("INSERT INTO admin_users(id,email,is_active,created_at,updated_at) VALUES(?,?,1,?,?)")
        .bind(username(role), email(role), "qa", "qa").run();
      await db.prepare("INSERT INTO admin_user_roles(user_id,role_id) VALUES(?,?)")
        .bind(username(role), "role-" + roleCode(role)).run();
      const password = randomPassword();
      await setNativePassword(db, { id: username(role), email: email(role) }, password);
      const token = await authenticateNativePassword(db, email(role), password);
      if (!token) throw new Error("Isolated user login setup failed");
      sessions.set(role, token);
    }
  }, 90_000);

  afterAll(async () => {
    delete (globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean })
      .__IAICT_NATIVE_AUTH_ENABLED__;
    if (mf) await mf.dispose();
  });

  for (const role of roleNames) {
    it("enforces all seven native Worker/RBAC gates for " + role, async () => {
      for (const [gate, permitted] of Object.entries(expected)) {
        const response = await fetchGate(role, gate);
        const shouldAllow = permitted.includes(roleCode(role));
        expect(response.status, role + "/" + gate).toBe(shouldAllow ? 200 : 403);
        if (shouldAllow) {
          expect(await response.json(), role + "/" + gate).toMatchObject({
            ok: true, userId: username(role), roles: [roleCode(role)],
          });
        }
      }
    }, 25_000);
  }

  it("blocks missing cookies, forged internal headers and random session tokens", async () => {
    expect((await fetchGate(null)).status).toBe(401);
    expect((await fetchGate(null, "cms-admin", { forgedActor: email("admin") })).status).toBe(401);
    expect((await fetchGate(null, "cms-admin", {
      cookie: "a".repeat(64), forgedActor: email("admin"),
    })).status).toBe(401);
  });

  it("native feature-off denies an otherwise valid authenticated session", async () => {
    expect((await fetchGate("admin", "cms-admin", {native:false})).status).toBe(401);
  });

  it("denies cross-origin POST before CMS actor lookup, while same-origin POST reaches RBAC", async () => {
    expect((await fetchGate("admin", "cms-admin", {method:"POST", origin:"https://evil.invalid"})).status).toBe(403);
    expect((await fetchGate("admin", "cms-admin", {method:"POST"})).status).toBe(403);
    expect((await fetchGate("admin", "cms-admin", {method:"POST", origin:root})).status).toBe(200);
  });

  it("rejects deleted role and deactivated user even if the old native cookie is retained", async () => {
    await db.prepare("DELETE FROM admin_user_roles WHERE user_id=?")
      .bind(username("news_reviewer")).run();
    expect((await fetchGate("news_reviewer", "news-read")).status).toBe(403);
    await db.prepare("UPDATE admin_users SET is_active=0 WHERE id=?")
      .bind(username("viewer")).run();
    expect((await fetchGate("viewer", "cms-read")).status).toBe(401);
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toHaveLength(0);
  });
});
