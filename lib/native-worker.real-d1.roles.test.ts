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
import type { MediaR2BucketLike } from "./media-r2-runtime";
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
      const path = new URL(request.url).pathname;
      // Real production CMS user API, only the vinext dispatch is replaced.
      // No synthetic authorization response: the route runs its own checks/SQL.
      if (path === "/api/admin/cms/media/quarantine" && request.method === "POST") {
        const mediaRoute = await import("../app/api/admin/cms/media/quarantine/route");
        return mediaRoute.POST(request);
      }
      if (path === "/api/admin/cms/users") {
        const route = await import("../app/api/admin/cms/users/route");
        if (request.method === "GET") return route.GET(request);
        if (request.method === "POST") return route.POST(request);
        if (request.method === "DELETE") return route.DELETE(request);
        return new Response("QA method unsupported", { status: 405 });
      }
      const allow = gates[path];
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
  const passwords = new Map<RoleName, string>();
  const ctx = { waitUntil(_promise: Promise<unknown>) {} };

  async function fetchGate(
    role: RoleName | null, gate = "cms-read",
    options?: { method?: string; origin?: string; forgedActor?: string; cookie?: string; native?: boolean; body?: Record<string, unknown> },
  ) {
    const headers = new Headers();
    const token = role ? sessions.get(role) : undefined;
    if (options?.cookie ?? token) headers.set("Cookie", NATIVE_COOKIE + "=" + (options?.cookie ?? token));
    if (options?.origin) headers.set("Origin", options.origin);
    if (options?.forgedActor) headers.set("X-IAICT-Verified-Email", options.forgedActor);
    if (options?.body) headers.set("Content-Type", "application/json");
    const url = gate === "cms-users" ? "/api/admin/cms/users" : "/api/admin/_qa/" + gate;
    return worker.fetch(new Request(root + url, {
      method: options?.method ?? "GET", headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    }), {
      DB: db, IAICT_NATIVE_AUTH_ENABLED: options?.native === false ? "false" : "true",
      // Neither real Access assertion nor JWKS is present in any request.
    }, ctx);
  }

  async function fetchPrivateMedia(
    role: RoleName | null,
    options: { enabled?: boolean; origin?: string; spoofEmail?: string } = {},
  ) {
    const token = role ? sessions.get(role) : undefined;
    const headers = new Headers({
      "content-type": "image/png",
      "x-media-filename": "synthetic-worker-test.png",
      "idempotency-key": randomUUID(),
      "origin": options.origin ?? root,
    });
    if (token) headers.set("Cookie", NATIVE_COOKIE + "=" + token);
    if (options.spoofEmail) headers.set("X-IAICT-Verified-Email", options.spoofEmail);
    const file = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
    return worker.fetch(new Request(root + "/api/admin/cms/media/quarantine", {
      method: "POST", headers, body: file,
    }), {
      DB: db, IAICT_NATIVE_AUTH_ENABLED: "true",
      MEDIA_BUCKET: await mf.getR2Bucket("MEDIA_BUCKET") as unknown as MediaR2BucketLike,
      MEDIA_R2_QUARANTINE_ENABLED: options.enabled === false ? "false" : "true",
    }, ctx);
  }

  beforeAll(async () => {
    mf = new Miniflare(convertV4MiniflareOptions({
      modules: true, script: "export default { fetch() { return new Response('isolated') } }",
      compatibilityDate: "2026-10-12", compatibilityFlags: ["nodejs_compat"],
      d1Databases: { DB: randomUUID() },
      r2Buckets: { MEDIA_BUCKET: "qa-worker-media-r2" },
    }));
    db = await mf.getD1Database("DB") as unknown as D1DatabaseLike;
    for (const name of [
      "0001_core.sql", "0019_v17_full_cms.sql",
      "0022_iaict_native_auth.sql",
      "0023_iaict_auth_pbkdf2_workers.sql", "0024_iaict_activation_invites.sql",
      "0025_media_r2_quarantine.sql",
    ]) {
      const sql = await readFile(new URL("../cloudflare/migrations/" + name, import.meta.url), "utf8");
      for (const part of sql.split(/;\s*(?:\r?\n|$)/).map(x => x.trim())
        .filter(x => x.split(/\r?\n/).some(line => line.trim() && !line.trim().startsWith("--")))) {
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
      passwords.set(role, password);
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

  it("executes genuine native Worker ingress and D1 CMS-role checks for private Media quarantine using LOCAL R2", async () => {
    // The browser/vinext dispatch is mocked, but Worker native sessions,
    // CMS actor SQL, route body handling and Miniflare D1/R2 are REAL LOCAL.
    const allowed = new Set(["admin","admin2","editor"]);
    for (const role of roleNames) {
      const response = await fetchPrivateMedia(role);
      const expectCode = allowed.has(role) ? 201 : 403;
      expect(response.status,role).toBe(expectCode);
      const body = await response.json() as {ok?:boolean;state?:string;publicUrl?:unknown;code?:string};
      if (allowed.has(role)) {
        expect(body).toMatchObject({ok:true,state:"QUARANTINED",publicUrl:null});
      } else {
        expect(body.code).toBe("ROLE_DENIED");
      }
    }
    expect((await fetchPrivateMedia(null)).status).toBe(401);
    // A forged Worker-owned header cannot turn a viewer into an editor.
    expect((await fetchPrivateMedia("viewer",{spoofEmail:email("admin")})).status).toBe(403);
    expect((await fetchPrivateMedia("admin",{origin:"https://evil.invalid"})).status).toBe(403);
    const disabled=await fetchPrivateMedia("admin",{enabled:false});
    expect(disabled.status).toBe(503);
    expect((await disabled.json() as {code?:string}).code).toBe("MEDIA_QUARANTINE_NOT_ENABLED");
    const objectCount=await db.prepare("SELECT COUNT(*) AS n FROM media_r2_quarantine_uploads WHERE state='QUARANTINED'")
      .first<{n:number}>();
    expect(objectCount?.n).toBe(3);
  }, 40_000);

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


  it("uses the REAL CMS users route: Admin GET succeeds, non-admin GET and foreign-Origin POST fail closed", async () => {
    const admin = await fetchGate("admin", "cms-users");
    expect(admin.status).toBe(200);
    const data = await admin.json() as {users: Array<{id:string}>};
    expect(data.users.length).toBe(8);
    expect(data.users.some(u => u.id === username("admin2"))).toBe(true);
    expect((await fetchGate("editor", "cms-users")).status).toBe(403);
    expect((await fetchGate("admin", "cms-users", {
      method: "POST", origin: "https://untrusted.invalid",
      body: {id: username("editor"), email: email("editor"), roles: ["viewer"]},
    })).status).toBe(403);
  });

  it("REAL CMS user-role update atomically revokes old native session across remove and regrant", async () => {
    // No fake DB response: actual CMS user POST performs CAS, updates RBAC,
    // deletes every native session and records the edit in one D1 batch.
    const target: RoleName = "editor";
    const tokenBefore = sessions.get(target)!;
    const list = await fetchGate("admin", "cms-users");
    const body = await list.json() as {
      users: Array<{id:string;updated_at:string;display_name:string|null;is_active:number;roles:string[]}>;
    };
    const current = body.users.find(u => u.id === username(target));
    expect(current?.roles).toEqual(["editor"]);
    const changes = {
      id: username(target), email: email(target),
      displayName: current!.display_name ?? "", isActive: true,
      roles: ["viewer"], updatedAt: current!.updated_at,
    };
    const removed = await fetchGate("admin", "cms-users", {
      method:"POST", origin:root, body:changes,
    });
    expect(removed.status, await removed.clone().text()).toBe(200);
    const removedBody = await removed.json() as {updatedAt:string};
    expect(removedBody.updatedAt).not.toBe(current!.updated_at);
    expect((await fetchGate(target, "cms-read", {cookie:tokenBefore})).status).toBe(401);
    expect((await db.prepare("SELECT COUNT(*) AS n FROM iaict_auth_sessions WHERE user_id=?")
      .bind(username(target)).first<{n:number}>())?.n).toBe(0);

    const tokenViewer = await authenticateNativePassword(db, email(target), passwords.get(target)!);
    expect(tokenViewer).toMatch(/^[0-9a-f]{64}$/);
    expect((await fetchGate(target, "cms-read", {cookie:tokenViewer!})).status).toBe(200);
    expect((await fetchGate(target, "cms-edit", {cookie:tokenViewer!})).status).toBe(403);

    // Client replays the stale revision: must return conflict with no D1 writes,
    // and must NOT invalidate a session issued after the first successful edit.
    const stale = await fetchGate("admin", "cms-users", {
      method:"POST", origin:root,
      body: {...changes, roles:["editor"]},
    });
    expect(stale.status).toBe(409);
    expect((await fetchGate(target, "cms-read", {cookie:tokenViewer!})).status).toBe(200);

    const regrant = await fetchGate("admin", "cms-users", {
      method:"POST", origin:root,
      body: {...changes, roles:["editor"],updatedAt:removedBody.updatedAt},
    });
    expect(regrant.status, await regrant.clone().text()).toBe(200);
    expect((await fetchGate(target, "cms-read", {cookie:tokenBefore})).status).toBe(401);
    expect((await fetchGate(target, "cms-read", {cookie:tokenViewer!})).status).toBe(401);

    const tokenAfter = await authenticateNativePassword(db, email(target), passwords.get(target)!);
    expect(tokenAfter).toMatch(/^[0-9a-f]{64}$/);
    sessions.set(target, tokenAfter!);
    expect((await fetchGate(target, "cms-edit")).status).toBe(200);
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toHaveLength(0);
  }, 40_000);


  it("REAL CMS DELETE deactivation and reactivation never resurrect a previously issued native session", async () => {
    const target: RoleName = "news_editor";
    const oldToken = sessions.get(target)!;
    const response = await fetchGate("admin", "cms-users");
    const listing = await response.json() as {
      users: Array<{ id:string; updated_at:string; display_name:string|null; roles:string[] }>;
    };
    const existing = listing.users.find(u => u.id === username(target))!;
    expect(existing.roles).toEqual(["news_editor"]);

    const deactivated = await fetchGate("admin", "cms-users", {
      method:"DELETE", origin:root,
      body:{id:username(target),updatedAt:existing.updated_at},
    });
    expect(deactivated.status, await deactivated.clone().text()).toBe(200);
    const {updatedAt} = await deactivated.json() as {updatedAt:string};
    expect(updatedAt).not.toBe(existing.updated_at);
    expect((await fetchGate(target, "news-edit", {cookie:oldToken})).status).toBe(401);
    expect(await authenticateNativePassword(db, email(target), passwords.get(target)!)).toBeNull();
    expect((await db.prepare("SELECT COUNT(*) AS n FROM iaict_auth_sessions WHERE user_id=?")
      .bind(username(target)).first<{n:number}>())?.n).toBe(0);

    // A stale DELETE cannot invalidate a reactivated user's later session.
    const restored = await fetchGate("admin", "cms-users", {
      method:"POST", origin:root,
      body:{id:username(target),email:email(target),
        displayName:existing.display_name??"",isActive:true,
        roles:["news_editor"],updatedAt},
    });
    expect(restored.status, await restored.clone().text()).toBe(200);
    expect((await fetchGate(target, "news-edit", {cookie:oldToken})).status).toBe(401);
    const newToken = await authenticateNativePassword(db, email(target), passwords.get(target)!);
    expect(newToken).toMatch(/^[0-9a-f]{64}$/);
    expect(newToken).not.toBe(oldToken);
    sessions.set(target,newToken!);
    expect((await fetchGate(target, "news-edit")).status).toBe(200);
    expect((await fetchGate(target, "cms-edit")).status).toBe(403);

    const stale = await fetchGate("admin", "cms-users", {
      method:"DELETE", origin:root,
      body:{id:username(target),updatedAt:existing.updated_at},
    });
    expect(stale.status).toBe(409);
    expect((await fetchGate(target, "news-edit")).status).toBe(200);
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toHaveLength(0);
  }, 45_000);

  it("REAL CMS admin-only revokeSessions clears sessions without stripping roles or disabling users", async () => {
    const target: RoleName = "admin2";
    const oldToken = sessions.get(target)!;
    const denied = await fetchGate("editor", "cms-users", {
      method:"POST", origin:root,
      body:{action:"revokeSessions",id:username(target)},
    });
    expect(denied.status).toBe(403);
    const rejectedOrigin = await fetchGate("admin", "cms-users", {
      method:"POST", origin:"https://untrusted.invalid",
      body:{action:"revokeSessions",id:username(target)},
    });
    expect(rejectedOrigin.status).toBe(403);
    expect((await fetchGate(target, "cms-admin", {cookie:oldToken})).status).toBe(200);

    const result = await fetchGate("admin", "cms-users", {
      method:"POST", origin:root,
      body:{action:"revokeSessions",id:username(target)},
    });
    expect(result.status, await result.clone().text()).toBe(200);
    expect((await result.json() as {revoked:boolean}).revoked).toBe(true);
    expect((await fetchGate(target, "cms-admin", {cookie:oldToken})).status).toBe(401);
    expect((await db.prepare("SELECT COUNT(*) AS n FROM iaict_auth_sessions WHERE user_id=?")
      .bind(username(target)).first<{n:number}>())?.n).toBe(0);
    const nextToken = await authenticateNativePassword(db,email(target),passwords.get(target)!);
    expect(nextToken).toMatch(/^[0-9a-f]{64}$/);
    sessions.set(target,nextToken!);
    expect((await fetchGate(target,"cms-admin")).status).toBe(200);
    expect((await fetchGate(target,"cms-admin",{cookie:oldToken})).status).toBe(401);
  }, 35_000);

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
