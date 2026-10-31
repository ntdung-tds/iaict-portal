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

test("read-only Access exact-root diagnostics: never serve an unauthenticated success response", async ({ request }) => {
  // Observe *both* hostnames without authentication or mutation. An HTTP 404
  // may mean no route exists: it is NOT proof that Access policy protected it.
  for (const { environment, host } of [
    { environment: "staging", host: "https://iaict-portal-staging.iaict-platform.workers.dev" },
    { environment: "production", host: "https://iaict-portal.iaict-platform.workers.dev" },
  ] as const) {
    for (const path of ["/admin", "/api/admin"] as const) {
      const response = await request.get(host + path, { maxRedirects: 0 });
      const code = response.status();
      const target = response.headers()["location"] ?? "";
      const accessRedirect = [302, 303, 307, 308].includes(code) &&
        new RegExp("cloudflareaccess[.]com|/cdn-cgi/access/login", "i").test(target);
      console.log(`[access-root-observation] ${environment} ${path}: HTTP ${code}, access_redirect=${accessRedirect}`);
      if (environment === "staging") {
        // Staging Access was updated to include both exact roots: a 404 is
        // deliberately insufficient evidence of actual edge protection.
        expect(accessRedirect, `staging exact ${path} must redirect to Cloudflare Access`).toBe(true);
      } else {
        // Production has not been changed and may still return 404. Record,
        // but do not confuse it with successful Access login enforcement.
        expect(code, `production ${path} exposed an unauthenticated success response`)
          .toBeGreaterThanOrEqual(300);
      }
    }
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


// Additional read-only, real-Chromium acceptance checks. No authenticated mutations.
const additionalMobileRoutes = [
  "/gioi-thieu",
  "/san-pham-nen-tang",
  "/giai-phap-dich-vu",
  "/chuyen-giao-cong-nghe",
  "/dao-tao-tap-huan",
  "/dao-tao-tap-huan/co-quan-nha-nuoc",
  "/du-an",
] as const;

for (const width of [320, 390, 768] as const) {
  test(`remaining seven public routes fit ${width}px on live staging`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of additionalMobileRoutes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} @ ${width}px must load`).toBeLessThan(400);
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.locator("h1").first()).toBeVisible();
      const size = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(size.document, `${route} @ ${width}px overflows: ${JSON.stringify(size)}`).toBeLessThanOrEqual(size.viewport);
    }
  });
}

test("live public search filters and resets without leaving stale URL state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tim-kiem?q=tram%20rung", { waitUntil: "domcontentloaded" });
  const search = page.locator(".public-search");
  await expect(search).toHaveAttribute("data-ready", "true");
  await expect(search.locator('a[href="/du-an/tram-rung"]')).toBeVisible();
  const projects = search.getByRole("group", { name: "Lọc nhóm nội dung" })
    .getByRole("button", { name: "Dự án", exact: true });
  await projects.click();
  await expect(projects).toHaveAttribute("aria-pressed", "true");
  expect(new URL(page.url()).searchParams.get("nhom")).toBe("Dự án");
  await expect(search.locator('a[href="/du-an/tram-rung"]')).toBeVisible();
  await search.getByRole("button", { name: "Xóa tìm kiếm & bộ lọc" }).click();
  await expect(search.getByRole("searchbox", { name: "Tìm trong nội dung IAICT" })).toHaveValue("");
  await expect(search.getByRole("group", { name: "Lọc nhóm nội dung" })
    .getByRole("button", { name: "Tất cả", exact: true })).toHaveAttribute("aria-pressed", "true");
  const parsed = new URL(page.url());
  expect(parsed.searchParams.has("q")).toBe(false);
  expect(parsed.searchParams.has("nhom")).toBe(false);
});

test("contact page's collaboration anchor navigates without sending a form", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lien-he", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /Các hướng hợp tác/ }).click();
  await expect(page).toHaveURL(/#contact-scope$/);
  await expect(page.locator("#contact-scope")).toBeVisible();
  await expect(page.getByRole("list", { name: "Các hướng hợp tác" }).getByRole("listitem")).toHaveCount(4);
});

test("news feed article link opens a provenance-backed public detail page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tin-tuc", { waitUntil: "domcontentloaded" });
  const feed = page.locator('[data-public-news-state="ready"]');
  await expect(feed).toBeVisible();
  const firstLink = feed.locator('[data-news-slug] h3 a').first();
  await expect(firstLink).toBeVisible();
  const expectedTitle = (await firstLink.innerText()).trim();
  await firstLink.click();
  await expect(page.locator('[data-public-news-detail="ready"]')).toBeVisible();
  await expect(page.locator("h1").first()).toHaveText(expectedTitle);
  await expect(page.locator('[data-news-provenance="ready"]')).toBeVisible();
  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-public-news-state="ready"]')).toBeVisible();
});

test("public pages do not produce uncaught JavaScript exceptions in live Chromium", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/tin-tuc", "/tim-kiem?q=AI", "/du-an/tram-rung", "/lien-he"]) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("#main-content")).toBeVisible();
    if (route.startsWith("/tin-tuc")) {
      await expect(page.locator('[data-public-news-state="ready"]')).toBeVisible();
    }
    if (route.startsWith("/tim-kiem")) {
      await expect(page.locator(".public-search")).toHaveAttribute("data-ready", "true");
    }
  }
  expect(errors, `uncaught exceptions: ${JSON.stringify(errors)}`).toEqual([]);
});

test("save public staging browser screenshots as reproducible visual evidence", async ({ page }) => {
  const { mkdirSync } = await import("node:fs");
  mkdirSync("browser-evidence/staging", { recursive: true });
  for (const item of [
    { route: "/", name: "home-desktop", width: 1440, height: 900 },
    { route: "/", name: "home-mobile", width: 390, height: 844 },
    { route: "/tin-tuc", name: "news-mobile", width: 390, height: 844 },
    { route: "/tim-kiem?q=tram%20rung", name: "search-mobile", width: 390, height: 844 },
    { route: "/lien-he", name: "contact-mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: item.width, height: item.height });
    const response = await page.goto(item.route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("#main-content")).toBeVisible();
    if (item.route.startsWith("/tin-tuc")) await expect(page.locator('[data-public-news-state="ready"]')).toBeVisible();
    if (item.route.startsWith("/tim-kiem")) await expect(page.locator(".public-search")).toHaveAttribute("data-ready", "true");
    await page.screenshot({ path: `browser-evidence/staging/${item.name}.png`, animations: "disabled" });
  }
});


test("native IAICT login is publicly accessible on staging, mobile-responsive, and does not expose self-registration", async ({ page }) => {
  for (const width of [320, 390, 768, 1440] as const) {
    await page.setViewportSize({ width, height: 844 });
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(response?.status(), "public IAICT login must not need Cloudflare Access").toBe(200);
    await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();
    await expect(page.locator("form")).toHaveCount(1);
    await expect(page.getByRole("link", { name: /đăng ký|register|sign up/i })).toHaveCount(0);
    const bounds = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(bounds.documentWidth, "IAICT login overflows at " + width + "px").toBeLessThanOrEqual(bounds.viewportWidth);
  }
});

test("native login never exposes credentials via GET and bootstrap stays behind Access", async ({ request }) => {
  const login = await request.get("/api/auth/login", { maxRedirects: 0 });
  expect(login.status()).toBe(405);
  expect(login.headers()["cache-control"]).toContain("no-store");
  for (const path of ["/admin/security", "/api/admin/cms/auth-setup"] as const) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(response.status());
    expect(response.headers()["location"] ?? "").toMatch(/cloudflareaccess\.com|\/cdn-cgi\/access\/login/i);
  }
});


test("independent native session page on staging stays outside Access while admin remains protected", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageResponse = await page.goto("/account", { waitUntil: "domcontentloaded" });
  expect(pageResponse?.status(), "native session account page should be public but identity-gated by D1").toBe(200);
  await expect(page.getByRole("heading", { name: "Kiểm tra đăng nhập IAICT" })).toBeVisible();
  await expect(page.getByText("Chưa đăng nhập IAICT hoặc phiên đã hết hạn.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng nhập IAICT" })).toHaveAttribute("href", "/login");

  const headerVariants: Array<Record<string, string>> = [{}, { "X-IAICT-Verified-Email": "fake@example.invalid" }, {
    Cookie: "__Host-iaict_session=" + "a".repeat(64),
  }];
  for (const headers of headerVariants) {
    const response = await request.get("/api/auth/session", { headers, maxRedirects: 0 });
    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const content = await response.text();
    expect(content).not.toContain("fake@example.invalid");
  }

  const adminResponse = await request.get("/api/admin/cms/session", { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(adminResponse.status());
  expect(adminResponse.headers()["location"] ?? "").toMatch(/cloudflareaccess\.com|\/cdn-cgi\/access\/login/i);
});

test("live native activation keeps the token out of GET requests and blocks anonymous administration", async ({ page, request }) => {
  const root = "https://iaict-portal-staging.iaict-platform.workers.dev";
  // These are read-only probes. No account, invitation or credential is created.
  for (const path of ["/api/auth/activate", "/api/account/password"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path + " must reject GET").toBe(405);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
  for (const path of ["/api/admin/cms/activation", "/admin/users"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect([302,303,307,308], path + " must remain behind Access").toContain(response.status());
    expect(response.headers()["location"] ?? "").toMatch(new RegExp("cloudflareaccess[.]com|/cdn-cgi/access/login", "i"));
  }
  const invalid = await request.get("/api/auth/session", { maxRedirects: 0 });
  expect(invalid.status()).toBe(401);
  for (const width of [320,390] as const) {
    await page.setViewportSize({width,height:844});
    const fakeFragment="f".repeat(64);
    const observed: string[] = [];
    page.on("request", req => {
      if (new URL(req.url()).pathname === "/activate") observed.push(req.url());
    });
    const response=await page.goto("/activate#token="+fakeFragment, {waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading",{name:"Kích hoạt tài khoản IAICT"})).toBeVisible();
    await expect(page.getByLabel("Mật khẩu mới")).toBeVisible();
    await expect(page).toHaveURL(root+"/activate");
    expect(observed.every(url=>!url.includes(fakeFragment))).toBe(true);
    const size=await page.evaluate(()=>({
      viewport:innerWidth, documentWidth:document.documentElement.scrollWidth,
    }));
    expect(size.documentWidth).toBeLessThanOrEqual(size.viewport);
  }
});
