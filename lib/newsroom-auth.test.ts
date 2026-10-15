import { describe, expect, it } from "vitest";
import type {
  D1BindValue,
  D1DatabaseLike,
  D1PreparedStatementLike,
  D1RunResult,
} from "./cloudflare-db";
import { NewsroomAuthError, requireNewsroomActor } from "./newsroom-auth";

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
