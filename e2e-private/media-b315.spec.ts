import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

// Synthetic 1x1 RGB PNG, verified by an image decoder; no customer content.
// SHA-256: 7c382843aa8f9f7985f88a8cc7e0651c90ab9c0885a1b2d5e2e8526048e1992e
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOo6DkBAANMAc3vMrTnAAAAAElFTkSuQmCC",
  "base64",
);
const origin = "https://iaict-portal-staging.iaict-platform.workers.dev";
const role = process.env.IAICT_MEDIA_QA_ROLE;
const uploader = role === "admin" || role === "editor";

function headers(filename: string, idem = randomUUID(), requestOrigin = origin) {
  return {
    origin: requestOrigin,
    "content-type": "image/png",
    "x-media-filename": encodeURIComponent(filename),
    "idempotency-key": idem,
    accept: "application/json",
  };
}

// All live authentication material must remain in an operator-controlled
// storageState file outside the repository; no screenshots or traces.
test.beforeAll(() => {
  const use = test.info().project.use;
  if (
    process.env.CI ||
    process.env.IAICT_MEDIA_E2E_APPROVED !== "staging-only" ||
    !["admin", "editor", "viewer"].includes(role ?? "") ||
    use.baseURL !== origin ||
    typeof use.storageState !== "string" ||
    use.storageState !== process.env.IAICT_ACCESS_STORAGE_STATE
  ) {
    throw new Error("MEDIA_B315_PRIVATE_STAGING_CONFIG_REQUIRED");
  }
});

test.describe.serial("B3.15 real staging quarantine-only acceptance", () => {
  test("CMS-MEDIA-001 capability is authenticated, role-scoped and non-publishing", async ({ request }) => {
    const res = await request.get("/api/admin/cms/media/quarantine", { maxRedirects: 0 });
    expect(res.status()).toBe(uploader ? 200 : 403);
    expect(res.headers()["cache-control"]).toContain("no-store");
    if (!uploader) return;
    const gate = await res.json() as Record<string, unknown>;
    expect(gate.ok).toBe(true);
    expect(gate.roleAllowed).toBe(true);
    expect(gate.quarantineEnabled).toBe(true);
    expect(gate.scannerConfigured).toBe(false);
    expect(gate.publicationEnabled).toBe(false);
    expect(gate.maxBytes).toBe(10 * 1024 * 1024);
  });

  test("CMS-MEDIA-001 mobile CMS UI renders and submits a real synthetic PNG", async ({ page }) => {
    test.skip(!uploader, "Viewer is forbidden from loading the upload UI");
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto("/admin/media/upload", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Tải ảnh vào vùng cách ly" })).toBeVisible();
    await expect(page.getByText("Upload cách ly đang mở")).toBeVisible();
    const chooser = page.locator("#iaict-upload-media");
    await chooser.setInputFiles({ name: "b315-ui-synthetic.png", mimeType: "image/png", buffer: png });
    await page.getByRole("button", { name: "Tải lên vùng cách ly" }).click();
    await expect(page.getByText("Ảnh đã được lưu vào vùng cách ly riêng tư.")).toBeVisible();
    await expect(page.getByText(/QUARANTINED.*Chờ quét/)).toBeVisible();
    await expect(page.getByText(/chưa có đường dẫn công khai/)).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    // Do not copy authenticated HTML, cookies, private object IDs or session headers into logs.
  });

  test("CMS-MEDIA-002 real POST returns 201 QUARANTINED and replay returns same asset", async ({ request }) => {
    test.skip(!uploader, "Viewer cannot create Media");
    const key = randomUUID();
    const h = headers("b315-api-synthetic.png", key);
    const first = await request.post("/api/admin/cms/media/quarantine", { headers: h, data: png, maxRedirects: 0 });
    expect(first.status()).toBe(201);
    const a = await first.json() as Record<string, unknown>;
    expect(a.ok).toBe(true);
    expect(a.state).toBe("QUARANTINED");
    expect(a.requiresScan).toBe(true);
    expect(a.publicUrl).toBeNull();
    expect(typeof a.id).toBe("string");
    expect((a.id as string).length).toBeGreaterThan(0);

    const repeat = await request.post("/api/admin/cms/media/quarantine", { headers: h, data: png, maxRedirects: 0 });
    expect(repeat.status()).toBe(200);
    const b = await repeat.json() as Record<string, unknown>;
    expect(b.id).toBe(a.id);
    expect(b.state).toBe("QUARANTINED");
    expect(b.publicUrl).toBeNull();
    // Independent D1 row / private R2 bytes and SHA check is a separate operator step.
  });

  test("CMS-MEDIA-003 viewer POST is denied", async ({ request }) => {
    test.skip(uploader, "Run with an actual viewer session for negative RBAC");
    const res = await request.post("/api/admin/cms/media/quarantine", {
      headers: headers("b315-viewer-deny.png"), data: png, maxRedirects: 0,
    });
    expect(res.status()).toBe(403);
  });

  test("CMS-MEDIA-004 authenticated cross-origin upload is denied", async ({ request }) => {
    test.skip(!uploader, "Requires an authorized CMS session for CSRF test");
    const res = await request.post("/api/admin/cms/media/quarantine", {
      headers: headers("b315-origin-deny.png", randomUUID(), "https://example.invalid"),
      data: png, maxRedirects: 0,
    });
    expect(res.status()).toBe(403);
  });

  test("CMS-MEDIA-005 PNG label with invalid magic bytes is rejected", async ({ request }) => {
    test.skip(!uploader, "Requires an authorized CMS session");
    const res = await request.post("/api/admin/cms/media/quarantine", {
      headers: headers("b315-magic-deny.png"),
      data: Buffer.from("NOT_A_REAL_PNG_IMAGE", "utf8"), maxRedirects: 0,
    });
    expect(res.status()).toBe(415);
  });

  test("CMS-MEDIA-006 oversized request is rejected without private publication", async ({ request }) => {
    test.skip(!uploader || process.env.IAICT_MEDIA_B315_OVERSIZE !== "true",
      "10 MiB+1 live traffic is opt-in after operator verifies staging quota");
    const res = await request.post("/api/admin/cms/media/quarantine", {
      headers: headers("b315-oversize-deny.png"),
      data: Buffer.alloc(10 * 1024 * 1024 + 1, 0), maxRedirects: 0,
    });
    expect(res.status()).toBe(413);
  });
});
