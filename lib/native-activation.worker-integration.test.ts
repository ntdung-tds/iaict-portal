import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike, D1RunResult } from "./cloudflare-db";
import { setNativePassword } from "./native-auth";

// Route through the ACTUAL Worker ingress before handing off to real route
// handlers. No mocked identity actor; all roles/sessions are read from real
// local SQLite with the production D1 schema. No network or staging writes.
vi.mock("vinext/server/fetch-handler", () => ({
  default: {
    fetch: async (request: Request) => {
      const path = new URL(request.url).pathname;
      if (path === "/api/auth/login") {
        const route = await import("../app/api/auth/login/route");
        return request.method === "POST" ? route.POST(request) : route.GET();
      }
      if (path === "/api/auth/activate") {
        const route = await import("../app/api/auth/activate/route");
        return request.method === "POST" ? route.POST(request) : route.GET();
      }
      if (path === "/api/auth/session") {
        const route = await import("../app/api/auth/session/route");
        return request.method === "GET" ? route.GET(request) : route.POST();
      }
      if (path === "/api/admin/cms/activation") {
        const route = await import("../app/api/admin/cms/activation/route");
        return request.method === "POST" ? route.POST(request) : route.GET();
      }
      if (path === "/api/admin/cms/users") {
        const route = await import("../app/api/admin/cms/users/route");
        return request.method === "GET" ? route.GET(request) : Response.json({error:"Unsupported"}, {status:405});
      }
      throw new Error("Unexpected integration test path: " + path);
    },
  },
}));
vi.mock("./public-redirects", () => ({ resolvePublicRedirect: async () => null }));
vi.mock("./cms-public-cors", () => ({
  withPublicPreviewCors: (_request: Request, response: Response) => response,
}));

import worker from "../worker";

function d1(database: DatabaseSync): D1DatabaseLike {
  return {
    prepare(sql) {
      let args: D1BindValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...values) { args = values; return statement; },
        async first<T>() { return (database.prepare(sql).get(...args as never[]) ?? null) as T | null; },
        async all<T>() { return { results: database.prepare(sql).all(...args as never[]) as T[] }; },
        async run(): Promise<D1RunResult> {
          const result = database.prepare(sql).run(...args as never[]);
          return {success:true,meta:{changes:result.changes}};
        },
      };
      return statement;
    },
    async batch(statements) {
      database.exec("BEGIN");
      try {
        const results: D1RunResult[]=[];
        for (const statement of statements) results.push(await statement.run());
        database.exec("COMMIT");
        return results;
      } catch(error) { database.exec("ROLLBACK"); throw error; }
    },
  };
}

const ROOT="https://iaict-portal-staging.iaict-platform.workers.dev";
const ADMIN_PASS="LocalQaAdmin-2026";
const VIEWER_PASS="LocalQaViewer-2026";
const ctx={waitUntil(_promise:Promise<unknown>) {}};
let sqlite:DatabaseSync;
let db:D1DatabaseLike;

const send=async(
  path:string,
  opts:{method?:string;cookie?:string;body?:Record<string,unknown>;origin?:string;headers?:Record<string,string>;native?:boolean}={},
) => worker.fetch(new Request(ROOT+path,{
  method:opts.method??"GET",
  headers:{
    ...(opts.cookie?{Cookie:opts.cookie}:{}),
    ...(opts.body?{"Content-Type":"application/json",Origin:opts.origin??ROOT}:{}),
    ...opts.headers,
  },
  ...(opts.body?{body:JSON.stringify(opts.body)}:{}),
}),{
  DB:db,IAICT_NATIVE_AUTH_ENABLED:opts.native===false?"false":"true",
  ACCESS_TEAM_DOMAIN:"https://lucky-sun-c4ca.cloudflareaccess.com",
  ACCESS_POLICY_AUD:"a".repeat(64),
},ctx);

beforeEach(async()=>{
  sqlite=new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("cloudflare/migrations/0001_core.sql","utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0023_iaict_auth_pbkdf2_workers.sql","utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0024_iaict_activation_invites.sql","utf8"));
  sqlite.exec("INSERT INTO admin_users(id,email,display_name,is_active,created_at,updated_at) VALUES" +
    "('qa-admin','admin@example.test','QA Admin',1,'now','now')," +
    "('qa-viewer','viewer@example.test','QA Viewer',1,'now','now')," +
    "('qa-disabled','disabled@example.test','QA Disabled',0,'now','now')");
  sqlite.exec("INSERT INTO roles(id,code,name) VALUES('role-admin','admin','Admin'),('role-viewer','viewer','Viewer')");
  sqlite.exec("INSERT INTO admin_user_roles(user_id,role_id) VALUES" +
    "('qa-admin','role-admin'),('qa-viewer','role-viewer'),('qa-disabled','role-viewer')");
  db=d1(sqlite);
  await setNativePassword(db,{id:"qa-admin",email:"admin@example.test"},ADMIN_PASS);
});
afterEach(()=>{
  delete (globalThis as typeof globalThis & {__IAICT_NATIVE_AUTH_ENABLED__?:boolean}).__IAICT_NATIVE_AUTH_ENABLED__;
  sqlite.close();
});

async function login(email:string,password:string){
  const response=await send("/api/auth/login",{method:"POST",body:{email,password}});
  expect(response.status).toBe(200);
  const setCookie=response.headers.get("Set-Cookie");
  expect(setCookie).toContain("HttpOnly");
  return String(setCookie).split(";")[0];
}

describe("real Worker -> D1 -> role -> invitation -> first login integration",()=>{
  it("denies anonymous and forged privileged identity before issuing invitations",async()=>{
    const forged=await send("/api/admin/cms/activation",{
      method:"POST",body:{id:"qa-viewer"},
      headers:{"X-IAICT-Verified-Email":"admin@example.test",
        "Cf-Access-Authenticated-User-Email":"admin@example.test",
        "Cf-Access-Jwt-Assertion":"not-a-signed-jwt"},
    });
    expect(forged.status).toBe(401);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM iaict_activation_invites").get()).toMatchObject({n:0});
  });

  it("tests admin issuance, one-use first password, viewer RBAC and disabled identity",async()=>{
    const adminCookie=await login("admin@example.test",ADMIN_PASS);
    const creation=await send("/api/admin/cms/activation",{
      method:"POST",cookie:adminCookie,body:{id:"qa-viewer"},
    });
    expect(creation.status).toBe(200);
    const result=await creation.json() as {ok:boolean;activationUrl:string;expiresAt:number};
    expect(result.ok).toBe(true);
    expect(result.activationUrl).toMatch(/\/activate#token=[a-f0-9]{64}$/);
    const secret=result.activationUrl.split("token=")[1];
    const invite=sqlite.prepare("SELECT token_hash,consumed_at FROM iaict_activation_invites").get() as
      {token_hash:string;consumed_at:number|null};
    expect(invite.token_hash).not.toBe(secret);
    expect(invite.consumed_at).toBeNull();

    const redeem=await send("/api/auth/activate",{
      method:"POST",body:{token:secret,password:VIEWER_PASS},
    });
    expect(redeem.status).toBe(200);
    expect(redeem.headers.get("Set-Cookie")).toBeNull();
    const replay=await send("/api/auth/activate",{
      method:"POST",body:{token:secret,password:"AnotherLocalPass-2026"},
    });
    expect(replay.status).toBe(410);

    const viewerCookie=await login("viewer@example.test",VIEWER_PASS);
    const ownSession=await send("/api/auth/session",{cookie:viewerCookie});
    expect(ownSession.status).toBe(200);
    expect(await ownSession.json()).toMatchObject({actor:{email:"viewer@example.test",roles:["viewer"]}});
    const viewerCannotInvite=await send("/api/admin/cms/activation",{
      method:"POST",cookie:viewerCookie,body:{id:"qa-disabled"},
    });
    expect(viewerCannotInvite.status).toBe(403);
    const viewerCannotList=await send("/api/admin/cms/users",{cookie:viewerCookie});
    expect(viewerCannotList.status).toBe(403);
    const adminCanList=await send("/api/admin/cms/users",{cookie:adminCookie});
    expect(adminCanList.status).toBe(200);

    sqlite.exec("UPDATE admin_users SET is_active=0 WHERE id='qa-viewer'");
    expect((await send("/api/auth/session",{cookie:viewerCookie})).status).toBe(401);
    expect((await send("/api/admin/cms/activation",{
      method:"POST",cookie:viewerCookie,body:{id:"qa-disabled"},
    })).status).toBe(401);
  });

  it("rejects cross-site requests even with an authenticated admin cookie",async()=>{
    const adminCookie=await login("admin@example.test",ADMIN_PASS);
    const response=await send("/api/admin/cms/activation",{
      method:"POST",cookie:adminCookie,origin:"https://unauthorized.invalid",body:{id:"qa-viewer"},
    });
    expect(response.status).toBe(403);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM iaict_activation_invites").get()).toMatchObject({n:0});
  });
});
