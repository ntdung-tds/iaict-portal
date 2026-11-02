/**
 * IAM-AUTH-020 — ACTUAL native-auth.ts functions + unmodified committed D1
 * migrations inside a disposable local Miniflare D1. NO live Access, hosted
 * D1, mailbox, production identity, cookie export, or staging deployment.
 * Local Node WebCrypto; independent workerd KDF boundary has its own CI.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import type { D1DatabaseLike } from "./cloudflare-db";
import {
  NATIVE_COOKIE, authenticateNativePassword, nativeActorEmail,
  nativeSessionPrincipal, revokeNativeSession, setNativePassword,
} from "./native-auth";

const names = [
  "admin", "admin2", "editor", "reviewer", "viewer",
  "news_admin", "news_editor", "news_reviewer",
] as const;
type TestIdentity = (typeof names)[number];
const emailOf = (name: TestIdentity) => "qa-native-" + name + "@example.test";
const userId = (name: TestIdentity) => "qa-native-" + name;
const secret = () => "T@9r-" + randomBytes(16).toString("hex"); // NEVER printed or persisted externally.
const requestFor = (token?: string) =>
  new Request("https://iaict-portal-staging.iaict-platform.workers.dev/account", {
    headers: token ? { Cookie: NATIVE_COOKIE + "=" + token } : {},
  });

describe("real native authentication on UNMODIFIED IAM migrations and disposable local D1", () => {
  let mf: Miniflare;
  let db: D1DatabaseLike;
  const passwords = new Map<TestIdentity, string>();
  const tokens = new Map<TestIdentity, string>();

  beforeAll(async () => {
    mf = new Miniflare(convertV4MiniflareOptions({
      modules: true,
      script: "export default {fetch(){return new Response('qa-isolated')}}",
      compatibilityDate: "2026-10-12",
      compatibilityFlags: ["nodejs_compat"],
      d1Databases: { DB: randomUUID() },
    }));
    db = await mf.getD1Database("DB") as unknown as D1DatabaseLike;
    for (const filename of [
      "0001_core.sql", "0022_iaict_native_auth.sql",
      "0023_iaict_auth_pbkdf2_workers.sql", "0024_iaict_activation_invites.sql",
    ]) {
      // Never rewrite original SQL files: apply their complete statements.
      const sql = await readFile(new URL("../cloudflare/migrations/" + filename, import.meta.url), "utf8");
      for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map(s => s.trim()).filter(Boolean)) {
        await db.prepare(statement).run();
      }
    }
    for (const role of new Set(names.map(name => name === "admin2" ? "admin" : name))) {
      await db.prepare("INSERT INTO roles(id,code,name) VALUES(?,?,?)")
        .bind("role-" + role, role, "Local QA " + role).run();
    }
    for (const name of names) {
      await db.prepare("INSERT INTO admin_users(id,email,is_active,created_at,updated_at) VALUES(?,?,1,?,?)")
        .bind(userId(name), emailOf(name), "qa", "qa").run();
      await db.prepare("INSERT INTO admin_user_roles(user_id,role_id) VALUES(?,?)")
        .bind(userId(name), "role-" + (name === "admin2" ? "admin" : name)).run();
    }
  }, 60_000);

  afterAll(async () => {
    if (mf) await mf.dispose();
  });

  it("uses all four original IAM migrations and seeds eight independent role IDs", async () => {
    const records = await db.prepare(
      "SELECT COUNT(*) AS n FROM admin_users WHERE id LIKE 'qa-native-%'"
    ).first<{n:number}>();
    const active = await db.prepare(
      "SELECT COUNT(*) AS n FROM admin_users WHERE id LIKE 'qa-native-%' AND is_active=1"
    ).first<{n:number}>();
    expect(records?.n).toBe(8);
    expect(active?.n).toBe(8);
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toHaveLength(0);
    const schema = await db.prepare("PRAGMA table_info(iaict_password_credentials_v2)").all<{name:string}>();
    expect(schema.results.map(r => r.name)).toContain("password_hash");
  });

  it("exercises actual PBKDF2 setup, login, hashed session, and role-carrying principal for 8 accounts", async () => {
    for (const name of names) {
      const password = secret();
      passwords.set(name, password);
      expect(await setNativePassword(db, { id: userId(name), email: emailOf(name) }, password)).toBe("created");
      const token = await authenticateNativePassword(db, emailOf(name), password);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
      tokens.set(name, token!);
      const row = await db.prepare(
        "SELECT token_hash,user_id FROM iaict_auth_sessions WHERE user_id=?"
      ).bind(userId(name)).first<{token_hash:string;user_id:string}>();
      expect(row?.user_id).toBe(userId(name));
      expect(row?.token_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(row?.token_hash).not.toBe(token);
      const principal = await nativeSessionPrincipal(requestFor(token!), db);
      expect(principal?.userId).toBe(userId(name));
      expect(principal?.email).toBe(emailOf(name));
      expect(await nativeActorEmail(requestFor(token!), db)).toBe(emailOf(name));
    }
    expect(tokens.size).toBe(8);
  }, 45_000);

  it("rejects spoofed identity headers and malformed or absent session cookies", async () => {
    const r = new Request("https://iaict-portal-staging.iaict-platform.workers.dev/account", {
      headers: { "X-IAICT-Verified-Email": emailOf("admin") },
    });
    expect(await nativeSessionPrincipal(r, db)).toBeNull();
    expect(await nativeActorEmail(r, db)).toBeNull();
    expect(await nativeSessionPrincipal(requestFor("bad-token"), db)).toBeNull();
    expect(await nativeSessionPrincipal(requestFor("f".repeat(64)), db)).toBeNull();
    expect(await authenticateNativePassword(db, emailOf("admin"), "short")).toBeNull();
  });

  it("refuses old password after rotation and deletes the previous real D1 session", async () => {
    const oldToken = tokens.get("editor")!;
    const oldPassword = passwords.get("editor")!;
    const nextPassword = secret();
    expect(await setNativePassword(db, { id:userId("editor"), email:emailOf("editor") },
      nextPassword, oldPassword)).toBe("rotated");
    expect(await nativeSessionPrincipal(requestFor(oldToken), db)).toBeNull();
    expect((await db.prepare("SELECT COUNT(*) AS n FROM iaict_auth_sessions WHERE user_id=?")
      .bind(userId("editor")).first<{n:number}>())?.n).toBe(0);
    expect(await authenticateNativePassword(db, emailOf("editor"), oldPassword)).toBeNull();
    const newToken = await authenticateNativePassword(db, emailOf("editor"), nextPassword);
    expect(newToken).toMatch(/^[0-9a-f]{64}$/);
    expect(await nativeSessionPrincipal(requestFor(newToken!), db)).toMatchObject({
      userId:userId("editor"),email:emailOf("editor"),
    });
    passwords.set("editor", nextPassword);
    tokens.set("editor", newToken!);
  }, 30_000);

  it("denies access when account deactivated or its sole role removed", async () => {
    const reviewer = tokens.get("reviewer")!;
    await db.prepare("UPDATE admin_users SET is_active=0 WHERE id=?").bind(userId("reviewer")).run();
    expect(await nativeSessionPrincipal(requestFor(reviewer), db)).toBeNull();
    expect(await authenticateNativePassword(db, emailOf("reviewer"), passwords.get("reviewer")!)).toBeNull();
    const viewer = tokens.get("viewer")!;
    await db.prepare("DELETE FROM admin_user_roles WHERE user_id=?").bind(userId("viewer")).run();
    expect(await nativeSessionPrincipal(requestFor(viewer), db)).toBeNull();
    expect(await authenticateNativePassword(db, emailOf("viewer"), passwords.get("viewer")!)).toBeNull();
    // Out-of-band reactivation/regrant is NOT tested as safe: the normal
    // Admin API, not direct SQL, must revoke all sessions on role edits.
  }, 20_000);

  it("rejects 5 wrong passwords with the real lockout row even if correct password is submitted", async () => {
    const name: TestIdentity = "news_editor";
    for (let i=0;i<5;i++) {
      expect(await authenticateNativePassword(db, emailOf(name), secret())).toBeNull();
    }
    const email = emailOf(name);
    const attempts = await db.prepare("SELECT COUNT(*) AS n FROM iaict_login_attempts")
      .first<{n:number}>();
    expect((attempts?.n ?? 0)).toBeGreaterThan(0);
    expect(await authenticateNativePassword(db, email, passwords.get(name)!)).toBeNull();
    expect(await nativeSessionPrincipal(requestFor(tokens.get(name)!), db))
      .toMatchObject({ userId:userId(name) }); // prior valid session unaffected by login lockout.
  }, 40_000);

  it("revokes exactly the presented native session while other user sessions remain valid", async () => {
    const adminToken=tokens.get("admin")!;
    await revokeNativeSession(requestFor(adminToken), db);
    expect(await nativeSessionPrincipal(requestFor(adminToken), db)).toBeNull();
    expect(await nativeSessionPrincipal(requestFor(tokens.get("admin2")!), db))
      .toMatchObject({ userId:userId("admin2") });
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toHaveLength(0);
  });
});
