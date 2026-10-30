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
import { GET, POST, DELETE } from "../app/api/admin/cms/users/route";

vi.mock("./newsroom-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./newsroom-auth")>();
  return {
    ...actual,
    requireNewsroomActor: vi.fn(async (request: Request, _db: D1DatabaseLike, allowedRoles: readonly string[]) => {
      const role = request.headers.get("x-test-role") ?? "admin";
      if (!allowedRoles.includes(role)) throw new actual.NewsroomAuthError(403, "Forbidden");
      return {
        id: "qa-admin",
        email: "qa-admin@example.test",
        displayName: "Test Administrator",
        roles: [role],
      };
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
        async first<T>() {
          return (database.prepare(sql).get(...params as never[]) ?? null) as T | null;
        },
        async all<T>() {
          return { results: database.prepare(sql).all(...params as never[]) as T[] };
        },
        async run(): Promise<D1RunResult> {
          const run = database.prepare(sql).run(...params as never[]);
          return { success: true, meta: { changes: run.changes } };
        },
      };
      return stmt;
    },
    async batch(statements) {
      // Model Cloudflare D1 batch's transactional success/failure contract
      // rather than Promise.all, which can conceal partial writes.
      if (beforeBatch) { const concurrent = beforeBatch; beforeBatch = null; concurrent(); }
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

function makeRequest(method: "GET" | "POST" | "DELETE", body?: unknown, role = "admin") {
  return new Request("https://qa.example.test/api/admin/cms/users", {
    method,
    headers: { "x-test-role": role, ...(body ? { "content-type": "application/json", origin: "https://qa.example.test" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function post(data: Record<string, unknown>, role = "admin") {
  return POST(makeRequest("POST", data, role));
}

function deactivate(id: string, role = "admin") {
  return DELETE(makeRequest("DELETE", { id }, role));
}

function roleCodes(id = "qa-user"): string[] {
  return sqlite.prepare(`SELECT r.code FROM admin_user_roles ur JOIN roles r ON r.id=ur.role_id
    WHERE ur.user_id=? ORDER BY r.code`).all(id).map(row => String(row.code));
}

function userState(id = "qa-user") {
  return sqlite.prepare("SELECT email,display_name,is_active,updated_at FROM admin_users WHERE id=?").get(id);
}

function counts() {
  const revisions = sqlite.prepare("SELECT COUNT(*) AS n FROM cms_revisions").get()?.n;
  const audits = sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n;
  return { revisions, audits };
}

beforeEach(() => {
  beforeBatch = null;
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("cloudflare/migrations/0001_core.sql", "utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0019_v17_full_cms.sql", "utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0020_v17_cms_roles.sql", "utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0021_v17_admin_role_normalization.sql", "utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0022_iaict_native_auth.sql", "utf8"));
  // The complete production migration chain seeds Newsroom roles in 0016.
  // This focused in-memory fixture imports only core and CMS schema migrations.
  sqlite.exec("INSERT OR IGNORE INTO roles(id,code,name) VALUES('role-news-editor','news_editor','Newsroom Editor')");
  sqlite.exec(`
    INSERT INTO admin_users(id,email,display_name,is_active,created_at,updated_at) VALUES
      ('qa-admin','qa-admin@example.test','Admin',1,'2026-10-29','2026-10-29'),
      ('qa-user','qa-user@example.test','Editor',1,'2026-10-29','2026-10-29');
    INSERT INTO admin_user_roles(user_id,role_id) VALUES
      ('qa-admin','role-admin'),('qa-user','role-editor');
  `);
  setDatabaseBinding(adapter(sqlite));
});
afterEach(() => {
  beforeBatch = null;
  delete (globalThis as { __IAICT_D1_DB__?: D1DatabaseLike }).__IAICT_D1_DB__;
  sqlite.close();
});

describe("CMS user management — D1 transactional integrity", () => {
  it("reads administrator and user roles normally", async () => {
    const response = await GET(makeRequest("GET"));
    expect(response.status).toBe(200);
    const result = await response.json() as { users: Array<{ id: string; roles: string[] }> };
    expect(result.users.find(item => item.id === "qa-user")?.roles).toEqual(["editor"]);
  });

  it("atomically updates account fields, role mapping, revision and audit", async () => {
    const result = await post({
      id: "qa-user", email: "qa-user@example.test", displayName: "Reviewer",
      isActive: true, roles: ["reviewer", "news_editor"],
    });
    expect(result.status).toBe(200);
    expect(userState()?.display_name).toBe("Reviewer");
    expect(roleCodes()).toEqual(["news_editor", "reviewer"]);
    expect(counts()).toEqual({ revisions: 1, audits: 1 });
    const snapshot = sqlite.prepare("SELECT snapshot_json FROM cms_revisions").get()?.snapshot_json;
    expect(JSON.parse(String(snapshot)).roles).toEqual(["editor"]);
  });

  it("rolls back metadata, revision and original roles if a replacement role INSERT fails", async () => {
    const before = userState();
    sqlite.exec(`CREATE TRIGGER reject_roles BEFORE INSERT ON admin_user_roles
      WHEN NEW.user_id='qa-user' BEGIN SELECT RAISE(ABORT,'injected role failure'); END;`);
    const result = await post({
      id: "qa-user", email: "qa-user@example.test", displayName: "Corrupted",
      isActive: false, roles: ["viewer"],
    });
    expect(result.status).toBe(500);
    expect(userState()).toEqual(before);
    expect(roleCodes()).toEqual(["editor"]);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });

  it("rolls back all updates and role replacements if audit insertion fails at the end", async () => {
    const before = userState();
    sqlite.exec(`CREATE TRIGGER reject_user_audit BEFORE INSERT ON audit_logs
      WHEN NEW.entity_type='users' BEGIN SELECT RAISE(ABORT,'injected audit failure'); END;`);
    const result = await post({
      id: "qa-user", email: "qa-user@example.test", displayName: "Corrupted",
      isActive: true, roles: ["reviewer"],
    });
    expect(result.status).toBe(500);
    expect(userState()).toEqual(before);
    expect(roleCodes()).toEqual(["editor"]);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });

  it("does not create an orphan user if inserting their first role fails", async () => {
    sqlite.exec(`CREATE TRIGGER reject_new_user_role BEFORE INSERT ON admin_user_roles
      WHEN NEW.user_id NOT IN ('qa-admin','qa-user') BEGIN SELECT RAISE(ABORT,'injected new user failure'); END;`);
    const response = await post({
      email: "new@example.test", displayName: "New User", isActive: true, roles: ["viewer"],
    });
    expect(response.status).toBe(500);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE email='new@example.test'").get()?.n).toBe(0);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });

  it("creates a valid user with roles and an audit entry in one transaction", async () => {
    const response = await post({
      email: "new@example.test", displayName: "New User", isActive: true, roles: ["viewer"],
    });
    expect(response.status).toBe(200);
    const data = await response.json() as { id: string };
    expect(roleCodes(data.id)).toEqual(["viewer"]);
    expect(counts()).toEqual({ revisions: 0, audits: 1 });
  });

  it("rolls back deactivation and revision if audit logging fails", async () => {
    const before = userState();
    sqlite.exec(`CREATE TRIGGER reject_deactivation_audit BEFORE INSERT ON audit_logs
      WHEN NEW.action='cms.user.deactivate' BEGIN SELECT RAISE(ABORT,'injected audit failure'); END;`);
    const response = await deactivate("qa-user");
    expect(response.status).toBe(500);
    expect(userState()).toEqual(before);
    expect(roleCodes()).toEqual(["editor"]);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });

  it("deactivates another user with a revision and audit on success", async () => {
    const response = await deactivate("qa-user");
    expect(response.status).toBe(200);
    expect(userState()?.is_active).toBe(0);
    expect(roleCodes()).toEqual(["editor"]);
    expect(counts()).toEqual({ revisions: 1, audits: 1 });
  });

  it("rejects last-admin removal before inserting any revision", async () => {
    sqlite.exec(`DELETE FROM admin_user_roles WHERE user_id='qa-admin';
      DELETE FROM admin_user_roles WHERE user_id='qa-user';
      INSERT INTO admin_user_roles(user_id,role_id) VALUES('qa-user','role-admin');`);
    const response = await post({
      id: "qa-user", email: "qa-user@example.test", displayName: "Viewer",
      isActive: true, roles: ["viewer"],
    });
    expect(response.status).toBe(400);
    expect(roleCodes()).toEqual(["admin"]);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });

  it("blocks stale concurrent admin demotion within the D1 batch", async () => {
    // Both accounts are admins when the outer pre-check is performed.
    sqlite.exec("DELETE FROM admin_user_roles WHERE user_id='qa-user'; INSERT INTO admin_user_roles(user_id,role_id) VALUES('qa-user','role-admin')");
    beforeBatch = () => {
      // Another administrator completed demotion before this batch began.
      sqlite.exec("DELETE FROM admin_user_roles WHERE user_id='qa-admin'; INSERT INTO admin_user_roles(user_id,role_id) VALUES('qa-admin','role-viewer')");
    };
    const result = await post({
      id: "qa-user", email: "qa-user@example.test", displayName: "Demotion blocked",
      isActive: true, roles: ["viewer"],
    });
    expect(result.status).toBe(400);
    expect((await result.json() as { code?: string }).code).toBe("LAST_ACTIVE_ADMIN");
    expect(roleCodes()).toEqual(["admin"]);
    expect(roleCodes("qa-admin")).toEqual(["viewer"]);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });

  it("blocks stale concurrent deactivation of the last admin", async () => {
    sqlite.exec("DELETE FROM admin_user_roles WHERE user_id='qa-user'; INSERT INTO admin_user_roles(user_id,role_id) VALUES('qa-user','role-admin')");
    beforeBatch = () => {
      sqlite.exec("DELETE FROM admin_user_roles WHERE user_id='qa-admin'; INSERT INTO admin_user_roles(user_id,role_id) VALUES('qa-admin','role-viewer')");
    };
    const result = await deactivate("qa-user");
    expect(result.status).toBe(400);
    expect((await result.json() as { code?: string }).code).toBe("LAST_ACTIVE_ADMIN");
    expect(userState()?.is_active).toBe(1);
    expect(roleCodes()).toEqual(["admin"]);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });

  it("allows admin demotion when another active admin remains at commit time", async () => {
    sqlite.exec("DELETE FROM admin_user_roles WHERE user_id='qa-user'; INSERT INTO admin_user_roles(user_id,role_id) VALUES('qa-user','role-admin')");
    const response = await post({
      id: "qa-user", email: "qa-user@example.test", displayName: "Viewer",
      isActive: true, roles: ["viewer"],
    });
    expect(response.status).toBe(200);
    expect(roleCodes()).toEqual(["viewer"]);
    expect(roleCodes("qa-admin")).toEqual(["admin"]);
    expect(counts()).toEqual({ revisions: 1, audits: 1 });
  });

  it("rejects viewer access without writes", async () => {
    const response = await post({
      id: "qa-user", email: "qa-user@example.test",
      displayName: "Not allowed", roles: ["viewer"],
    }, "viewer");
    expect(response.status).toBe(403);
    expect(roleCodes()).toEqual(["editor"]);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });

  it("rejects self-deactivation before any SQL update", async () => {
    expect((await deactivate("qa-admin")).status).toBe(400);
    expect(counts()).toEqual({ revisions: 0, audits: 0 });
  });
});


describe("CMS users — native session and CSRF safeguards", () => {
  function seedSession(token = "token-1", user = "qa-user") {
    sqlite.prepare("INSERT INTO iaict_auth_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)")
      .run(token, user, Date.now(), Date.now() + 3600000);
  }
  function countSessions(user = "qa-user") {
    return Number(sqlite.prepare("SELECT COUNT(*) AS n FROM iaict_auth_sessions WHERE user_id=?").get(user)?.n);
  }

  it("identifies which accounts have independently established native credentials without exposing hashes", async () => {
    const noCredentials = await GET(makeRequest("GET"));
    expect(noCredentials.status).toBe(200);
    expect((await noCredentials.json() as {users:Array<{hasNativePassword:boolean}>}).users.every(user => !user.hasNativePassword)).toBe(true);
    sqlite.prepare(
      "INSERT INTO iaict_password_credentials(user_id,salt,password_hash,iterations,updated_at) VALUES(?,?,?,?,?)",
    ).run("qa-user", "a".repeat(32), "b".repeat(64), 600000, "2026-10-30");
    const ready = await GET(makeRequest("GET"));
    const payload = await ready.json() as {users:Array<{id:string;hasNativePassword:boolean}>};
    expect(payload.users.find(user => user.id==="qa-user")?.hasNativePassword).toBe(true);
    expect(JSON.stringify(payload)).not.toContain("b".repeat(64));
    expect(ready.headers.get("cache-control")).toContain("no-store");
  });

  it("atomically revokes active sessions when a user's CMS role changes", async () => {
    seedSession();
    expect(countSessions()).toBe(1);
    const res = await post({id:"qa-user",email:"qa-user@example.test",displayName:"Editor",
      isActive:true,roles:["viewer"]});
    expect(res.status).toBe(200);
    expect(roleCodes()).toEqual(["viewer"]);
    expect(countSessions()).toBe(0);
  });

  it("keeps existing sessions when changing only the display name", async () => {
    seedSession();
    const res = await post({id:"qa-user",email:"qa-user@example.test",displayName:"Renamed",
      isActive:true,roles:["editor"]});
    expect(res.status).toBe(200);
    expect(countSessions()).toBe(1);
  });

  it("deactivation immediately invalidates all native sessions in the same transaction", async () => {
    seedSession();
    const res = await deactivate("qa-user");
    expect(res.status).toBe(200);
    expect(countSessions()).toBe(0);
    expect(userState()?.is_active).toBe(0);
  });

  it("rolls back both user and session state when audit fails after a role change", async () => {
    seedSession();
    sqlite.exec("CREATE TRIGGER reject_audit BEFORE INSERT ON audit_logs WHEN NEW.action='cms.user.update' BEGIN SELECT RAISE(ABORT,'refuse audit'); END;");
    const res = await post({id:"qa-user",email:"qa-user@example.test",displayName:"",isActive:false,roles:["viewer"]});
    expect(res.status).toBe(500);
    expect(countSessions()).toBe(1);
    expect(roleCodes()).toEqual(["editor"]);
    expect(userState()?.is_active).toBe(1);
  });

  it("administrator can revoke another user's sessions without changing their roles", async () => {
    seedSession();
    const res = await post({action:"revokeSessions",id:"qa-user"});
    expect(res.status).toBe(200);
    expect(countSessions()).toBe(0);
    expect(roleCodes()).toEqual(["editor"]);
    expect(sqlite.prepare("SELECT action FROM audit_logs").get()?.action).toBe("cms.user.sessions.revoke");
  });

  it("rejects cross-site or missing-Origin user mutations without DB changes", async () => {
    for(const origin of ["https://evil.invalid", "null", ""]) {
      const request = new Request("https://qa.example.test/api/admin/cms/users", {
        method:"POST",
        headers:{"content-type":"application/json",...(origin?{origin}:{})},
        body:JSON.stringify({id:"qa-user",email:"qa-user@example.test",roles:["viewer"]}),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      expect(roleCodes()).toEqual(["editor"]);
    }
  });

  it("forbids arbitrary actions, malformed payloads and oversized user fields", async () => {
    const action = await post({action:"makeAdministrator",id:"qa-user"});
    expect(action.status).toBe(400);
    const invalidName = await post({id:"qa-user",email:"qa-user@example.test",
      displayName:"x".repeat(161),roles:["editor"]});
    expect(invalidName.status).toBe(400);
    expect(counts()).toEqual({revisions:0,audits:0});
  });
});
