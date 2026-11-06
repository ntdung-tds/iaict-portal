import { beforeEach, describe, expect, it, vi } from "vitest";
import { withDatabaseBinding, type D1DatabaseLike } from "./cloudflare-db";
import { NewsroomAuthError, requireNewsroomActor } from "./newsroom-auth";
import { GET } from "../app/api/admin/cms/session/route";

// This test exercises the real HTTP response route with a synthetic actor.
// It never mints a session, reads hosted D1, or uses a real customer email.
vi.mock("./newsroom-auth", async importOriginal => {
  const original = await importOriginal<typeof import("./newsroom-auth")>();
  return { ...original, requireNewsroomActor: vi.fn() };
});

const db: D1DatabaseLike = {
  prepare() { throw new Error("Synthetic actor test must not query D1"); },
  async batch() { throw new Error("Synthetic actor test must never write D1"); },
};
const url = "https://cms.example.test/api/admin/cms/session";
const actor = {
  id: "synthetic-qa-admin",
  email: "qa-cms@example.test",
  displayName: "QA only",
  roles: ["admin"] as ("admin")[],
};
const mockedAuth = vi.mocked(requireNewsroomActor);
function send() {
  return withDatabaseBinding(db, () => GET(new Request(url)));
}
function expectPrivacy(response: Response) {
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("cache-control")).toContain("private");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("set-cookie")).toBeNull();
}
beforeEach(() => { mockedAuth.mockReset(); });

describe("CMS private session response hardening [SYNTHETIC ACTOR ONLY]", () => {
  it("gives a valid synthetic actor a non-cacheable session response", async () => {
    mockedAuth.mockResolvedValue(actor);
    const response = await send();
    expect(response.status).toBe(200);
    expectPrivacy(response);
    expect(await response.json()).toEqual({ ok: true, actor });
  });

  it.each([401, 403] as const)("returns privacy headers on expected role/session denial HTTP %s", async status => {
    mockedAuth.mockRejectedValue(new NewsroomAuthError(status, "Sensitive internal error that must not leak"));
    const response = await send();
    expect(response.status).toBe(status);
    expectPrivacy(response);
    expect(await response.json()).toEqual({
      error: status === 401 ? "Authentication required" : "Insufficient CMS role",
    });
  });

  it("returns generic 503 without exposing D1 internals if session lookup fails", async () => {
    mockedAuth.mockRejectedValue(new Error("Sensitive D1 SQL and source connection details"));
    const response = await send();
    expect(response.status).toBe(503);
    expectPrivacy(response);
    const body = await response.text();
    expect(body).toContain("CMS_SESSION_UNAVAILABLE");
    expect(body).not.toContain("D1");
    expect(body).not.toContain("SQL");
    expect(body).not.toContain("connection");
  });
});
