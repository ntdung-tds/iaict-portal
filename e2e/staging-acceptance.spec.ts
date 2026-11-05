import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

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

test("staging CMS routes reject anonymous requests with native Worker gate", async ({ request }) => {
  for (const route of ["/admin/news", "/api/admin/news/settings"] as const) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status(), route + " must reject missing native session").toBe(401);
    expect(response.headers()["cache-control"], route).toContain("no-store");
    expect(response.headers()["location"] ?? "").not.toMatch(/cloudflareaccess[.]com/i);
  }
});

test("staging native password gate blocks exact CMS roots, production unchanged", async ({ request }) => {
  for (const { environment, host } of [
    { environment: "staging", host: "https://iaict-portal-staging.iaict-platform.workers.dev" },
    { environment: "production", host: "https://iaict-portal.iaict-platform.workers.dev" },
  ] as const) {
    for (const path of ["/admin", "/api/admin"] as const) {
      const response = await request.get(host + path, { maxRedirects: 0 });
      const status = response.status();
      console.log("[cms-native-auth] " + environment + " " + path + ": HTTP " + status);
      if (environment === "staging") {
        expect(status, path + " must deny unauthenticated request").toBe(401);
        expect(response.headers()["cache-control"]).toContain("no-store");
      } else {
        expect(status, "Production anonymous root must remain denied").toBeGreaterThanOrEqual(300);
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
  // SSR displays the menu button before React handlers are hydrated.
  // Wait for the header's explicit interactive-ready signal to avoid a
  // no-op click during the HTML-only phase; still verify one real click.
  await expect(page.locator('header[data-ui="public"]')).toHaveAttribute(
    "data-interactive", "true",
  );
  const toggle = page.getByRole("button", { name: "Mở điều hướng" });
  await expect(toggle).toBeVisible();
  await expect(toggle).toBeEnabled();
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

test("unauthenticated CMS root, subpaths, and APIs require valid native session", async ({ request }) => {
  for (const route of ["/admin", "/admin/news", "/api/admin/cms/overview", "/api/admin/news/settings"] as const) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status(), route + " must deny missing native session").toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
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

test("native login blocks GET and protected password setup denies anonymous users", async ({ request }) => {
  const login = await request.get("/api/auth/login", { maxRedirects: 0 });
  expect(login.status()).toBe(405);
  expect(login.headers()["cache-control"]).toContain("no-store");
  for (const path of ["/admin/security", "/api/admin/cms/auth-setup"] as const) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path + " must deny missing native session").toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});


test("independent native session page stays public while admin remains session-gated", async ({ page, request }) => {
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
  expect(adminResponse.status()).toBe(401);
  expect(adminResponse.headers()["cache-control"]).toContain("no-store");
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
    expect(response.status(), path + " must deny anonymous CMS access").toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
  const invalid = await request.get("/api/auth/session", { maxRedirects: 0 });
  expect(invalid.status()).toBe(401);
  for (const width of [320,390] as const) {
    await page.setViewportSize({width,height:844});
    // Ensure a fresh document load for each width; separate local E2E tests
    // cover same-tab hashchange behavior in the candidate build.
    await page.goto("/login", {waitUntil:"domcontentloaded"});
    const fakeFragment="f".repeat(64);
    const observed: string[] = [];
    page.on("request", req => {
      if (new URL(req.url()).pathname === "/activate") observed.push(req.url());
    });
    // Browser history.replaceState() strips the fragment during navigation.
    // Playwright may return null for this same-document navigation: verify the
    // network response independently and assert hydrated DOM separately.
    const documentResponse=await request.get("/activate", {maxRedirects:0});
    expect(documentResponse.status()).toBe(200);
    await page.goto("/activate#token="+fakeFragment, {waitUntil:"domcontentloaded"});
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


// REAL deployed-staging negative security tests. These do NOT establish
// legitimate authenticated multi-role Access acceptance. The first test
// may create one failure-counter row for a nonexistent QA example.test email.
test("actual Chromium native login denies a synthetic nonexistent user without cookie", async ({ page, request }) => {
  const email = "iaict-qa-deny-" + randomUUID() + "@example.test";
  const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Unusable-QA-Login*2026");
  const submit = page.getByRole("button", { name: "Đăng nhập", exact: true });
  await expect(submit).toBeEnabled();
  const pending = page.waitForResponse(r =>
    new URL(r.url()).pathname === "/api/auth/login" && r.request().method() === "POST");
  await submit.click();
  const login = await pending;
  expect(login.status()).toBe(401);
  expect(login.headers()["cache-control"]).toContain("no-store");
  expect(login.headers()["set-cookie"] ?? "").not.toContain("__Host-iaict_session");
  await expect(page.getByRole("alert")).toHaveText("Email hoặc mật khẩu không đúng.");
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.context().cookies()).map(c => c.name)).not.toContain("__Host-iaict_session");
  expect((await request.get("/api/auth/session", { maxRedirects: 0 })).status()).toBe(401);
});

test("actual staging rejects forged cross-site login and malformed activation POST", async ({ request }) => {
  const login = await request.post("/api/auth/login", {
    headers: { Origin: "https://untrusted.example.invalid" },
    data: { email: "qa-unknown@example.test", password: "NeverValid-Check1!" },
    maxRedirects: 0,
  });
  expect(login.status()).toBe(403);
  expect(login.headers()["cache-control"]).toContain("no-store");
  expect(login.headers()["set-cookie"] ?? "").not.toContain("__Host-iaict_session");

  const activation = await request.post("/api/auth/activate", {
    headers: { Origin: "https://iaict-portal-staging.iaict-platform.workers.dev" },
    data: { token: "not-a-valid-token", password: "Unusable-QA-Activation*2026" },
    maxRedirects: 0,
  });
  expect(activation.status()).toBe(400);
  expect(activation.headers()["cache-control"]).toContain("no-store");
  expect(activation.headers()["set-cookie"] ?? "").not.toContain("__Host-iaict_session");
});

test("actual staging Worker rejects forged Access and native identity on admin paths", async ({ request }) => {
  const headers = {
    "Cf-Access-Authenticated-User-Email": "qa-forged@example.invalid",
    "Cf-Access-Jwt-Assertion": "untrusted.fake.jwt",
    "X-IAICT-Verified-Email": "qa-forged@example.invalid",
    Cookie: "__Host-iaict_session=" + "a".repeat(64),
  };
  for (const path of [
    "/admin", "/admin/users", "/api/admin/cms/session",
    "/api/admin/cms/users", "/api/admin/news/settings",
  ]) {
    const response = await request.get(path, { headers, maxRedirects: 0 });
    expect(response.status(), path + " must reject forged identity").toBe(401);
    expect(response.headers()["set-cookie"] ?? "").not.toContain("__Host-iaict_session");
  }
});

// B3.14 REAL STAGING EDGE TESTS: These cases are intentionally ANONYMOUS.
// They prove Cloudflare Access protects the deployed Media surface and blocks
// untrusted uploads/identity headers. They are NOT authenticated Admin/Editor
// uploads, not R2 byte readbacks, and not CSRF/role-negative proof after login.
// Never add authentication secrets, Media fixtures, screenshots or trace uploads.
const mediaQuarantineApi = "/api/admin/cms/media/quarantine";
const mediaUploadUi = "/admin/media/upload";
const safeSyntheticPng = Buffer.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222,
]);

test("B3.14 regression: anonymous GET Media upload UI denied by native Worker", async ({ request }) => {
  const response = await request.get(mediaUploadUi, { maxRedirects: 0 });
  expect(response.status(), "Anonymous Media UI must remain denied").toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  console.log("[media-staging-native] UI ANON_401_PASS; AUTH_MEDIA_UPLOAD_NOT_RUN");
});

test("B3.14 regression: anonymous GET Media capability denied by native Worker", async ({ request }) => {
  const response = await request.get(mediaQuarantineApi, { maxRedirects: 0 });
  expect(response.status(), "Anonymous Media capability must remain denied").toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  console.log("[media-staging-native] CAPABILITY_ANON_401_PASS; AUTH_ROLE_NOT_RUN");
});

test("B3.14 regression: anonymous POST synthetic PNG cannot create quarantine upload", async ({ request }) => {
  const response = await request.post(mediaQuarantineApi, {
    maxRedirects: 0,
    headers: {
      "content-type": "image/png",
      "origin": "https://iaict-portal-staging.iaict-platform.workers.dev",
      "x-media-filename": "qa-anonymous.png",
      "idempotency-key": randomUUID(),
    },
    data: safeSyntheticPng,
  });
  expect(response.status(), "Anonymous Media POST must fail before storage").toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  console.log("[media-staging-native] POST_ANON_401_PASS; R2_BYTES_NOT_RUN");
});

test("B3.14 regression: forged CMS/Access identity cannot create quarantine upload", async ({ request }) => {
  const response = await request.post(mediaQuarantineApi, {
    maxRedirects: 0,
    headers: {
      "content-type": "image/png",
      "origin": "https://iaict-portal-staging.iaict-platform.workers.dev",
      "x-media-filename": "qa-forged.png",
      "idempotency-key": randomUUID(),
      "Cf-Access-Authenticated-User-Email": "qa-forged@example.test",
      "Cf-Access-Jwt-Assertion": "invalid-unsigned-untrusted-token",
      "X-IAICT-Verified-Email": "qa-forged@example.test",
    },
    data: safeSyntheticPng,
  });
  expect(response.status(), "Forged identity must fail before R2 write").toBe(401);
  console.log("[media-staging-native] POST_FORGED_401_PASS; AUTH_ROLE_R2_NOT_RUN");
});


test("staging native password-only CMS redirects human HTML navigation after real deployment", async ({ page, request }) => {
  // Actual deployed Worker, not a local mocked login. No credentials sent here.
  const root = "/admin";
  const human = await request.get(root, {
    headers: { Accept: "text/html" }, maxRedirects: 0,
  });
  expect(human.status(), "human browser navigation must redirect without a session").toBe(302);
  expect(human.headers()["location"]).toBe("/login");
  expect(human.headers()["cache-control"]).toContain("no-store");
  const apiLike = await request.get(root, {
    headers: { Accept: "application/json" }, maxRedirects: 0,
  });
  expect(apiLike.status(), "non-browser anonymous requests remain denied").toBe(401);
  for (const width of [320, 390] as const) {
    await page.setViewportSize({ width, height: 844 });
    const response = await page.goto(root, { waitUntil: "domcontentloaded" });
    expect(response?.status(), "final native password login HTML").toBe(200);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mật khẩu")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth, documentWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.documentWidth, "login overflow at " + width).toBeLessThanOrEqual(dimensions.viewport);
  }
  for (const apiPath of ["/api/auth/session", "/api/admin/cms/overview", "/api/admin/cms/media/quarantine"] as const) {
    const response = await request.get(apiPath, { maxRedirects: 0 });
    expect(response.status(), apiPath + " must reject anonymous caller").toBe(401);
  }
});


test("anonymous cross-module CMS API matrix rejects read and mutation on staging", async ({ request }) => {
  // Genuine hosted staging Worker, no browser session, no fixture data writes.
  // Every POST/DELETE must be rejected by the Worker before route handlers
  // inspect the deliberately invalid synthetic body.
  const roots = [
    "/api/admin/cms/session",
    "/api/admin/cms/users",
    "/api/admin/cms/articles",
    "/api/admin/cms/overview",
    "/api/admin/cms/media/quarantine",
    "/api/admin/news/settings",
  ] as const;
  const origin = "https://iaict-portal-staging.iaict-platform.workers.dev";
  for (const path of roots) {
    const response = await request.get(path, {
      headers: { Accept: "application/json" },
      maxRedirects: 0,
    });
    expect(response.status(), path + " anonymous GET must fail closed").toBe(401);
    expect(response.headers()["cache-control"], path).toContain("no-store");
    expect(response.headers()["set-cookie"] ?? "").not.toContain("__Host-iaict_session");
  }
  for (const method of ["POST", "DELETE"] as const) {
    for (const path of ["/api/admin/cms/users", "/api/admin/cms/articles"] as const) {
      const response = await request.fetch(path, {
        method, data: JSON.stringify({ action: "qa-auth-denied", id: "synthetic-no-op" }),
        headers: { "content-type": "application/json", origin, Accept: "application/json" },
        maxRedirects: 0,
      });
      expect(response.status(), method + " " + path + " must fail before mutation").toBe(401);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(response.headers()["set-cookie"] ?? "").not.toContain("__Host-iaict_session");
    }
  }
  console.log("[cms-staging-matrix] 6 anonymous GET and 4 mutation attempts denied 401; NO authenticated RBAC claim");
});
