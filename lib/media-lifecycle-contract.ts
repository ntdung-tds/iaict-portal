/**
 * Draft CMS Media state transition planner (B3.3).
 *
 * This PURE helper has no caller, no IAM authorization, no scanner proof, no
 * persistent compare-and-swap, no R2 reads/writes, and no public delivery gate.
 * Callers MUST verify an authenticated role, owner/scope, scan attestation and
 * review decision; then commit with atomic D1 state+revision CAS and audit.
 * A returned ok:true NEVER authorizes serving an object.
 */
export const MEDIA_LIFECYCLE_STATES = [
  "QUARANTINED",
  "SCAN_PENDING",
  "SCAN_PASSED",
  "REVIEW_APPROVED",
  "AVAILABLE",
  "SCAN_FAILED",
  "REJECTED",
  "REVOKED",
  "DELETED",
] as const;

export type MediaLifecycleState = (typeof MEDIA_LIFECYCLE_STATES)[number];

const NEXT: Record<MediaLifecycleState, readonly MediaLifecycleState[]> = {
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

export type MediaTransitionRejection =
  | "INVALID_TRANSITION_INPUT"
  | "UNKNOWN_STATE"
  | "INVALID_REVISION"
  | "DISALLOWED_TRANSITION";

export type MediaTransitionPlan =
  | Readonly<{
      ok: true;
      from: MediaLifecycleState;
      to: MediaLifecycleState;
      expectedRevision: number;
      nextRevision: number;
    }>
  | Readonly<{ ok: false; code: MediaTransitionRejection }>;

function isState(value: unknown): value is MediaLifecycleState {
  return typeof value === "string" &&
    (MEDIA_LIFECYCLE_STATES as readonly string[]).includes(value);
}

/**
 * Checks only graph validity and forms a proposed CAS revision pair.
 * A malicious accessor is read once, and failure rejects without throwing.
 * The database, not this object, must atomically arbitrate stale writes.
 */
export function planMediaTransition(input: unknown): MediaTransitionPlan {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, code: "INVALID_TRANSITION_INPUT" };
  }
  let from: unknown;
  let to: unknown;
  let expectedRevision: unknown;
  try {
    const candidate = input as Record<string, unknown>;
    from = candidate.from;
    to = candidate.to;
    expectedRevision = candidate.expectedRevision;
  } catch {
    return { ok: false, code: "INVALID_TRANSITION_INPUT" };
  }
  if (!isState(from) || !isState(to)) return { ok: false, code: "UNKNOWN_STATE" };
  if (typeof expectedRevision !== "number" ||
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 0 ||
      expectedRevision >= Number.MAX_SAFE_INTEGER) {
    return { ok: false, code: "INVALID_REVISION" };
  }
  if (!NEXT[from].includes(to)) return { ok: false, code: "DISALLOWED_TRANSITION" };
  return { ok: true, from, to, expectedRevision, nextRevision: expectedRevision + 1 };
}
