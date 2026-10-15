import { describe, expect, it } from "vitest";
import {
  DEFAULT_NEWS_SOURCES,
  DEFAULT_NEWS_WORKFLOW_SETTINGS,
  buildNewsReviewDraft,
  canTransitionNewsReviewStatus,
  canonicalizeNewsUrl,
  findProbableDuplicate,
  getNewsWorkflowPolicy,
  normalizeNewsTitle,
  resolveNewsPublicationDecision,
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

  it("keeps publish as an approved-only transition in the workflow state machine", () => {
    expect(canTransitionNewsReviewStatus("pending", "published")).toBe(false);
    expect(canTransitionNewsReviewStatus("approved", "published")).toBe(true);
    expect(canTransitionNewsReviewStatus("published", "editing")).toBe(false);
  });

  it("keeps auto-publish disabled by default but available for CMS configuration", () => {
    expect(DEFAULT_NEWS_WORKFLOW_SETTINGS.autoPublishEnabled).toBe(false);
    expect(getNewsWorkflowPolicy().autoPublishAvailable).toBe(true);
    expect(getNewsWorkflowPolicy().autoPublishEnabled).toBe(false);
    expect(DEFAULT_NEWS_SOURCES.every((source) => source.requiresEditorialWorkflow)).toBe(true);
  });

  it("permits policy-driven auto-publish only when the global switch and guardrails pass", () => {
    const source = DEFAULT_NEWS_SOURCES[0];
    const settings = {
      ...DEFAULT_NEWS_WORKFLOW_SETTINGS,
      autoPublishEnabled: true,
    };

    const decision = resolveNewsPublicationDecision(source, settings, {
      isDuplicate: false,
      hasAttribution: true,
      hasValidTitle: true,
      hasValidCanonicalUrl: true,
      hasSourcePublishedAt: true,
    });

    expect(decision).toEqual({ mode: "auto", eligible: true, reasons: [] });
  });

  it("falls back to manual review when a guardrail fails", () => {
    const source = DEFAULT_NEWS_SOURCES[0];
    const settings = {
      ...DEFAULT_NEWS_WORKFLOW_SETTINGS,
      autoPublishEnabled: true,
    };

    const decision = resolveNewsPublicationDecision(source, settings, {
      isDuplicate: true,
      hasAttribution: true,
      hasValidTitle: true,
      hasValidCanonicalUrl: true,
      hasSourcePublishedAt: true,
    });

    expect(decision.eligible).toBe(false);
    expect(decision.mode).toBe("manual");
    expect(decision.reasons).toContain("duplicate-detected");
  });

  it("allows a source to force manual review even when global auto-publish is enabled", () => {
    const source = {
      ...DEFAULT_NEWS_SOURCES[0],
      publicationMode: "manual" as const,
    };
    const settings = {
      ...DEFAULT_NEWS_WORKFLOW_SETTINGS,
      autoPublishEnabled: true,
    };

    const decision = resolveNewsPublicationDecision(source, settings, {
      isDuplicate: false,
      hasAttribution: true,
      hasValidTitle: true,
      hasValidCanonicalUrl: true,
      hasSourcePublishedAt: true,
    });

    expect(decision.eligible).toBe(false);
    expect(decision.reasons).toContain("source-forced-manual");
  });
});
