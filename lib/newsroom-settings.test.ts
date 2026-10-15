import { describe, expect, it } from "vitest";
import { validateNewsroomSettings, validateNewsSourceSchedule } from "./newsroom-settings";

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

  it("accepts operational source cadence within safe bounds", () => {
    expect(validateNewsSourceSchedule({
      scheduleEnabled: true,
      scheduleIntervalMinutes: 30,
      scheduleRetryMinutes: 15,
    })).toEqual({
      scheduleEnabled: true,
      scheduleIntervalMinutes: 30,
      scheduleRetryMinutes: 15,
    });
  });

  it("rejects overly frequent or excessive source cadence", () => {
    expect(() => validateNewsSourceSchedule({ scheduleIntervalMinutes: 14 })).toThrow(
      "INVALID_SOURCE_SCHEDULE_INTERVAL",
    );
    expect(() => validateNewsSourceSchedule({ scheduleIntervalMinutes: 1441 })).toThrow(
      "INVALID_SOURCE_SCHEDULE_INTERVAL",
    );
    expect(() => validateNewsSourceSchedule({ scheduleRetryMinutes: 14 })).toThrow(
      "INVALID_SOURCE_SCHEDULE_RETRY",
    );
    expect(() => validateNewsSourceSchedule({ scheduleRetryMinutes: 361 })).toThrow(
      "INVALID_SOURCE_SCHEDULE_RETRY",
    );
  });
});
