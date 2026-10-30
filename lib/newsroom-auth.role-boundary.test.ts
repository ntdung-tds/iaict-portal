/**
 * In-memory role-boundary tests. No Access cookies, JWTs, D1 writes, PII or QA
 * screenshots. The Worker verifies RS256 before calling requireNewsroomActor:
 * see cloudflare-access-jwt.test.ts. This suite does NOT replace real login QA.
 */
import { describe, expect, it } from "vitest";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike, D1RunResult } from "./cloudflare-db";
import {
  CMS_ADMIN_ROLES, CMS_EDIT_ROLES, CMS_READ_ROLES,
  NEWSROOM_ADMIN_ROLES, NEWSROOM_EDIT_ROLES,
  NEWSROOM_READ_ROLES, NEWSROOM_REVIEW_ROLES,
  type CmsRoleCode,
} from "./cms-roles";
import { requireNewsroomActor } from "./newsroom-auth";

type ActorRow = { id: string; email: string; display_name: string | null; role_codes: string | null };

class FakeStatement implements D1PreparedStatementLike {
  constructor(private readonly row: ActorRow | null, readonly bound: D1BindValue[]) {}
  bind(...values: D1BindValue[]): D1PreparedStatementLike {
    this.bound.push(...values);
    return this;
  }
  async first<T = Record<string, unknown>>(): Promise<T | null> { return this.row as T | null; }
  async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }> {
    return { results: [], success: true };
  }
  async run(): Promise<D1RunResult> { return { success: true }; }
}
class FakeDb implements D1DatabaseLike {
  readonly queries: string[] = [];
  readonly bound: D1BindValue[] = [];
  constructor(private readonly row: ActorRow | null) {}
  prepare(query: string): D1PreparedStatementLike {
    this.queries.push(query);
    return new FakeStatement(this.row, this.bound);
  }
  async batch(): Promise<D1RunResult[]> { return []; }
}
const makeRow = (roleCodes: string | null): ActorRow => ({
  id: "qa-user", email: "qa-role@example.invalid",
  display_name: "QA Fixture", role_codes: roleCodes,
});
const makeRequest = (opts?: { email?: string | null; assertion?: string | null }) => {
  const headers = new Headers();
  const email = opts?.email === undefined ? "qa-role@example.invalid" : opts.email;
  const assertion = opts?.assertion === undefined ? "worker-verified-fixture" : opts.assertion;
  if (email !== null) headers.set("Cf-Access-Authenticated-User-Email", email);
  if (assertion !== null) headers.set("Cf-Access-Jwt-Assertion", assertion);
  return new Request("https://iaict-portal-staging.iaict-platform.workers.dev/api/admin/cms/session", { headers });
};
const gates: ReadonlyArray<{ name: string; allowed: readonly CmsRoleCode[]; expected: readonly CmsRoleCode[] }> = [
  { name: "CMS read", allowed: CMS_READ_ROLES, expected: ["admin", "editor", "reviewer", "viewer"] },
  { name: "CMS edit", allowed: CMS_EDIT_ROLES, expected: ["admin", "editor"] },
  { name: "CMS administration and confidential CRM leads", allowed: CMS_ADMIN_ROLES, expected: ["admin"] },
  { name: "Newsroom read", allowed: NEWSROOM_READ_ROLES,
    expected: ["admin", "editor", "reviewer", "viewer", "news_admin", "news_editor", "news_reviewer"] },
  { name: "Newsroom edit", allowed: NEWSROOM_EDIT_ROLES,
    expected: ["admin", "editor", "news_admin", "news_editor"] },
  { name: "Newsroom review", allowed: NEWSROOM_REVIEW_ROLES,
    expected: ["admin", "reviewer", "news_admin", "news_reviewer"] },
  { name: "Newsroom settings", allowed: NEWSROOM_ADMIN_ROLES, expected: ["admin", "news_admin"] },
];
const roles: readonly CmsRoleCode[] = [
  "admin", "editor", "reviewer", "viewer", "news_admin", "news_editor", "news_reviewer",
];

describe("staging v17 CMS/CRM role matrix (in-memory only)", () => {
  for (const role of roles) {
    it("enforces all seven permission gates for " + role, async () => {
      for (const gate of gates) {
        const db = new FakeDb(makeRow(role));
        const access = requireNewsroomActor(makeRequest(), db, gate.allowed);
        if (gate.expected.includes(role)) {
          const actor = await access;
          expect(actor.id, gate.name).toBe("qa-user");
          expect(actor.roles, gate.name).toEqual([role]);
        } else {
          await expect(access, gate.name).rejects.toMatchObject({ status: 403 });
        }
        expect(db.queries).toHaveLength(1);
        expect(db.queries[0]).toContain("u.is_active = 1");
        expect(db.queries[0]).toContain("lower(u.email) = lower(?)");
        expect(db.bound).toEqual(["qa-role@example.invalid"]);
      }
    });
  }

  it("rejects a missing assertion before any D1 query", async () => {
    const db = new FakeDb(makeRow("admin"));
    await expect(requireNewsroomActor(makeRequest({ assertion: null }), db, CMS_ADMIN_ROLES))
      .rejects.toMatchObject({ status: 401 });
    expect(db.queries).toHaveLength(0);
  });

  it("rejects missing/blank Access identity before D1 lookup", async () => {
    for (const email of [null, "   "]) {
      const db = new FakeDb(makeRow("admin"));
      await expect(requireNewsroomActor(makeRequest({ email }), db, CMS_ADMIN_ROLES))
        .rejects.toMatchObject({ status: 401 });
      expect(db.queries).toHaveLength(0);
    }
  });

  it("does not distinguish inactive and unknown users", async () => {
    const db = new FakeDb(null); // D1 returns null for either account state
    await expect(requireNewsroomActor(makeRequest(), db, CMS_READ_ROLES))
      .rejects.toMatchObject({ status: 403 });
  });

  it("rejects active users without a recognized CMS role", async () => {
    for (const roleCodes of [null, "", "nonexistent_role", "administrator", "super_admin"]) {
      await expect(requireNewsroomActor(makeRequest(), new FakeDb(makeRow(roleCodes)), NEWSROOM_READ_ROLES))
        .rejects.toMatchObject({ status: 403 });
    }
  });

  it("never promotes newsroom-only roles into global CMS or CRM access", async () => {
    for (const role of ["news_admin", "news_editor", "news_reviewer"] as const) {
      for (const allowed of [CMS_READ_ROLES, CMS_ADMIN_ROLES]) {
        await expect(requireNewsroomActor(makeRequest(), new FakeDb(makeRow(role)), allowed))
          .rejects.toMatchObject({ status: 403 });
      }
    }
  });

  it("honors combined editor/reviewer assignment without admin escalation", async () => {
    const roleCodes = "editor,news_reviewer";
    for (const allowed of [CMS_READ_ROLES, CMS_EDIT_ROLES, NEWSROOM_REVIEW_ROLES]) {
      const actor = await requireNewsroomActor(makeRequest(), new FakeDb(makeRow(roleCodes)), allowed);
      expect(actor.roles).toEqual(["editor", "news_reviewer"]);
    }
    await expect(requireNewsroomActor(makeRequest(), new FakeDb(makeRow(roleCodes)), CMS_ADMIN_ROLES))
      .rejects.toMatchObject({ status: 403 });
  });

  it("uses SQL bound parameters rather than interpolating untrusted email", async () => {
    const injection = "' OR 1=1 --@example.invalid";
    const db = new FakeDb(null);
    await expect(requireNewsroomActor(makeRequest({ email: injection }), db, CMS_READ_ROLES))
      .rejects.toMatchObject({ status: 403 });
    expect(db.queries[0]).not.toContain(injection);
    expect(db.bound).toEqual([injection]);
  });
});
