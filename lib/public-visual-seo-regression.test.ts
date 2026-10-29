import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createPublicLayoutTitle } from "./public-metadata";

describe("Public metadata title composition", () => {
  it("uses a CMS-configured homepage title without inheriting a parent template", () => {
    expect(createPublicLayoutTitle("IAICT", "IAICT")).toEqual({
      absolute: "IAICT",
      template: "%s · IAICT",
    });
  });

  it("honors the CMS homepage SEO title and maintains page suffixes", () => {
    expect(createPublicLayoutTitle("IAICT", "Viện Ứng dụng Công nghệ Thông tin và Truyền thông")).toEqual({
      absolute: "Viện Ứng dụng Công nghệ Thông tin và Truyền thông",
      template: "%s · IAICT",
    });
  });

  it("falls back to the site title when the SEO title is empty", () => {
    expect(createPublicLayoutTitle("IAICT", "  ")).toEqual({
      absolute: "IAICT",
      template: "%s · IAICT",
    });
  });
});

describe("Public hero contrast regression", () => {
  it("gives the dark image hero heading an explicit light text color", () => {
    const css = readFileSync("components/public.module.css", "utf8");
    const heroRule = css.match(/\.hero\s*h1\s*\{([^}]+)\}/)?.[1];
    expect(heroRule, "A scoped hero heading CSS rule must exist").toBeTruthy();
    expect(heroRule).toMatch(/(?:^|;)\s*color\s*:\s*#(?:fff|ffffff)\s*(?:;|$)/i);
  });

  it("keeps body typography independent from the dark hero text", () => {
    const css = readFileSync("components/public.module.css", "utf8");
    expect(css).toContain(".page{background:#f5f8f6;color:#15343d}");
    expect(css).toContain(".hero{position:relative;overflow:hidden;");
  });
});
