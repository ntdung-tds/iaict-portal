import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/gioi-thieu",
  "/san-pham-nen-tang",
  "/giai-phap-dich-vu",
  "/chuyen-giao-cong-nghe",
  "/dao-tao-tap-huan",
  "/dao-tao-tap-huan/co-quan-nha-nuoc",
  "/du-an",
  "/du-an/tram-rung",
  "/tin-tuc",
  "/lien-he",
  "/tim-kiem",
] as const;

const responsiveRoutes = ["/", "/tim-kiem", "/tin-tuc", "/du-an/tram-rung", "/lien-he"] as const;
const narrowWidths = [320, 390, 768] as const;

test("staging health and public workflow metadata are healthy", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["cache-control"]).toContain("no-store");
  const healthBody = await health.json() as { status?: string };
  expect(healthBody.status).toBe("ok");

  const workflow = await request.get("/api/news/workflow");
  expect(workflow.status()).toBe(200);
  expect(workflow.headers()["cache-control"]).toContain("no-store");
  const body = await workflow.json() as {
    version?: string;
    backend?: { repositoryReady?: boolean; accessFailClosed?: boolean };
    scheduler?: { ready?: boolean; cronUtc?: string };
  };
  expect(body.version).toMatch(/^v16-news-workflow-/);
  expect(body.backend?.repositoryReady).toBe(true);
  expect(body.backend?.accessFailClosed).toBe(true);
  expect(body.scheduler?.ready).toBe(true);
  expect(body.scheduler?.cronUtc).toBe("*/15 * * * *");
});

test("newsroom admin API fails closed without Cloudflare Access identity", async ({ request }) => {
  const response = await request.get("/api/admin/news/settings");
  expect(response.status()).toBe(401);
  const body = await response.json() as { error?: string };
  expect(body.error).toMatch(/Cloudflare Access authentication required/i);
});

test("all canonical public routes render successfully on staging", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response, `${route} should return a document response`).not.toBeNull();
    expect(response?.status(), `${route} should not return an HTTP error`).toBeLessThan(400);
    await expect(page.locator("#main-content"), `${route} should expose the main content landmark`).toBeVisible();
    await expect(page.locator("h1").first(), `${route} should have a visible primary heading`).toBeVisible();
  }
});

test("critical staging routes fit 320, 390 and 768px without horizontal overflow", async ({ page }) => {
  for (const width of narrowWidths) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of responsiveRoutes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} @ ${width}px should load`).toBeLessThan(400);
      await expect(page.locator("#main-content")).toBeVisible();
      const report = await page.evaluate(() => {
        const viewport = window.innerWidth;
        const documentWidth = document.documentElement.scrollWidth;
        const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const overflow = Math.max(0, rect.right - viewport, -rect.left);
            if (overflow < 0.5) return null;
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id,
              className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
              overflow: Math.round(overflow * 10) / 10,
            };
          })
          .filter(Boolean)
          .sort((a, b) => (b?.overflow ?? 0) - (a?.overflow ?? 0))
          .slice(0, 6);
        return { viewport, documentWidth, offenders };
      });
      expect(
        report.documentWidth <= report.viewport,
        `${route} overflows at ${width}px: ${JSON.stringify(report)}`,
      ).toBeTruthy();
    }
  }
});

test("live search hydrates and can discover the Trâm rừng project", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const response = await page.goto("/tim-kiem?q=tram%20rung", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);

  const search = page.locator(".public-search");
  await expect(search).toHaveAttribute("data-ready", "true");
  await expect(search.locator('.public-search-results a[href="/du-an/tram-rung"]')).toBeVisible();

  const input = search.getByLabel("Tìm trong nội dung IAICT");
  const submit = search.getByRole("button", { name: "Tìm kiếm", exact: false }).first();
  await expect(input).toBeVisible();
  await expect(submit).toBeVisible();

  const inputBox = await input.boundingBox();
  const submitBox = await submit.boundingBox();
  expect(inputBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(submitBox?.height ?? 0).toBeGreaterThanOrEqual(44);
});
