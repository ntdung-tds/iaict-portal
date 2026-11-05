import { test, expect } from "@playwright/test";

// LOCAL Chromium UI contract. Authentication and APIs are stubbed deliberately;
// do NOT treat these assertions as staging authenticated E2E.
const roles = [
  "admin", "editor", "reviewer", "viewer",
  "news_admin", "news_editor", "news_reviewer",
] as const;

for (const role of roles) {
  test("local Chromium renders least-privilege navigation for " + role + " [MOCK]", async ({ page }) => {
    const isAdmin = role === "admin";
    const cms = ["admin", "editor", "reviewer", "viewer"].includes(role);
    await page.route("**/api/admin/cms/session", route => route.fulfill({
      json: { ok: true, actor: { id: "qa", roles: [role] } },
    }));
    await page.route("**/api/admin/cms/overview", route => route.fulfill({
      status: 403, json: { error: "Dữ liệu chưa được cấp trong kiểm thử UI." },
    }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    const nav = page.locator('aside[aria-label="Điều hướng CMS"] nav');
    await expect(nav.locator('a[href="/admin/news"]')).toBeVisible();
    if (cms) await expect(nav.locator('a[href="/admin"]')).toBeVisible();
    else await expect(nav.locator('a[href="/admin"]')).toHaveCount(0);
    if (isAdmin) await expect(nav.locator('a[href="/admin/users"]')).toBeVisible();
    else await expect(nav.locator('a[href="/admin/users"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("local Chromium hides privileged navigation when session is forbidden [MOCK]", async ({ page }) => {
  await page.route("**/api/admin/cms/session", route => route.fulfill({
    status: 403, json: { error: "Forbidden" },
  }));
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  const nav = page.locator('aside[aria-label="Điều hướng CMS"] nav');
  await expect(nav.locator('a[href="/admin/news"]')).toHaveCount(0);
  await expect(nav.locator('a[href="/admin/users"]')).toHaveCount(0);
  await expect(nav.locator('a[href="/admin"]')).toHaveCount(0);
});

for (const width of [320, 390, 768] as const) {
  test("CMS sidebar mobile drawer expands to readable labels at " + width + "px [MOCK]", async ({ page }) => {
    await page.route("**/api/admin/cms/session", route => route.fulfill({
      json: { ok: true, actor: { id: "qa", roles: ["admin"] } },
    }));
    await page.route("**/api/admin/cms/overview", route => route.fulfill({
      status: 403, json: { error: "Dữ liệu QA không dùng để xác nhận backend." },
    }));
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const sidebar = page.getByRole("complementary", { name: "Điều hướng CMS" });
    const open = sidebar.getByRole("button", { name: "Mở rộng menu CMS" });
    await expect(open).toBeVisible();
    await expect(open).toHaveAttribute("aria-expanded", "false");
    const course = sidebar.locator('a[href="/admin/course-sessions"]');
    await expect(course).toBeVisible();
    await expect(course).toHaveAttribute("aria-label", "Lịch lớp");
    await expect(course.locator("span").last()).toBeHidden();

    await open.click();
    const close = sidebar.getByRole("button", { name: "Thu gọn menu CMS" });
    await expect(close).toHaveAttribute("aria-expanded", "true");
    await expect(course.locator("span").last()).toBeVisible();
    await expect(course.locator("span").last()).toHaveText("Lịch lớp");
    await expect(sidebar.locator('a[href="/admin/content/projects"] span').last()).toHaveText("Dự án");
    await expect.poll(async () => (await sidebar.boundingBox())?.width ?? 0)
      .toBeGreaterThan(180);
    const dims = await page.evaluate(() => {
      const aside = document.querySelector("aside[aria-label='Điều hướng CMS']");
      return { asideWidth: aside?.getBoundingClientRect().width ?? 0, viewport: innerWidth, document: document.documentElement.scrollWidth };
    });
    expect(dims.asideWidth).toBeGreaterThan(180);
    expect(dims.asideWidth).toBeLessThan(dims.viewport);
    expect(dims.document).toBeLessThanOrEqual(dims.viewport);

    await page.keyboard.press("Escape");
    await expect(open).toHaveAttribute("aria-expanded", "false");
    await expect(course.locator("span").last()).toBeHidden();
    await open.click();
    await page.getByRole("button", { name: "Đóng menu điều hướng CMS" }).click({ position: { x: width - 4, y: 100 } });
    await expect(open).toHaveAttribute("aria-expanded", "false");
  });
}

test("CMS desktop navigation can collapse and expand without losing accessible names [MOCK]", async ({ page }) => {
  await page.route("**/api/admin/cms/session", route => route.fulfill({
    json: { ok: true, actor: { id: "qa", roles: ["admin"] } },
  }));
  await page.route("**/api/admin/cms/overview", route => route.fulfill({
    status: 403, json: { error: "UI-only role test." },
  }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  const sidebar = page.getByRole("complementary", { name: "Điều hướng CMS" });
  const course = sidebar.locator('a[href="/admin/course-sessions"]');
  await expect(course.locator("span").last()).toHaveText("Lịch lớp");
  await expect(course.locator("span").last()).toBeVisible();
  await sidebar.getByRole("button", { name: "Thu gọn menu CMS" }).click();
  await expect(course.locator("span").last()).toBeHidden();
  await expect(course).toHaveAttribute("aria-label", "Lịch lớp");
  await expect.poll(async () => (await sidebar.boundingBox())?.width ?? 999)
    .toBeLessThan(100);
  await sidebar.getByRole("button", { name: "Mở rộng menu CMS" }).click();
  await expect(course.locator("span").last()).toBeVisible();
  await expect.poll(async () => (await sidebar.boundingBox())?.width ?? 0)
    .toBeGreaterThan(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
