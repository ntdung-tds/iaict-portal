import { describe, expect, it } from "vitest";
import {
  DEFAULT_NEWS_SOURCES,
  buildNewsReviewDraft,
  canTransitionNewsReviewStatus,
  canonicalizeNewsUrl,
  findProbableDuplicate,
  getNewsWorkflowPolicy,
  normalizeNewsTitle,
} from "./news-workflow";

describe("V16 news workflow", () => {
  it("normalizes Vietnamese titles consistently", () => {
    expect(normalizeNewsTitle("  AI & Dữ liệu: Ứng dụng trong CÔNG VỤ! ")).toBe(
      "ai dữ liệu ứng dụng trong công vụ",
    );
  });

  it("removes common tracking parameters from canonical URLs", () => {
    expect(
      canonicalizeNewsUrl("https://example.vn/tin-bai/?utm_source=test&b=2&a=1#section"),
    ).toBe("https://example.vn/tin-bai?a=1&b=2");
  });

  it("builds a pending review draft and detects duplicate canonical URLs", () => {
    const first = buildNewsReviewDraft({
      sourceId: "mst-gov-vn",
      sourceUrl: "https://mst.gov.vn/tin-a?utm_source=x",
      title: "Tin khoa học và công nghệ",
    });
    const second = buildNewsReviewDraft({
      sourceId: "mst-gov-vn",
      sourceUrl: "https://mst.gov.vn/tin-a",
      title: "Một tiêu đề được chỉnh khác",
    });

    expect(first.workflowStatus).toBe("pending");
    expect(findProbableDuplicate(second, [first])).toEqual(first);
  });

  it("does not permit publishing before approval", () => {
    expect(canTransitionNewsReviewStatus("pending", "published")).toBe(false);
    expect(canTransitionNewsReviewStatus("approved", "published")).toBe(true);
    expect(canTransitionNewsReviewStatus("published", "editing")).toBe(false);
  });

  it("keeps all default external sources behind editorial review", () => {
    expect(DEFAULT_NEWS_SOURCES.length).toBeGreaterThan(0);
    expect(DEFAULT_NEWS_SOURCES.every((source) => source.requiresEditorialReview)).toBe(true);
    expect(getNewsWorkflowPolicy().autoPublish).toBe(false);
  });
});
