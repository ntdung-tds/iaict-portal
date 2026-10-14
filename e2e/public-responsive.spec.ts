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
        const elements = [...document.querySelectorAll<HTMLElement>("body *")];
        const describe = (element: HTMLElement) => ({
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: typeof element.className === "string" ? element.className.slice(0, 140) : "",
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 90),
        });
        const offenders = elements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const overflow = Math.max(0, rect.right - viewport, -rect.left);
            if (overflow < 0.5) return null;
            return {
              ...describe(element),
              left: Math.round(rect.left * 10) / 10,
              right: Math.round(rect.right * 10) / 10,
              width: Math.round(rect.width * 10) / 10,
              overflow: Math.round(overflow * 10) / 10,
            };
          })
          .filter(Boolean)
          .sort((a, b) => (b?.overflow ?? 0) - (a?.overflow ?? 0))
          .slice(0, 8);
        const internalOverflow = elements
          .map((element) => {
            const extra = element.scrollWidth - element.clientWidth;
            if (extra < 1) return null;
            const style = getComputedStyle(element);
            return {
              ...describe(element),
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
              extra,
              overflowX: style.overflowX,
              display: style.display,
              gridTemplateColumns: style.gridTemplateColumns,
            };
          })
          .filter(Boolean)
          .sort((a, b) => (b?.extra ?? 0) - (a?.extra ?? 0))
          .slice(0, 12);
        return { viewport, documentWidth, offenders, internalOverflow };
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

  const suggestion = search.getByRole("button", { name: "AI", exact: true });
  const filter = search.getByRole("group", { name: "Lọc nhóm nội dung" }).getByRole("button", { name: "Dự án", exact: true });
  const suggestionBox = await suggestion.boundingBox();
  const filterBox = await filter.boundingBox();
  expect(suggestionBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(filterBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await search.getByRole("button", { name: "Xóa tìm kiếm & bộ lọc" }).click();
  await filter.click();
  await expect(search.locator(".public-search-results article>span").first()).toHaveText("Dự án");
});

test("V15 discovery hub exposes semantic groups and readable compact actions", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/tim-kiem");

  const search = page.locator(".public-search");
  await expect(search).toHaveAttribute("data-ready", "true");
  await expect(search.getByRole("group", { name: "Gợi ý tìm kiếm" })).toBeVisible();
  await expect(search.getByRole("group", { name: "Lọc nhóm nội dung" })).toBeVisible();
  await expect(search.getByRole("region", { name: "Kết quả tìm kiếm IAICT" })).toBeVisible();

  const compactText = await page.evaluate(() => {
    const selectors = [
      ".public-search form>p",
      ".public-search-suggestions",
      ".public-search-filters button:not([aria-pressed=true])",
      ".public-search-status",
      ".public-search-results article>p",
    ];
    const parseRgb = (value: string) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
    };
    const luminance = ([r, g, b]: number[]) => {
      const channels = [r, g, b].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const whiteLuminance = luminance([255, 255, 255]);
    return selectors.map((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return { selector, fontSize: 0, contrast: 0 };
      const style = getComputedStyle(element);
      const foreground = luminance(parseRgb(style.color));
      const contrast = (whiteLuminance + 0.05) / (foreground + 0.05);
      return { selector, fontSize: parseFloat(style.fontSize), contrast };
    });
  });

  for (const metric of compactText) {
    expect(metric.fontSize, `${metric.selector} should remain readable`).toBeGreaterThanOrEqual(12);
    expect(metric.contrast, `${metric.selector} should meet AA contrast on the white search surface`).toBeGreaterThanOrEqual(4.5);
  }

  const quickAction = page.getByRole("link", { name: /Khám phá nội dung/i }).first();
  const quickActionBox = await quickAction.boundingBox();
  expect(quickActionBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(await quickAction.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(11);
});

test("V15 newsroom and project detail expose readable metadata and semantic hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/tin-tuc");

  await expect(page.getByRole("heading", { level: 1, name: /Tin tức, hoạt động/i })).toBeVisible();
  const categoryList = page.getByRole("list", { name: "Chuyên mục tin tức" });
  await expect(categoryList).toBeVisible();
  await expect(categoryList.getByRole("listitem").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Sự kiện.*Hội thảo.*Tập huấn/i })).toBeVisible();

  const newsMetrics = await page.evaluate(() => {
    const specs = [
      { selector: '[class*="story"]>span', background: [255, 255, 255] },
      { selector: '[class*="newsCard"]>span', background: [255, 255, 255] },
      { selector: '[class*="eventState"]>span', background: [237, 244, 241] },
      { selector: '[class*="editorialFeature"]>small', background: [12, 98, 91] },
    ];
    const parseRgb = (value: string) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
    };
    const luminance = ([r, g, b]: number[]) => {
      const channels = [r, g, b].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    return specs.map(({ selector, background }) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return { selector, fontSize: 0, contrast: 0 };
      const style = getComputedStyle(element);
      const foregroundLuminance = luminance(parseRgb(style.color));
      const backgroundLuminance = luminance(background);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return {
        selector,
        fontSize: parseFloat(style.fontSize),
        contrast: (lighter + 0.05) / (darker + 0.05),
      };
    });
  });

  for (const metric of newsMetrics) {
    expect(metric.fontSize, `${metric.selector} should not collapse into unreadable microcopy`).toBeGreaterThanOrEqual(10.5);
    expect(metric.contrast, `${metric.selector} should meet AA contrast`).toBeGreaterThanOrEqual(4.5);
  }

  await page.goto("/du-an/tram-rung");
  await expect(page.getByRole("heading", { level: 1, name: /Kết nối rừng với dữ liệu/i })).toBeVisible();

  const breadcrumb = page.getByRole("navigation", { name: "Đường dẫn trang" });
  for (const link of await breadcrumb.getByRole("link").all()) {
    const box = await link.boundingBox();
    expect(box?.height ?? 0, "breadcrumb links should keep a 44px mobile touch target").toBeGreaterThanOrEqual(44);
  }

  const detailMetrics = await page.evaluate(() => {
    const specs = [
      { selector: '[class*="factBarItem"]>span', background: [255, 255, 255], minSize: 10.5 },
      { selector: '[data-tram-mobile-row]>span', background: [255, 255, 255], minSize: 10.5 },
      { selector: '[data-tram-mobile-row]>small', background: [255, 255, 255], minSize: 12 },
      { selector: '[class*="systemFlow"] small', background: [7, 59, 66], minSize: 10.5 },
      { selector: '[class*="evidenceNote"]', background: [7, 59, 66], minSize: 11.5 },
    ];
    const parseRgb = (value: string) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
    };
    const luminance = ([r, g, b]: number[]) => {
      const channels = [r, g, b].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    return specs.map(({ selector, background, minSize }) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return { selector, minSize, fontSize: 0, contrast: 0 };
      const style = getComputedStyle(element);
      const foregroundLuminance = luminance(parseRgb(style.color));
      const backgroundLuminance = luminance(background);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return {
        selector,
        minSize,
        fontSize: parseFloat(style.fontSize),
        contrast: (lighter + 0.05) / (darker + 0.05),
      };
    });
  });

  for (const metric of detailMetrics) {
    expect(metric.fontSize, `${metric.selector} should remain readable`).toBeGreaterThanOrEqual(metric.minSize);
    expect(metric.contrast, `${metric.selector} should meet AA contrast`).toBeGreaterThanOrEqual(4.5);
  }
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

test("tablet edge keeps primary CTA usable at exactly 768px", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/tim-kiem");

  const primary = page.getByRole("link", { name: /Bắt đầu tìm kiếm/i });
  const box = await primary.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(768);
});

test("primary public calls to action remain keyboard-visible", async ({ page }) => {
  await page.goto("/du-an");
  const contact = page.getByRole("link", { name: /Trao đổi hợp tác/i }).first();
  await contact.focus();
  await expect(contact).toBeFocused();
  const outlineStyle = await contact.evaluate(element => getComputedStyle(element).outlineStyle);
  expect(outlineStyle).not.toBe("none");
});
