import { expect, test } from "@playwright/test";

test("mobile navigation manages keyboard focus at the narrow QA breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gioi-thieu");
  await expect(page.locator("header[data-interactive]")).toHaveAttribute("data-interactive", "true");

  const toggle = page.locator('button[aria-controls="mobile-navigation"]');
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Enter");

  const nav = page.getByRole("navigation", { name: "Điều hướng di động" });
  const current = nav.locator('a[aria-current="page"]');
  await expect(nav).toBeVisible();
  await expect(current).toBeFocused();

  const currentOutline = await current.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(currentOutline).not.toBe("none");

  await toggle.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(nav.getByRole("link", { name: "Tìm kiếm", exact: true })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(nav).not.toBeVisible();
  await expect(toggle).toBeFocused();
});

test("desktop header and homepage carousel expose visible keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const discovery = page.locator('header details summary').filter({ hasText: "Khám phá" });
  await discovery.focus();
  await expect(discovery).toBeFocused();
  expect(await discovery.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");

  const topic = page.getByRole("group", { name: "Chuyển nội dung giới thiệu" }).getByRole("button", { name: "AI & Dữ liệu", exact: true });
  await expect(topic).toBeEnabled();
  await topic.focus();
  await expect(topic).toBeFocused();
  expect(await topic.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
});

test("compact header keeps readable Vietnamese identity without micro English copy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const brand = page.getByRole("link", { name: "IAICT - Trang chủ" });
  await expect(brand.getByText("Viện Ứng dụng Công nghệ Thông tin và Truyền thông", { exact: true })).toBeVisible();
  await expect(brand.getByText("Institute of Applied Information and Communication Technology", { exact: true })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
