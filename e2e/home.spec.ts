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
  "/lien-he",
  "/tim-kiem",
];

const publicCopyRoutes = [
  "/gioi-thieu",
  "/du-an",
  "/tin-tuc",
  "/lien-he",
  "/tim-kiem",
  "/dao-tao-tap-huan/co-quan-nha-nuoc",
];
const internalTerms = /\bM0\b|\bD1\b|hard-code|Turnstile|idempotency|notification outbox/i;

test("homepage exposes the premium IAICT solution-first experience", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("giải pháp số");
  await expect(
    page.getByRole("heading", { name: "Bạn đang cần giải quyết bài toán nào?" }),
  ).toBeVisible();
  await expect(page.getByText("IAICT Capability System", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Trâm Rừng — từ dữ liệu hiện trường đến nền tảng quản lý số",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Dành cho cơ quan nhà nước", exact: true }),
  ).toBeVisible();
});

test("core institutional pages expose public-facing content", async ({ page }) => {
  await page.goto("/gioi-thieu");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kết nối nghiên cứu");

  await page.goto("/du-an");
  await expect(page.getByRole("heading", { name: "Từ dữ liệu hiện trường đến nền tảng quản lý số" })).toBeVisible();

  await page.goto("/tin-tuc");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kênh thông tin chính thức");

  await page.goto("/lien-he");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bắt đầu từ bài toán");
  await expect(page.getByText("Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội")).toBeVisible();
});

test("search works against the public content index", async ({ page }) => {
  await page.goto("/tim-kiem");
  await page.getByRole("searchbox", { name: "Từ khóa tìm kiếm" }).fill("Trâm Rừng");
  await expect(page.getByRole("link", { name: /Dự án Trâm Rừng/ })).toBeVisible();

  await page.getByRole("searchbox", { name: "Từ khóa tìm kiếm" }).fill("AI & Dữ liệu");
  await expect(page.getByRole("link", { name: /AI & Dữ liệu/ }).first()).toBeVisible();
});

test("government training page exposes audience and specialty structure", async ({ page }) => {
  await page.goto("/dao-tao-tap-huan/co-quan-nha-nuoc");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Năng lực số");
  await expect(page.getByRole("heading", { name: "AI tạo sinh trong công vụ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quản trị dữ liệu & dữ liệu mở" })).toBeVisible();
});

test("public pages do not leak internal implementation language", async ({ page }) => {
  for (const route of publicCopyRoutes) {
    await page.goto(route);
    const visibleText = await page.locator("body").innerText();
    expect(visibleText, `${route} should contain public-facing copy only`).not.toMatch(internalTerms);
  }
});

test("seo endpoints are available", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("dao-tao-tap-huan/co-quan-nha-nuoc");

  const socialImage = await request.get("/opengraph-image");
  expect(socialImage.ok()).toBeTruthy();
  expect(socialImage.headers()["content-type"]).toContain("image/png");
});

test("all public routes respond successfully", async ({ request }) => {
  for (const route of publicRoutes) {
    const response = await request.get(route);
    expect(response.status(), `${route} should return HTTP 200`).toBe(200);
  }
});

test("health endpoint is live and no-store", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toMatchObject({ status: "ok" });
});
