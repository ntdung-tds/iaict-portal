import { describe, expect, it } from "vitest";
import { MEDIA_LIFECYCLE_STATES, planMediaTransition } from "./media-lifecycle-contract";

/** B3.3 source-only fixture tests: NOT the hosted CMS-MEDIA-006..012 E2E. */
const transition = (from: unknown, to: unknown, expectedRevision: unknown = 0) =>
  planMediaTransition({ from, to, expectedRevision });
const allowed: Record<string, readonly string[]> = {
  QUARANTINED: ["SCAN_PENDING", "REJECTED", "DELETED"],
  SCAN_PENDING: ["SCAN_PASSED", "SCAN_FAILED", "REJECTED"],
  SCAN_PASSED: ["REVIEW_APPROVED", "REJECTED", "DELETED"],
  REVIEW_APPROVED: ["AVAILABLE", "REVOKED"],
  AVAILABLE: ["REVOKED"],
  SCAN_FAILED: ["DELETED"],
  REJECTED: ["DELETED"],
  REVOKED: ["DELETED"],
  DELETED: [],
};

describe("Media B3.3 source-only transition graph (future CMS-MEDIA-006/007)", () => {
  it("accepts each explicitly allowed edge and plans monotonic revisions", () => {
    for (const [from, targets] of Object.entries(allowed)) {
      for (const to of targets) {
        expect(transition(from, to, 6)).toEqual({
          ok: true, from, to, expectedRevision: 6, nextRevision: 7,
        });
      }
    }
  });

  it("rejects ALL other edges, including direct publish, reactivation and delete resurrection", () => {
    for (const from of MEDIA_LIFECYCLE_STATES) {
      for (const to of MEDIA_LIFECYCLE_STATES) {
        if (allowed[from].includes(to)) continue;
        expect(transition(from, to)).toEqual({ ok: false, code: "DISALLOWED_TRANSITION" });
      }
    }
  });

  it("requires scan and human review *states* before publication, without claiming proof", () => {
    expect(transition("QUARANTINED", "AVAILABLE")).toEqual({ ok: false, code: "DISALLOWED_TRANSITION" });
    expect(transition("SCAN_PENDING", "AVAILABLE")).toEqual({ ok: false, code: "DISALLOWED_TRANSITION" });
    expect(transition("SCAN_PASSED", "AVAILABLE")).toEqual({ ok: false, code: "DISALLOWED_TRANSITION" });
    expect(transition("SCAN_FAILED", "SCAN_PENDING")).toEqual({ ok: false, code: "DISALLOWED_TRANSITION" });
    expect(transition("REVOKED", "AVAILABLE")).toEqual({ ok: false, code: "DISALLOWED_TRANSITION" });
  });

  it("rejects unrecognized states and does not normalize dangerous inputs", () => {
    for (const from of [null, undefined, 1, "", "available", "AVAILABLE ", "PUBLISHED", "__proto__"]) {
      expect(transition(from, "AVAILABLE")).toEqual({ ok: false, code: "UNKNOWN_STATE" });
    }
    expect(transition("QUARANTINED", "publish")).toEqual({ ok: false, code: "UNKNOWN_STATE" });
  });

  it("requires a monotonic safe nonnegative integer revision", () => {
    for (const revision of [-1, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER, "3", null, undefined]) {
      expect(transition("QUARANTINED", "SCAN_PENDING", revision))
        .toEqual({ ok: false, code: "INVALID_REVISION" });
    }
    expect(transition("QUARANTINED", "SCAN_PENDING", Number.MAX_SAFE_INTEGER - 1)).toEqual({
      ok: true, from: "QUARANTINED", to: "SCAN_PENDING",
      expectedRevision: Number.MAX_SAFE_INTEGER - 1,
      nextRevision: Number.MAX_SAFE_INTEGER,
    });
  });

  it("rejects missing, array, revoked Proxy and throwing-property input without escaping errors", () => {
    for (const input of [null, undefined, [], "x", 4, {}]) {
      expect(planMediaTransition(input).ok).toBe(false);
    }
    const original = Proxy.revocable({ from: "QUARANTINED", to: "SCAN_PENDING", expectedRevision: 0 }, {});
    original.revoke();
    expect(planMediaTransition(original.proxy)).toEqual({ ok: false, code: "INVALID_TRANSITION_INPUT" });
    const throwing = { get from(): string { throw new Error("untrusted getter"); } };
    expect(planMediaTransition(throwing)).toEqual({ ok: false, code: "INVALID_TRANSITION_INPUT" });
  });

  it("snapshots each caller property once (no mutable-accessor reread)", () => {
    let count = 0;
    const input = {
      get from() { count++; return count === 1 ? "QUARANTINED" : "AVAILABLE"; },
      to: "SCAN_PENDING",
      expectedRevision: 4,
    };
    expect(planMediaTransition(input)).toMatchObject({ ok: true, from: "QUARANTINED", nextRevision: 5 });
    expect(count).toBe(1);
  });
});
