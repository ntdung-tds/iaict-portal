import { describe, expect, it } from "vitest";
import type { D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import {
  PBKDF2_ITERATIONS, NATIVE_COOKIE, NATIVE_VERIFIED_EMAIL_HEADER,
  clearSessionCookie, cookieForSession, createPasswordHash,
  nativeActorEmail, nativeAuthEnabled, normalizeLoginEmail, sameOriginPost,
  validPassword, verifyPasswordHash, authenticateNativePassword, setNativePassword,
} from "./native-auth";

describe("IAICT native authentication: cryptography and boundary guards", () => {
  it("creates salted PBKDF2-SHA256 credentials; never stores plaintext", async () => {
    const password = "A-Strong-Staging-Password-2026";
    const first = await createPasswordHash(password);
    const second = await createPasswordHash(password);
    expect(first.iterations).toBe(PBKDF2_ITERATIONS);
    expect(first.salt).toHaveLength(32);
    expect(first.hash).toHaveLength(64);
    expect(second.salt).not.toBe(first.salt);
    expect(second.hash).not.toBe(first.hash);
    expect(first.hash).not.toContain(password);
    expect(await verifyPasswordHash(password, {salt:first.salt,password_hash:first.hash,iterations:first.iterations})).toBe(true);
    expect(await verifyPasswordHash(password + "wrong", {salt:first.salt,password_hash:first.hash,iterations:first.iterations})).toBe(false);
  });
  it("refuses weak passwords and normalizes emails", async () => {
    for (const password of ["", "short", "a".repeat(129), "a".repeat(7)]) {
      expect(validPassword(password)).toBe(false);
      await expect(createPasswordHash(password)).rejects.toThrow("INVALID_PASSWORD_LENGTH");
    }
    expect(validPassword("Ab3!xY8?")).toBe(true);
    const shortAllowed = await createPasswordHash("Ab3!xY8?");
    expect(await verifyPasswordHash("Ab3!xY8?", {salt: shortAllowed.salt, password_hash: shortAllowed.hash, iterations: shortAllowed.iterations})).toBe(true);
    expect(validPassword("a".repeat(128))).toBe(true);
    expect(normalizeLoginEmail(" QATest@Example.COM ")).toBe("qatest@example.com");
    expect(normalizeLoginEmail("invalid")).toBeNull();
  });
  it("uses Secure HttpOnly Lax host-prefix cookie and a matching clearing cookie", () => {
    const token = "a".repeat(64);
    const cookie = cookieForSession(token);
    expect(cookie).toContain(NATIVE_COOKIE + "=" + token);
    for (const attr of ["Path=/", "HttpOnly", "Secure", "SameSite=Lax"]) {
      expect(cookie).toContain(attr);
      expect(clearSessionCookie).toContain(attr);
    }
    expect(clearSessionCookie).toContain("Max-Age=0");
  });
  it("requires exact same-origin state-changing requests", () => {
    const url = "https://iaict-portal-staging.iaict-platform.workers.dev/api/auth/login";
    expect(sameOriginPost(new Request(url, {headers:{Origin:"https://iaict-portal-staging.iaict-platform.workers.dev"}}))).toBe(true);
    const invalidHeaders: HeadersInit[] = [{}, {Origin:"https://evil.example"}, {Origin:"null"}];
    for (const headers of invalidHeaders) {
      expect(sameOriginPost(new Request(url,{headers}))).toBe(false);
    }
    expect(nativeAuthEnabled("true")).toBe(true);
    expect(nativeAuthEnabled("false")).toBe(false);
    expect(nativeAuthEnabled(undefined)).toBe(false);
  });
  it("looks up only hashed opaque sessions, never trusts a client-provided identity header", async () => {
    let sql = "", bindValues: unknown[] = [];
    const stmt: D1PreparedStatementLike = {
      bind(...params) { bindValues=params; return stmt; },
      async first<T>() { return {email:"qa@example.invalid"} as T; },
      async all<T>() {return {results:[] as T[]};},
      async run() {throw new Error("READ_ONLY_TEST");},
    };
    const db: D1DatabaseLike = {
      prepare(query) {sql=query;return stmt;},
      async batch() {throw new Error("READ_ONLY_TEST");},
    };
    const request = new Request("https://iaict-portal-staging.iaict-platform.workers.dev/admin",{
      headers:{Cookie:NATIVE_COOKIE+"="+"b".repeat(64),[NATIVE_VERIFIED_EMAIL_HEADER]:"forged@invalid.test"},
    });
    expect(await nativeActorEmail(request,db)).toBe("qa@example.invalid");
    expect(sql).toContain("u.is_active=1");
    expect(sql).toContain("s.revoked_at IS NULL");
    expect(sql).toContain("s.expires_at>?");
    expect(bindValues[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(bindValues[0]).not.toBe("b".repeat(64));
    expect(await nativeActorEmail(new Request(request.url,{headers:{[NATIVE_VERIFIED_EMAIL_HEADER]:"attacker@example.com"}}),db)).toBeNull();
  });
});

describe("D1 compare-and-swap race protection for native credentials", () => {
  it("rejects stale concurrent password rotation without unconditionally revoking sessions", async () => {
    const oldPassword = "Known-Old-Pass-2026";
    const old = await createPasswordHash(oldPassword);
    const prepared: Array<{ sql: string; values: unknown[] }> = [];
    const db: D1DatabaseLike = {
      prepare(sql) {
        const item = { sql, values: [] as unknown[] };
        prepared.push(item);
        const statement: D1PreparedStatementLike = {
          bind(...values) { item.values = values; return statement; },
          async first<T>() {
            if (sql.startsWith("SELECT salt,password_hash,iterations FROM iaict_password_credentials_v2")) {
              return { salt: old.salt, password_hash: old.hash, iterations: old.iterations } as T;
            }
            throw new Error("Unexpected query: " + sql);
          },
          async all<T>() { return { results: [] as T[] }; },
          async run() { throw new Error("Only atomic batch writes allowed"); },
        };
        return statement;
      },
      async batch(statements) {
        expect(statements).toHaveLength(3);
        const queries = prepared.slice(-3).map(value => value.sql);
        expect(queries[0]).toContain("WHERE user_id=? AND salt=? AND password_hash=?");
        expect(queries[0]).toContain("is_active=1");
        expect(queries[1]).toContain("AND EXISTS");
        expect(queries[2]).toContain("WHERE EXISTS");
        // Simulate a newer credential winning the race before this D1 batch.
        return [{meta:{changes:0}},{meta:{changes:0}},{meta:{changes:0}}];
      },
    };
    await expect(setNativePassword(db,
      {id:"test-user",email:"test@example.test"}, "New-Pass-2026", oldPassword,
    )).rejects.toThrow("PASSWORD_CHANGE_CONFLICT");
  });

  it("does not mint a live session when password rotated during hash verification", async () => {
    const original = await createPasswordHash("Old-Pass-2026");
    const statements: string[] = [];
    const db: D1DatabaseLike = {
      prepare(sql) {
        statements.push(sql);
        const stmt: D1PreparedStatementLike = {
          bind() { return stmt; },
          async first<T>() {
            if (sql.startsWith("SELECT blocked_until")) return null;
            if (sql.includes("JOIN iaict_password_credentials_v2")) {
              return { id:"user-id",salt:original.salt,
                password_hash:original.hash,iterations:original.iterations } as T;
            }
            throw new Error("Unexpected query: " + sql);
          },
          async all<T>() {return {results:[] as T[]};},
          async run() {throw new Error("Batch expected");},
        };
        return stmt;
      },
      async batch() {
        // Login attempt cleanup succeeds; stale credential-guarded insert makes
        // no rows, so the returned token must NOT be treated as an active session.
        return [{meta:{changes:1}},{meta:{changes:0}}];
      },
    };
    expect(await authenticateNativePassword(db,"test@example.test","Old-Pass-2026")).toBeNull();
    const guardedInsert = statements.find(q=>q.includes("INSERT INTO iaict_auth_sessions"));
    expect(guardedInsert).toContain("c.password_hash=?");
    expect(guardedInsert).toContain("c.salt=?");
    expect(guardedInsert).toContain("admin_user_roles");
  });
});
