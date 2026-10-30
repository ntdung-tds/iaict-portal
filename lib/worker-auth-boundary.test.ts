import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import { clearAccessCertificateCache } from "./cloudflare-access-jwt";

// Exercise the real worker.fetch authentication boundary, not the mocked
// browser session endpoint. Only external Vinext routing / redirects are faked.
vi.mock("vinext/server/fetch-handler", () => ({
  default: { fetch: async (request: Request, env: { DB: D1DatabaseLike }) => {
    if (!new URL(request.url).pathname.startsWith("/api/admin")) {
      return Response.json({ public: true });
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
  } },
}));
vi.mock("./public-redirects", () => ({ resolvePublicRedirect: async () => null }));
vi.mock("./cms-public-cors", () => ({
  withPublicPreviewCors: (_request: Request, response: Response) => response,
}));

import worker from "../worker";

const issuer = "https://lucky-sun-c4ca.cloudflareaccess.com";
const aud = "a".repeat(64);
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "qa-worker-key-1", alg: "RS256", use: "sig" };
const b64 = (data: unknown) => Buffer.from(JSON.stringify(data)).toString("base64url");
const now = () => Math.floor(Date.now() / 1000);
function signedToken(changes: Record<string, unknown> = {}, headerChanges: Record<string, unknown> = {}) {
  const h = b64({ alg: "RS256", kid: jwk.kid, typ: "JWT", ...headerChanges });
  const p = b64({ iss: issuer, aud: [aud], email: "admin@example.test", iat: now() - 10, exp: now() + 600, ...changes });
  const input = `${h}.${p}`;
  return `${input}.${sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url")}`;
}

class IsolatedD1 implements D1DatabaseLike {
  queries = 0;
  role = "admin";
  active = true;
  prepare(_sql: string): D1PreparedStatementLike {
    this.queries += 1;
    let email: D1BindValue | undefined;
    const stmt: D1PreparedStatementLike = {
      bind(...values) { email = values[0]; return stmt; },
      async first<T>() {
        if (!db.active || email !== "admin@example.test") return null;
        return { id: "qa-actor", email: "admin@example.test",
          display_name: "QA Admin", role_codes: db.role } as T;
      },
      async all<T>() { return { results: [] as T[] }; },
      async run() { return { success: true, meta: { changes: 0 } }; },
    };
    const db = this;
    return stmt;
  }
  async batch() { return []; }
}

let db: IsolatedD1;
let jwksRequests = 0;
beforeEach(() => {
  clearAccessCertificateCache();
  db = new IsolatedD1();
  jwksRequests = 0;
  vi.stubGlobal("fetch", vi.fn(async (resource: RequestInfo | URL) => {
    jwksRequests += 1;
    if (String(resource) !== `${issuer}/cdn-cgi/access/certs`) {
      return new Response("unexpected certificate URL", { status: 404 });
    }
    return Response.json({ keys: [jwk] });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); });

const ctx = { waitUntil(_task: Promise<unknown>) {} };
function request(path: string, token?: string, headerEmail = "admin@example.test") {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Cf-Access-Jwt-Assertion"] = token;
    headers["Cf-Access-Authenticated-User-Email"] = headerEmail;
  }
  return new Request(`https://iaict-portal-staging.iaict-platform.workers.dev${path}`, { headers });
}
function invoke(path: string, token?: string, headerEmail?: string) {
  return worker.fetch(request(path, token, headerEmail), {
    DB: db, ACCESS_TEAM_DOMAIN: issuer, ACCESS_POLICY_AUD: aud,
  }, ctx);
}

describe("real Worker boundary + signed Access assertion + D1 roles", () => {
  it("accepts a genuine RSA-signed admin assertion and enforces active D1 role", async () => {
    const response = await invoke("/api/admin/cms/session", signedToken());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true, actor: { email: "admin@example.test", roles: ["admin"] },
    });
    expect(db.queries).toBe(1);
    expect(jwksRequests).toBe(1);
  });

  it("rejects valid Access identity without CMS admin rights", async () => {
    db.role = "viewer";
    const response = await invoke("/api/admin/cms/session", signedToken());
    expect(response.status).toBe(403);
    expect(db.queries).toBe(1); // Only after validating JWT signature.
  });

  it("rejects valid Access identity for an inactive CMS user", async () => {
    db.active = false;
    const response = await invoke("/api/admin/cms/session", signedToken());
    expect(response.status).toBe(403);
    expect(db.queries).toBe(1);
  });

  it.each([
    ["absent assertion", () => undefined, undefined],
    ["expired", () => signedToken({ exp: now() - 30 }), undefined],
    ["wrong AUD", () => signedToken({ aud: ["b".repeat(64)] }), undefined],
    ["wrong issuer", () => signedToken({ iss: "https://example.cloudflareaccess.com" }), undefined],
    ["forged Access email header", () => signedToken(), "other@example.test"],
    ["invalid signature", () => signedToken().replace(/.$/, "A"), undefined],
    ["unknown key ID", () => signedToken({}, { kid: "unknown" }), undefined],
  ])("blocks %s before any CMS database read", async (_case, token, email) => {
    const response = await invoke("/api/admin/cms/session", token(), email);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(db.queries).toBe(0);
  });

  it("blocks encoded admin paths before any D1 read", async () => {
    const response = await invoke("/api/%2561dmin/cms/session");
    expect(response.status).toBe(401);
    expect(db.queries).toBe(0);
  });

  it("does not require Access JWT on public routes", async () => {
    const response = await invoke("/tin-tuc");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ public: true });
    expect(jwksRequests).toBe(0);
  });

  it("fails closed on JWKS unavailability and does not read CMS data", async () => {
    clearAccessCertificateCache();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("offline", { status: 503 })));
    const response = await invoke("/api/admin/cms/session", signedToken());
    expect(response.status).toBe(401);
    expect(db.queries).toBe(0);
  });
});
