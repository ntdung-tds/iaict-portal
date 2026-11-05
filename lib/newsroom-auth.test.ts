import { describe, expect, it } from "vitest";
import type {
  D1BindValue,
  D1DatabaseLike,
  D1PreparedStatementLike,
  D1RunResult,
} from "./cloudflare-db";
import { NewsroomAuthError, requireNewsroomActor } from "./newsroom-auth";
import {
  CMS_ADMIN_ROLES, CMS_EDIT_ROLES, CMS_READ_ROLES,
  NEWSROOM_EDIT_ROLES, NEWSROOM_READ_ROLES, NEWSROOM_REVIEW_ROLES,
  type CmsRoleCode,
} from "./cms-roles";

class FakeStatement implements D1PreparedStatementLike {
  constructor(private readonly row: unknown) {}
  bind(..._values: D1BindValue[]) { return this; }
  async first<T>() { return this.row as T | null; }
  async all<T>() { return { results: [] as T[], success: true }; }
  async run(): Promise<D1RunResult> { return { success: true }; }
}

class FakeDb implements D1DatabaseLike {
  constructor(private readonly row: unknown) {}
  prepare(_query: string) { return new FakeStatement(this.row); }
  async batch(_statements: D1PreparedStatementLike[]) { return []; }
}

describe("V16 newsroom authorization", () => {
  it("fails closed when Cloudflare Access headers are absent", async () => {
    const request = new Request("https://iaict.vn/api/admin/news/review");
    const db = new FakeDb(null);

    await expect(requireNewsroomActor(request, db, ["news_editor"])).rejects.toMatchObject({
      status: 401,
    } satisfies Partial<NewsroomAuthError>);
  });

  it("maps an authenticated active CMS user to newsroom roles", async () => {
    const request = new Request("https://iaict.vn/api/admin/news/review", {
      headers: {
        "Cf-Access-Authenticated-User-Email": "editor@iaict.vn",
        "Cf-Access-Jwt-Assertion": "signed-access-token",
      },
    });
    const db = new FakeDb({
      id: "user-1",
      email: "editor@iaict.vn",
      display_name: "IAICT Editor",
      role_codes: "news_editor,news_reviewer",
    });

    const actor = await requireNewsroomActor(request, db, ["news_editor"]);
    expect(actor.id).toBe("user-1");
    expect(actor.roles).toContain("news_editor");
  });
});


describe("CMS seven-role least-privilege matrix [LOCAL VERIFIED-HEADER BOUNDARY]", () => {
  // The public Worker independently verifies JWT/D1-cookie and injects a
  // trusted identity. These role-only tests intentionally use a synthetic
  // post-verification Access header; they are NOT live login/E2E proof.
  const expectations: { role: CmsRoleCode; cmsRead: boolean; cmsEdit: boolean; cmsAdmin: boolean; newsRead: boolean; newsEdit: boolean; newsReview: boolean }[] = [
    { role: "admin",         cmsRead: true,  cmsEdit: true,  cmsAdmin: true,  newsRead: true, newsEdit: true,  newsReview: true },
    { role: "editor",        cmsRead: true,  cmsEdit: true,  cmsAdmin: false, newsRead: true, newsEdit: true,  newsReview: false },
    { role: "reviewer",      cmsRead: true,  cmsEdit: false, cmsAdmin: false, newsRead: true, newsEdit: false, newsReview: true },
    { role: "viewer",        cmsRead: true,  cmsEdit: false, cmsAdmin: false, newsRead: true, newsEdit: false, newsReview: false },
    { role: "news_admin",    cmsRead: false, cmsEdit: false, cmsAdmin: false, newsRead: true, newsEdit: true,  newsReview: true },
    { role: "news_editor",   cmsRead: false, cmsEdit: false, cmsAdmin: false, newsRead: true, newsEdit: true,  newsReview: false },
    { role: "news_reviewer", cmsRead: false, cmsEdit: false, cmsAdmin: false, newsRead: true, newsEdit: false, newsReview: true },
  ];
  const gates = [
    { label: "CMS read", roles: CMS_READ_ROLES, flag: "cmsRead" },
    { label: "CMS edit including private Media upload", roles: CMS_EDIT_ROLES, flag: "cmsEdit" },
    { label: "CMS user administration", roles: CMS_ADMIN_ROLES, flag: "cmsAdmin" },
    { label: "Newsroom read", roles: NEWSROOM_READ_ROLES, flag: "newsRead" },
    { label: "Newsroom edit", roles: NEWSROOM_EDIT_ROLES, flag: "newsEdit" },
    { label: "Newsroom review", roles: NEWSROOM_REVIEW_ROLES, flag: "newsReview" },
  ] as const;

  for (const row of expectations) {
    it("enforces least privilege for " + row.role, async () => {
      const email = "synthetic-" + row.role + "@example.test";
      const request = new Request("https://cms.example.test/api/admin/cms/media/quarantine", {
        headers: {
          "Cf-Access-Authenticated-User-Email": email,
          "Cf-Access-Jwt-Assertion": "test-only-post-verification-placeholder",
        },
      });
      const db = new FakeDb({
        id: "qa-" + row.role, email, display_name: "Synthetic",
        role_codes: row.role,
      });
      for (const gate of gates) {
        const authorized = await requireNewsroomActor(request, db, gate.roles)
          .then(() => true, error => {
            expect(error).toBeInstanceOf(NewsroomAuthError);
            expect((error as NewsroomAuthError).status, gate.label).toBe(403);
            return false;
          });
        expect(authorized, row.role + " → " + gate.label).toBe(row[gate.flag]);
      }
    });
  }
});
