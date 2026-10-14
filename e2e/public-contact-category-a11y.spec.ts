import { expect, test } from "@playwright/test";

const categoryRoutes = [
  "/giai-phap-dich-vu",
  "/san-pham-nen-tang",
  "/chuyen-giao-cong-nghe",
  "/dao-tao-tap-huan",
] as const;

function contrastRatio(foreground: number[], background: number[]) {
  const luminance = ([r, g, b]: number[]) => {
    const channels = [r, g, b].map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

test("category cards keep readable microcopy, distinct actions and mobile touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });

  for (const route of categoryRoutes) {
    await page.goto(route);
    const main = page.locator("#main-content[data-variant]");
    await expect(main).toBeVisible();

    const capabilityLink = main.locator('[class*="capabilityIndex"] a').first();
    const capabilityBox = await capabilityLink.boundingBox();
    expect(capabilityBox?.height ?? 0, `${route} capability index should keep a 44px touch target`).toBeGreaterThanOrEqual(44);

    const firstCard = main.locator('article[class*="card"]').first();
    const cardHeading = (await firstCard.getByRole("heading", { level: 3 }).innerText()).trim();
    const cardAction = firstCard.locator('a[class*="cardLink"]').first();
    const actionBox = await cardAction.boundingBox();
    expect(actionBox?.height ?? 0, `${route} card action should keep a 44px touch target`).toBeGreaterThanOrEqual(44);
    expect(await cardAction.getAttribute("aria-label"), `${route} card action should identify its destination`).toContain(cardHeading);

    const metrics = await main.evaluate((element) => {
      const selectors = [
        { selector: '[class*="signalPanel"] small', minSize: 10.5, background: [255, 255, 255] },
        { selector: '[class*="signalPanel"] p', minSize: 12, background: [255, 255, 255] },
        { selector: '[class*="index"]', minSize: 10.5, background: [249, 251, 250] },
        { selector: '[class*="metaGrid"] small', minSize: 10.5, background: [255, 255, 255] },
        { selector: '[class*="tags"] span', minSize: 10.5, background: [255, 255, 255] },
        { selector: '[class*="capabilityIndex"]>span', minSize: 10.5, background: [251, 253, 252] },
        { selector: '[class*="capabilityIndex"] small', minSize: 10.5, background: [255, 255, 255] },
      ];
      const parseRgb = (value: string) => {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
      };
      return selectors.map(({ selector, minSize, background }) => {
        const target = element.querySelector<HTMLElement>(selector);
        if (!target) return { selector, minSize, background, fontSize: 0, foreground: [0, 0, 0] };
        const style = getComputedStyle(target);
        return {
          selector,
          minSize,
          background,
          fontSize: parseFloat(style.fontSize),
          foreground: parseRgb(style.color),
        };
      });
    });

    for (const metric of metrics) {
      expect(metric.fontSize, `${route} ${metric.selector} should remain readable`).toBeGreaterThanOrEqual(metric.minSize);
      expect(
        contrastRatio(metric.foreground, metric.background),
        `${route} ${metric.selector} should meet AA contrast`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test("contact page exposes semantic groups and readable institutional details on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/lien-he");

  await expect(page.getByRole("heading", { level: 1, name: /Bắt đầu từ bài toán/i })).toBeVisible();
  await expect(page.locator("#contact-scope")).toHaveAttribute("aria-labelledby", "contact-scope-title");
  await expect(page.locator("address")).toContainText("Số 7 Tôn Thất Thuyết");
  await expect(page.getByRole("list", { name: "Các hướng hợp tác" }).getByRole("listitem")).toHaveCount(4);
  await expect(page.getByRole("list", { name: "Quy trình bắt đầu trao đổi" }).getByRole("listitem")).toHaveCount(4);
  await expect(page.getByRole("note")).toBeVisible();

  for (const action of await page.locator('[class*="heroActions"] a').all()) {
    const box = await action.boundingBox();
    expect(box?.height ?? 0, "contact hero actions should keep a 48px mobile target").toBeGreaterThanOrEqual(48);
  }

  const metrics = await page.evaluate(() => {
    const specs = [
      { selector: '[class*="contactHero"] [class*="lead"]', minSize: 15, background: [245, 248, 246] },
      { selector: '[class*="contactPrimary"] [class*="labelLight"]', minSize: 10.5, background: [11, 86, 84] },
      { selector: '[class*="addressBox"]>span', minSize: 10.5, background: [11, 86, 84] },
      { selector: '[class*="contactTopic"]>span', minSize: 10.5, background: [255, 255, 255] },
      { selector: '[class*="contactTopic"]>p', minSize: 12.5, background: [255, 255, 255] },
      { selector: '[class*="processStep"]>span', minSize: 10.5, background: [255, 255, 255] },
      { selector: '[class*="processStep"]>p', minSize: 12.5, background: [255, 255, 255] },
      { selector: '[class*="safeNote"]', minSize: 12.5, background: [234, 243, 240] },
    ];
    const parseRgb = (value: string) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
    };
    return specs.map(({ selector, minSize, background }) => {
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) return { selector, minSize, background, fontSize: 0, foreground: [0, 0, 0] };
      const style = getComputedStyle(target);
      return {
        selector,
        minSize,
        background,
        fontSize: parseFloat(style.fontSize),
        foreground: parseRgb(style.color),
      };
    });
  });

  for (const metric of metrics) {
    expect(metric.fontSize, `${metric.selector} should remain readable`).toBeGreaterThanOrEqual(metric.minSize);
    expect(contrastRatio(metric.foreground, metric.background), `${metric.selector} should meet AA contrast`).toBeGreaterThanOrEqual(4.5);
  }
});
