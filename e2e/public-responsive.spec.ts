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

const narrowWidths = [320, 390, 768] as const;

test("all public routes fit 320, 390 and 768px without horizontal overflow", async ({ page }) => {
  for (const width of narrowWidths) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of publicRoutes) {
      await page.goto(route);
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
              className: typeof element.className === "string" ? element.className.slice(0, 140) : "",
              text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 90),
              left: Math.round(rect.left * 10) / 10,
              right: Math.round(rect.right * 10) / 10,
              width: Math.round(rect.width * 10) / 10,
              overflow: Math.round(overflow * 10) / 10,
            };
          })
          .filter(Boolean)
          .sort((a, b) => (b?.overflow ?? 0) - (a?.overflow ?? 0))
          .slice(0, 8);
        return { viewport, documentWidth, offenders };
      });
      expect(
        report.documentWidth <= report.viewport,
        `${route} should fit within ${width}px; overflow report: ${JSON.stringify(report)}`,
      ).toBeTruthy();
    }
  }
});

test("V15 discovery hub preserves search behavior and mobile touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/tim-kiem?q=tram%20rung");

  await expect(page.getByRole("heading", { level: 1, name: /Tìm đúng năng lực/i })).toBeVisible();
  const search = page.locator(".public-search");
  await expect(search).toHaveAttribute("data-ready", "true");
  await expect(search.locator('.public-search-results a[href="/du-an/tram-rung"]')).toBeVisible();

  const input = search.getByLabel("Tìm trong nội dung IAICT");
  const submit = search.getByRole("button", { name: "Tìm kiếm", exact: false }).first();
  const inputBox = await input.boundingBox();
  const submitBox = await submit.boundingBox();
  expect(inputBox?.height ?? 0).toBeGreaterThanOrEqual(48);
  expect(submitBox?.height ?? 0).toBeGreaterThanOrEqual(48);

  await search.getByRole("button", { name: "Xóa tìm kiếm & bộ lọc" }).click();
  await search.getByRole("group", { name: "Lọc nhóm nội dung" }).getByRole("button", { name: "Dự án", exact: true }).click();
  await expect(search.locator(".public-search-results article>span").first()).toHaveText("Dự án");
});

test("V15 public-sector training detail keeps useful hierarchy and navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/dao-tao-tap-huan/co-quan-nha-nuoc");

  await expect(page.getByRole("heading", { level: 1, name: /Đào tạo để áp dụng được vào công việc/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Xem nhóm đối tượng/i })).toHaveAttribute("href", "#audiences");
  await expect(page.getByRole("link", { name: /Trao đổi chương trình/i })).toHaveAttribute("href", "/lien-he");
  await page.getByRole("link", { name: /Xem nhóm đối tượng/i }).click();
  await expect(page.locator("#audiences")).toBeInViewport();
});

test("primary public calls to action remain keyboard-visible", async ({ page }) => {
  await page.goto("/du-an");
  const contact = page.getByRole("link", { name: /Trao đổi hợp tác/i }).first();
  await contact.focus();
  await expect(contact).toBeFocused();
  const outlineStyle = await contact.evaluate(element => getComputedStyle(element).outlineStyle);
  expect(outlineStyle).not.toBe("none");
});
