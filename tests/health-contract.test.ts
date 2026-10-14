import { describe, expect, it } from "vitest";

import { GET } from "../app/api/health/route";

describe("GET /api/health", () => {
  it("returns a sanitized no-store liveness payload", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toEqual({
      status: "ok",
      version: expect.any(String),
      environment: expect.any(String),
    });
    if (body === null || typeof body !== "object") {
      throw new Error("Health payload must be a JSON object");
    }
    expect(Object.keys(body).sort()).toEqual(["environment", "status", "version"]);
  });
});
