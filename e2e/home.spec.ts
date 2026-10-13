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
  "/tin-tuc",
  "/tin-tuc/tram-rung-tu-du-lieu-hien-truong-den-nen-tang-quan-ly-so",
  "/lien-he",
  "/tim-kiem",
];

const publicCopyRoutes = ["/gioi-thieu", "/du-an", "/tin-tuc", "/lien-he", "/tim-kiem", "/dao-tao-tap-huan/co-quan-nha-nuoc"];
const internalTerms = /\bM0\b|\bD1\b|hard-code|Turnstile|idempotency|notification outbox/i;

test("homepage exposes the premium IAICT solution-first experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("giải pháp số");
  await expect(page.getByRole("heading", { name: "Bạn đang cần giải quyết bài toán nào?" })).toBeVisible();
  await expect(page.getByText("IAICT Capability System", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trâm Rừng — từ dữ liệu hiện trường đến nền tảng quản lý số" })).toBeVisible();
  await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dành cho cơ quan nhà nước", exact: true })).toBeVisible();
  await expect(page.getByText("IAICT / Newsroom", { exact: true })).toBeVisible();
});

test("core institutional pages expose public-facing content", async ({ page }) => {
  await page.goto("/gioi-thieu");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kết nối nghiên cứu");

  await page.goto("/du-an");
  await expect(page.getByRole("heading", { name: "Từ dữ liệu hiện trường đến nền tảng quản lý số" })).toBeVisible();

  await page.goto("/tin-tuc");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kênh thông tin chính thức");
  await expect(page.getByRole("link", { name: /Trâm Rừng: từ dữ liệu hiện trường/ }).first()).toBeVisible();

  await page.goto("/lien-he");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bắt đầu từ bài toán");
  await expect(page.getByText("Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội")).toBeVisible();
});

test("publication pages render structured content and metadata", async ({ page }) => {
  await page.goto("/tin-tuc/tram-rung-tu-du-lieu-hien-truong-den-nen-tang-quan-ly-so");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Trâm Rừng");
  await expect(page.getByRole("heading", { name: "Bài toán triển khai" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /tin-tuc\/tram-rung-tu-du-lieu-hien-truong-den-nen-tang-quan-ly-so/);
});

test("public pages do not leak internal implementation language", async ({ page }) => {
  for (const route of publicCopyRoutes) {
    await page.goto(route);
    const visibleText = await page.locator("body").innerText();
    expect(visibleText, `${route} should contain public-facing copy only`).not.toMatch(internalTerms);
  }
});

test("search index includes publication content", async ({ page }) => {
  await page.goto("/tim-kiem");
  await page.getByRole("searchbox", { name: "Từ khóa tìm kiếm" }).fill("Trâm Rừng");
  await expect(page.getByRole("link", { name: /Trâm Rừng: từ dữ liệu hiện trường/ })).toBeVisible();
});

test("all public routes respond successfully", async ({ request }) => {
  for (const route of publicRoutes) {
    const response = await request.get(route);
    expect(response.status(), `${route} should return HTTP 200`).toBe(200);
  }
});

test("sitemap contains publication URLs and health endpoint remains no-store", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("tram-rung-tu-du-lieu-hien-truong-den-nen-tang-quan-ly-so");

  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toMatchObject({ status: "ok" });
});

test("admin surface is private and login page is noindex", async ({ request, page }) => {
  const dashboard = await request.get("/dashboard", { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(dashboard.status());
  expect(dashboard.headers()["location"]).toContain("/admin-login");

  await page.goto("/admin-login");
  await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
