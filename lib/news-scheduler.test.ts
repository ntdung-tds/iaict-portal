import { describe, expect, it } from "vitest";
import { buildNewsSchedulerKey, computeNextNewsSchedule } from "./news-scheduler";

describe("V16 newsroom scheduler", () => {
  it("builds an idempotent key at minute precision", () => {
    const first = buildNewsSchedulerKey("*/15 * * * *", Date.parse("2026-10-15T03:17:42.100Z"));
    const second = buildNewsSchedulerKey("*/15 * * * *", Date.parse("2026-10-15T03:17:59.999Z"));
    expect(first).toBe("*/15 * * * *:2026-10-15T03:17:00.000Z");
    expect(second).toBe(first);
  });

  it("computes the next source execution in UTC", () => {
    expect(computeNextNewsSchedule("2026-10-15T03:15:00.000Z", 30)).toBe(
      "2026-10-15T03:45:00.000Z",
    );
  });

  it("rejects invalid scheduler intervals and times", () => {
    expect(() => computeNextNewsSchedule("invalid", 30)).toThrow("INVALID_SCHEDULER_TIME");
    expect(() => computeNextNewsSchedule("2026-10-15T03:15:00.000Z", 0)).toThrow(
      "INVALID_SCHEDULE_INTERVAL",
    );
    expect(() => buildNewsSchedulerKey("*/15 * * * *", Number.NaN)).toThrow(
      "INVALID_SCHEDULED_TIME",
    );
  });
});
