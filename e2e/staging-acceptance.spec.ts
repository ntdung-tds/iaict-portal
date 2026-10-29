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

test("newsroom admin paths are protected by Cloudflare Access at the edge", async ({ request }) => {
  for (const route of ["/admin/news", "/api/admin/news/settings"] as const) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect([302, 303, 307, 308], `${route} should redirect to Cloudflare Access`).toContain(response.status());
    const location = response.headers()["location"] ?? "";
    expect(location, `${route} should redirect through the Access login flow`).toMatch(/cloudflareaccess\.com|\/cdn-cgi\/access\/login/i);
  }
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

test("published newsroom content reaches the public site with provenance", async ({ request, page }) => {
  const listResponse = await request.get("/api/news/public?limit=12");
  expect(listResponse.status()).toBe(200);
  const listPayload = await listResponse.json() as {
    items?: Array<{ title: string; slug: string; canonicalUrl?: string | null }>;
  };
  const items = listPayload.items ?? [];
  expect(items.length).toBeGreaterThan(0);

  const target = items.find((item) => item.slug.endsWith("5f255579")) ?? items[0];
  expect(target.slug).toMatch(/^[a-z0-9-]+$/);
  expect(target.title.length).toBeGreaterThan(8);

  const detailResponse = await request.get(`/api/news/public?slug=${encodeURIComponent(target.slug)}`);
  expect(detailResponse.status()).toBe(200);
  const detailPayload = await detailResponse.json() as {
    item?: { title?: string; canonicalUrl?: string | null; sourceName?: string | null };
  };
  expect(detailPayload.item?.title).toBe(target.title);
  expect(detailPayload.item?.canonicalUrl).toMatch(/^https:\/\//);
  expect(detailPayload.item?.sourceName).toBeTruthy();

  const newsPage = await page.goto("/tin-tuc", { waitUntil: "domcontentloaded" });
  expect(newsPage?.status()).toBeLessThan(400);
  await expect(page.locator('[data-public-news-state="ready"]')).toBeVisible();
  await expect(page.locator(`[data-news-slug="${target.slug}"]`)).toBeVisible();

  const articlePage = await page.goto(`/tin-tuc/${target.slug}`, { waitUntil: "domcontentloaded" });
  expect(articlePage?.status()).toBeLessThan(400);
  await expect(page.locator('[data-public-news-detail="ready"]')).toBeVisible();
  await expect(page.locator("h1").first()).toHaveText(target.title);
  await expect(page.locator('[data-news-provenance="ready"]')).toBeVisible();
});


test("mobile menu opens and follows a public navigation link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const toggle = page.getByRole("button", { name: "Mở điều hướng" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator("#mobile-navigation")).toBeVisible();
  const target = page.locator('#mobile-navigation a[href="/gioi-thieu"]');
  await expect(target).toBeVisible();
  await target.click();
  await expect(page).toHaveURL(/\/gioi-thieu$/);
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("search accepts typed Vietnamese text and keyboard submission", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tim-kiem", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".public-search")).toHaveAttribute("data-ready", "true");
  const input = page.getByRole("searchbox", { name: "Tìm trong nội dung IAICT" });
  await input.fill("Trâm rừng");
  await input.press("Enter");
  await expect(page).toHaveURL(/q=Tr%C3%A2m(?:\+|%20)r%E1%BB%ABng/);
  await expect(page.locator('.public-search-results a[href="/du-an/tram-rung"]')).toBeVisible();
});

test("unauthenticated CMS root, subpaths, and APIs require Cloudflare Access", async ({ request }) => {
  for (const route of [
    "/admin",
    "/admin/news",
    "/api/admin/cms/overview",
    "/api/admin/news/settings",
  ] as const) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect([302, 303, 307, 308], `${route} should require Access login`).toContain(response.status());
    const location = response.headers()["location"] ?? "";
    expect(location, `${route} must redirect to Cloudflare Access`).toMatch(/cloudflareaccess\.com|\/cdn-cgi\/access\/login/i);
  }
});
