import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import {
  CMS_ROLE_CODES,
  CMS_ADMIN_ROLES, CMS_EDIT_ROLES, CMS_READ_ROLES,
  NEWSROOM_ADMIN_ROLES, NEWSROOM_EDIT_ROLES, NEWSROOM_REVIEW_ROLES, NEWSROOM_READ_ROLES,
} from "./cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "./newsroom-auth";

type Permission = "cmsRead" | "cmsEdit" | "cmsAdmin" |
  "newsRead" | "newsEdit" | "newsReview" | "newsAdmin";

const permissions: Record<Permission, readonly (typeof CMS_ROLE_CODES)[number][]> = {
  cmsRead: CMS_READ_ROLES,
  cmsEdit: CMS_EDIT_ROLES,
  cmsAdmin: CMS_ADMIN_ROLES,
  newsRead: NEWSROOM_READ_ROLES,
  newsEdit: NEWSROOM_EDIT_ROLES,
  newsReview: NEWSROOM_REVIEW_ROLES,
  newsAdmin: NEWSROOM_ADMIN_ROLES,
};

const expected: Record<(typeof CMS_ROLE_CODES)[number], Permission[]> = {
  admin: ["cmsRead", "cmsEdit", "cmsAdmin", "newsRead", "newsEdit", "newsReview", "newsAdmin"],
  editor: ["cmsRead", "cmsEdit", "newsRead", "newsEdit"],
  reviewer: ["cmsRead", "newsRead", "newsReview"],
  viewer: ["cmsRead", "newsRead"],
  news_admin: ["newsRead", "newsEdit", "newsReview", "newsAdmin"],
  news_editor: ["newsRead", "newsEdit"],
  news_reviewer: ["newsRead", "newsReview"],
};

let sqlite: DatabaseSync;
const adapter = (database: DatabaseSync): D1DatabaseLike => ({
  prepare(sql: string): D1PreparedStatementLike {
    let args: D1BindValue[] = [];
    const stmt: D1PreparedStatementLike = {
      bind(...values) { args = values; return stmt; },
      async first<T>() { return (database.prepare(sql).get(...args as never[]) ?? null) as T | null; },
      async all<T>() { return { results: database.prepare(sql).all(...args as never[]) as T[] }; },
      async run() {
        const result = database.prepare(sql).run(...args as never[]);
        return { success: true, meta: { changes: result.changes } };
      },
    };
    return stmt;
  },
  async batch() { throw new Error("Unexpected write transaction in read-only role test"); },
});

const request = (email: string) => new Request("https://staging.example.test/api/admin/cms/session", {
  headers: {
    "Cf-Access-Authenticated-User-Email": email,
    // JWT cryptographic checks are separately exercised through worker.fetch.
    "Cf-Access-Jwt-Assertion": "already-verified-at-worker-boundary",
  },
});

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("cloudflare/migrations/0001_core.sql", "utf8"));
  const addUser = sqlite.prepare(
    "INSERT INTO admin_users(id,email,display_name,is_active,created_at,updated_at) VALUES(?,?,?,1,'2026','2026')",
  );
  const addRole = sqlite.prepare("INSERT INTO roles(id,code,name) VALUES(?,?,?)");
  const assignRole = sqlite.prepare("INSERT INTO admin_user_roles(user_id,role_id) VALUES(?,?)");
  for (const role of CMS_ROLE_CODES) {
    addRole.run(`role-${role}`, role, role);
    addUser.run(`user-${role}`, `${role}@example.test`, role);
    assignRole.run(`user-${role}`, `role-${role}`);
  }
});
afterEach(() => sqlite.close());

describe("7 CMS/Newsroom roles × 7 permission boundaries on real D1 role tables", () => {
  it.each(CMS_ROLE_CODES)("enforces every permission boundary for %s", async (role) => {
    const db = adapter(sqlite);
    const actorRequest = request(`${role}@example.test`);
    for (const [permission, allowedRoles] of Object.entries(permissions) as [Permission, readonly (typeof CMS_ROLE_CODES)[number][]][]) {
      const action = requireNewsroomActor(actorRequest, db, allowedRoles);
      if (expected[role].includes(permission)) {
        const actor = await action;
        expect(actor.roles, `${role} should have ${permission}`).toContain(role);
      } else {
        await expect(action, `${role} must not have ${permission}`).rejects.toMatchObject({
          status: 403,
        } satisfies Partial<NewsroomAuthError>);
      }
    }
  });

  it("rejects a deactivated administrator for all CMS and Newsroom operations", async () => {
    sqlite.exec("UPDATE admin_users SET is_active=0 WHERE id='user-admin'");
    const db = adapter(sqlite);
    for (const roles of Object.values(permissions)) {
      await expect(requireNewsroomActor(request("admin@example.test"), db, roles))
        .rejects.toMatchObject({ status: 403 });
    }
  });

  it("rejects unknown users even with a syntactically present Access assertion", async () => {
    await expect(requireNewsroomActor(request("missing@example.test"), adapter(sqlite), CMS_READ_ROLES))
      .rejects.toMatchObject({ status: 403 });
  });

  it("does not grant CMS admin authority to a Newsroom-only administrator", async () => {
    await expect(requireNewsroomActor(request("news_admin@example.test"), adapter(sqlite), CMS_ADMIN_ROLES))
      .rejects.toMatchObject({ status: 403 });
    await expect(requireNewsroomActor(request("news_admin@example.test"), adapter(sqlite), NEWSROOM_ADMIN_ROLES))
      .resolves.toMatchObject({ roles: ["news_admin"] });
  });

  it("stops role lookup without Access headers", async () => {
    await expect(requireNewsroomActor(new Request("https://example.test/api/admin/cms/session"),
      adapter(sqlite), CMS_READ_ROLES)).rejects.toMatchObject({ status: 401 });
  });
});
