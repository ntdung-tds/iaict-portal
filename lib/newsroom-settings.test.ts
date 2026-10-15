import { describe, expect, it } from "vitest";
import { validateNewsroomSettings } from "./newsroom-settings";

describe("V16 newsroom settings", () => {
  it("keeps auto publish disabled by default", () => {
    const settings = validateNewsroomSettings({});
    expect(settings.autoPublishEnabled).toBe(false);
    expect(settings.autoPublishMinTrust).toBe("official");
    expect(settings.autoPublishMaxPerRun).toBe(10);
    expect(settings.requireAttribution).toBe(true);
  });

  it("accepts a controlled auto-publish configuration", () => {
    expect(validateNewsroomSettings({
      autoPublishEnabled: true,
      autoPublishMinTrust: "verified",
      autoPublishMaxPerRun: 20,
      requireAttribution: true,
      requireSourcePublishedAt: true,
    })).toEqual({
      autoPublishEnabled: true,
      autoPublishMinTrust: "verified",
      autoPublishMaxPerRun: 20,
      requireAttribution: true,
      requireSourcePublishedAt: true,
    });
  });

  it("rejects invalid trust thresholds and unsafe per-run caps", () => {
    expect(() => validateNewsroomSettings({
      autoPublishMinTrust: "unknown" as "official",
    })).toThrow("INVALID_AUTO_PUBLISH_TRUST_LEVEL");
    expect(() => validateNewsroomSettings({ autoPublishMaxPerRun: 0 })).toThrow(
      "INVALID_AUTO_PUBLISH_CAP",
    );
    expect(() => validateNewsroomSettings({ autoPublishMaxPerRun: 101 })).toThrow(
      "INVALID_AUTO_PUBLISH_CAP",
    );
  });
});
