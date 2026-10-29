import { expect, test } from "@playwright/test";

test("search hero heading stays white against its dark image background", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/tim-kiem", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const heading = page.locator("main#main-content > section").first().locator("h1");
  await expect(heading).toBeVisible();
  const color = await heading.evaluate((element) => getComputedStyle(element).color);
  expect(color).toBe("rgb(255, 255, 255)");
});

test("home title is absolute and does not inherit the root suffix", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const title = await page.title();
  expect(title).toContain("IAICT");
  expect(title).not.toContain(" | IAICT");
  expect(title).not.toMatch(/^IAICT\s*[|·]\s*IAICT$/);
});

test("public subpages keep a descriptive title and CMS-configured suffix", async ({ page }) => {
  await page.goto("/tim-kiem", { waitUntil: "domcontentloaded" });
  const title = await page.title();
  expect(title).toMatch(/Tìm kiếm.*IAICT/);
  expect(title).not.toMatch(/IAICT\s*[|·]\s*IAICT$/);
});
