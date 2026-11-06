import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { getDb, nativeActor, rotate } = vi.hoisted(() => ({
  getDb: vi.fn(),
  nativeActor: vi.fn(),
  rotate: vi.fn(),
}));

vi.mock("@/lib/cloudflare-db", () => ({ getDatabaseBinding: getDb }));
vi.mock("@/lib/native-auth", async importOriginal => {
  const original = await importOriginal<typeof import("@/lib/native-auth")>();
  return { ...original, nativeActorEmail: nativeActor, setNativePassword: rotate };
});

import { POST, GET } from "./route";
const ROOT = "https://iaict-portal-staging.iaict-platform.workers.dev";
const ACTOR = { id: "active-user", email: "qa@example.test" };
const req = (body: unknown, origin = ROOT, contentType = "application/json") => new Request(
  ROOT + "/api/account/password",
  { method: "POST", headers: { Origin: origin, "Content-Type": contentType },
    body: JSON.stringify(body) },
);
const good = { currentPassword: "OldPass-888", password: "NewPass-999" };
let found: boolean;
let lookup: ReturnType<typeof vi.fn>;
beforeEach(() => {
  (globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean })
    .__IAICT_NATIVE_AUTH_ENABLED__ = true;
  found = true;
  lookup = vi.fn(async () => found ? ACTOR : null);
  getDb.mockReturnValue({
    prepare: vi.fn(() => ({ bind: vi.fn(() => ({ first: lookup })) })),
  });
  nativeActor.mockResolvedValue(ACTOR.email);
  rotate.mockResolvedValue("rotated");
});
afterEach(() => {
  delete (globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean })
    .__IAICT_NATIVE_AUTH_ENABLED__;
  vi.clearAllMocks();
});

describe("native-only self-service password rotation", () => {
  it("fails closed when feature is off, with no D1 access", async () => {
    (globalThis as typeof globalThis & { __IAICT_NATIVE_AUTH_ENABLED__?: boolean })
      .__IAICT_NATIVE_AUTH_ENABLED__ = false;
    expect((await POST(req(good))).status).toBe(404);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("rejects forged origins and non-JSON requests before session lookup", async () => {
    expect((await POST(req(good, "https://attacker.invalid"))).status).toBe(403);
    expect((await POST(req(good, ROOT, "text/plain"))).status).toBe(415);
    expect(nativeActor).not.toHaveBeenCalled();
  });

  it("enforces password requirements without returning passwords", async () => {
    for (const body of [
      { currentPassword: "short", password: "NewPass-999" },
      { currentPassword: "OldPass-888", password: "short" },
      { currentPassword: "OldPass-888", password: "OldPass-888" },
    ]) {
      const response = await POST(req(body));
      expect(response.status).toBe(400);
      expect(await response.text()).not.toContain("OldPass-888");
    }
    expect(nativeActor).not.toHaveBeenCalled();
  });

  it("rejects anonymous/expired session and disabled or unprovisioned account", async () => {
    nativeActor.mockResolvedValueOnce(null);
    expect((await POST(req(good))).status).toBe(401);
    found = false;
    expect((await POST(req(good))).status).toBe(403);
    expect(rotate).not.toHaveBeenCalled();
  });

  it("requires current password, rotates only the session actor and signs all sessions out", async () => {
    const response = await POST(req(good));
    expect(response.status).toBe(200);
    expect((await response.json())).toEqual({ ok: true, reauthenticationRequired: true });
    expect(rotate).toHaveBeenCalledWith(expect.anything(), ACTOR, good.password, good.currentPassword);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(lookup).toHaveBeenCalledOnce();
  });

  it("does not rotate credentials on current-password failure", async () => {
    rotate.mockRejectedValueOnce(new Error("INVALID_CURRENT_PASSWORD"));
    const response = await POST(req(good));
    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect((await response.json()).error).toMatch(/hiện tại/);
  });

  it("is never available by GET", async () => {
    expect((await GET()).status).toBe(405);
    expect(nativeActor).not.toHaveBeenCalled();
  });
});
