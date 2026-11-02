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
