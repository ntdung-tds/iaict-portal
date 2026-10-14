import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => console.error("Browser error:", error.message));
});

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
];

const categoryRoutes = [
  ["/giai-phap-dich-vu", "Giải pháp & Dịch vụ"],
  ["/san-pham-nen-tang", "Sản phẩm & Nền tảng"],
  ["/chuyen-giao-cong-nghe", "Chuyển giao công nghệ"],
  ["/dao-tao-tap-huan", "Đào tạo & Tập huấn"],
] as const;

const institutionalRoutes = [
  ["/gioi-thieu", /Từ nghiên cứu ứng dụng đến năng lực triển khai/i],
  ["/lien-he", /Bắt đầu từ bài toán cần giải quyết/i],
  ["/tin-tuc", /Tin tức, hoạt động và góc nhìn chuyên môn/i],
] as const;

const wowV9Routes = [
  ["/du-an", /Dự án như một phòng thí nghiệm triển khai/i],
  ["/dao-tao-tap-huan/co-quan-nha-nuoc", /Đào tạo để áp dụng được vào công việc/i],
  ["/tim-kiem", /Tìm đúng năng lực, không chỉ tìm từ khóa/i],
] as const;

test("homepage exposes the current IAICT applied-technology baseline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("IAICT - năng lực và định hướng")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ứng dụng công nghệ");
  await expect(page.getByRole("heading", { name: /Bài toán đúng trước/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Liên hệ hợp tác" })).toBeVisible();
});

test("V6 category landings expose their primary capability entry point", async ({ page }) => {
  for (const [route, title] of categoryRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: /Khám phá năng lực/i })).toHaveAttribute("href", "#capabilities");
  }
});

test("V8 institutional landings expose their public-facing narrative", async ({ page }) => {
  for (const [route, title] of institutionalRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
  }
});

test("V9 WOW+++ remaining landings expose useful discovery paths", async ({ page }) => {
  for (const [route, title] of wowV9Routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
  }
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


test("V12 topic controls and service disclosures work", async ({ page }) => {
  await page.goto("/");
  const topics = page.getByRole("group", { name: "Chuyển nội dung giới thiệu" });
  await topics.getByRole("button", { name: "AI & Dữ liệu", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Biến dữ liệu thành năng lực ra quyết định.");
  await expect(topics.getByRole("button", { name: "AI & Dữ liệu", exact: true })).toHaveAttribute("aria-pressed", "true");
  const automatic = topics.getByRole("button", { name: "Tự động chuyển nội dung" });
  await automatic.click();
  await expect(automatic).toHaveAttribute("aria-pressed", "true");
  await topics.getByRole("button", { name: "IoT & Hiện trường" }).click();
  await expect(automatic).toHaveAttribute("aria-pressed", "false");
  await page.locator(".v12-service-details summary").first().click();
  await expect(page.locator(".v12-service-details").first()).toHaveAttribute("open", "");
  await expect(page.locator(".v12-service-details").first().getByText("Bản đồ ưu tiên · lộ trình · tiêu chí đánh giá")).toBeVisible();
});

test("V12 mobile navigation closes with Escape and marks the current page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gioi-thieu");
  await expect(page.locator("header[data-interactive]")).toHaveAttribute("data-interactive", "true");
  const toggle = page.getByLabel("Mở menu", { exact: true });
  await toggle.click();
  const nav = page.getByRole("navigation", { name: "Điều hướng di động" });
  await expect(nav).toBeVisible();
  await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute("href", "/gioi-thieu");
  await toggle.press("Escape");
  await expect(nav).not.toBeVisible();
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("public search supports Vietnamese, filters, empty state and shareable queries", async ({ page }) => {
  await page.goto("/tim-kiem?q=tram%20rung");
  const search = page.locator(".public-search");
  await expect(search).toHaveAttribute("data-ready", "true");
  await expect(search.locator('.public-search-results a[href="/du-an/tram-rung"]')).toBeVisible();
  await search.getByRole("button", { name: "Xóa tìm kiếm & bộ lọc" }).click();
  await search.getByRole("group", { name: "Lọc nhóm nội dung" }).getByRole("button", { name: "Đào tạo", exact: true }).click();
  await expect(search.locator(".public-search-results article>span").first()).toHaveText("Đào tạo");
  await search.getByRole("button", { name: "Xóa tìm kiếm & bộ lọc" }).click();
  await search.getByLabel("Tìm trong nội dung IAICT").fill("zzzzkhongco");
  await search.getByRole("button", { name: "Tìm kiếm", exact: false }).first().click();
  await expect(search.getByText("Chưa tìm thấy nội dung phù hợp.")).toBeVisible();
  await expect(page).toHaveURL(/q=zzzzkhongco/);
  await search.getByRole("button", { name: "Xem tất cả nội dung" }).click();
  await expect(search.locator(".public-search-results article")).toHaveCount(17);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("capability pages support direct navigation and details without losing the overview", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [route] of categoryRoutes) {
    await page.goto(route);
    const index = page.getByRole("navigation", { name: "Chọn năng lực cần khám phá" });
    const firstLink = index.getByRole("link").first();
    const target = await firstLink.getAttribute("href");
    expect(target).toMatch(/^#/);
    await firstLink.click();
    const card = page.locator(`article${target}`);
    await expect(card).toBeInViewport();
    // The fixed header must not cover the section selected from the index.
    const bounds = await card.boundingBox();
    const header = await page.locator("header").boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
    const details = card.locator("details");
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", "");
    await expect(details.getByText("Nội dung chính", { exact: true })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(details).not.toHaveAttribute("open", "");
    await expect(card.getByText("Đầu ra", { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: /Trao đổi nhu cầu/ })).toHaveAttribute("href", "/lien-he");
  }
  await page.goto("/san-pham-nen-tang#iot-quan-trac");
  await expect(page.locator("#iot-quan-trac")).toBeInViewport();
  await expect(page.getByRole("link", { name: /Khám phá dự án Trâm Rừng/ })).toHaveAttribute("href", "/du-an/tram-rung");
});

test("capability pages and mobile menu fit narrow screens", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [route] of categoryRoutes) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} at ${width}px`).toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/san-pham-nen-tang");
  await expect(page.locator("header")).toHaveAttribute("data-interactive", "true");
  const toggle = page.getByLabel("Mở menu", { exact: true });
  const nav = page.getByRole("navigation", { name: "Điều hướng di động" });
  await toggle.click();
  await expect(nav).toBeVisible();
  const navBounds = await nav.boundingBox();
  expect(navBounds!.x).toBeGreaterThanOrEqual(0);
  expect(navBounds!.x + navBounds!.width).toBeLessThanOrEqual(390);
  await page.getByRole("heading", { level: 1 }).click();
  await expect(nav).not.toBeVisible();
  await toggle.click();
  await nav.getByRole("link", { name: "Liên hệ & Hợp tác", exact: true }).click();
  await expect(page).toHaveURL(/\/lien-he/);
  await expect(nav).not.toBeVisible();
});
