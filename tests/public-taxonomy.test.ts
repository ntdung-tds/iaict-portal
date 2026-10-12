import { describe, expect, it } from "vitest";
import { mainNavigation, newsCategories, productGroups, solutionGroups } from "../lib/public-content";

describe("public information architecture", () => {
  it("keeps the required nine-item main navigation", () => {
    expect(mainNavigation).toHaveLength(9);
    expect(new Set(mainNavigation.map((item) => item.href)).size).toBe(9);
  });

  it("keeps the baseline product and solution taxonomies", () => {
    expect(productGroups).toHaveLength(6);
    expect(solutionGroups).toHaveLength(7);
    expect(newsCategories).toHaveLength(9);
  });
});
