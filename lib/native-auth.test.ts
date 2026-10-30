import { describe, expect, it } from "vitest";
import type { D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import {
  PBKDF2_ITERATIONS, NATIVE_COOKIE, NATIVE_VERIFIED_EMAIL_HEADER,
  clearSessionCookie, cookieForSession, createPasswordHash,
  nativeActorEmail, nativeAuthEnabled, normalizeLoginEmail, sameOriginPost,
  validPassword, verifyPasswordHash,
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
    for (const password of ["", "short", "a".repeat(129), "a".repeat(13)]) {
      expect(validPassword(password)).toBe(false);
      await expect(createPasswordHash(password)).rejects.toThrow("INVALID_PASSWORD_LENGTH");
    }
    expect(validPassword("ThisIsFourteen!")).toBe(true);
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
    for (const headers of [{}, {Origin:"https://evil.example"}, {Origin:"null"}]) {
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
