/**
 * IAICT Media R2 Owner-delegated decision (2026-11-04), staging-first.
 *
 * This is an explicit, approved PRODUCT POLICY, not proof of enforcement.
 * Production is intentionally NOT enabled. Every API, scanning service,
 * D1 transaction, decoder, R2 adapter and CDN must enforce separately.
 * Failing to obtain a trustworthy scan verdict always prohibits publishing.
 */
export const MEDIA_POLICY_ID = "IAICT-MEDIA-20261104-V1" as const;

export const MEDIA_POLICY = Object.freeze({
  id: MEDIA_POLICY_ID,
  environment: "staging" as const,
  file: Object.freeze({
    mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
    maxBytes: 10 * 1024 * 1024, // 10 MiB; bytes, not MB
    maxPixels: 25_000_000,
    maxDimension: 8192,
    maxChunks: 4096,
    receiveDeadlineMs: 30_000,
    allowAnimated: false,
    allowSvg: false,
    allowPdf: false,
  }),
  limits: Object.freeze({
    uploadsPerActorHour: 20,
    uploadsPerScopeDay: 200,
    bytesPerScopeDay: 1024 * 1024 * 1024, // 1 GiB
    storedBytesPerScope: 5 * 1024 * 1024 * 1024, // 5 GiB
    inFlightPerActor: 2,
  }),
  retention: Object.freeze({
    pendingReservationHours: 1,
    quarantineDays: 7,
    rejectedOrScanFailedDays: 2,
    revokedPurgeHours: 24,
    tombstoneDays: 90,
    orphanGraceHours: 24,
  }),
  scan: Object.freeze({
    required: true,
    decoderReencodeRequired: true,
    metadataStripRequired: true,
    failClosed: true,
    engine: "isolated-clamav-compatible" as const,
    attestationMaxAgeMs: 15 * 60 * 1000,
    serviceConfigured: false, // no scanner credentials/attestation integration exists yet
  }),
  storage: Object.freeze({
    privateR2: true,
    directR2PublicAccess: false,
    serveOriginal: false,
    serveApprovedDerivativeOnly: true,
    requireD1Cas: true,
    requireAudit: true,
    requireScopeOwnership: true,
  }),
} as const);

export type MediaPolicyAction =
  | "upload"
  | "review"
  | "publish"
  | "read-metadata"
  | "read-approved-bytes"
  | "revoke"
  | "delete";

export type MediaPolicyRole = "admin" | "editor" | "reviewer" | "viewer";

export type MediaPolicyContext = Readonly<{
  actorId: unknown;
  actorScopeId: unknown;
  roles: unknown;
  /** Scope and uploader id are mandatory for existing-asset actions. */
  assetScopeId?: unknown;
  uploaderId?: unknown;
  status?: unknown;
  /**
   * Only the back end may set this true after authenticated scanner service,
   * decoded/re-encoded content, and matching attestation are checked against D1.
   * It is NOT accepted as a client field or sufficient security proof on its own.
   */
  verifiedScanAndDerivative?: unknown;
}>;

export type MediaPolicyAuthorization =
  | Readonly<{ allowed: true; requiresAudit: true }>
  | Readonly<{ allowed: false; code:
      | "INVALID_CONTEXT"
      | "SCOPE_DENIED"
      | "ROLE_DENIED"
      | "STATE_DENIED"
      | "UNVERIFIED_SCAN" }>;

const ACTION_ROLES: Record<MediaPolicyAction, readonly MediaPolicyRole[]> = {
  upload: ["admin", "editor"],
  review: ["admin", "reviewer"],
  publish: ["admin"],
  "read-metadata": ["admin", "editor", "reviewer", "viewer"],
  "read-approved-bytes": ["admin", "editor", "reviewer", "viewer"],
  revoke: ["admin"],
  delete: ["admin"],
};

function invalidId(value: unknown): boolean {
  return typeof value !== "string" || value.length === 0 ||
    value.length > 128 || !/^[A-Za-z0-9_-]+$/.test(value);
}
function deny(code: Exclude<MediaPolicyAuthorization, {allowed:true}>["code"]): MediaPolicyAuthorization {
  return { allowed: false, code };
}

/**
 * Single bounded role/scope/state policy matrix. This plan is NOT authentication.
 * Call only AFTER fresh D1 identity/role lookup and verified scope membership;
 * never pass a client-controlled actor, asset scope, scan assertion or status.
 */
export function evaluateMediaPolicyAction(action: unknown, raw: unknown): MediaPolicyAuthorization {
  if (typeof action !== "string" || !Object.hasOwn(ACTION_ROLES, action)) return deny("INVALID_CONTEXT");
  if (raw === null || typeof raw !== "object") return deny("INVALID_CONTEXT");
  let actorId: unknown, actorScopeId: unknown, roles: unknown;
  let assetScopeId: unknown, uploaderId: unknown, status: unknown, verified: unknown;
  try {
    if (Array.isArray(raw)) return deny("INVALID_CONTEXT");
    const ctx = raw as MediaPolicyContext;
    actorId = ctx.actorId;
    actorScopeId = ctx.actorScopeId;
    roles = ctx.roles;
    assetScopeId = ctx.assetScopeId;
    uploaderId = ctx.uploaderId;
    status = ctx.status;
    verified = ctx.verifiedScanAndDerivative;
  } catch { return deny("INVALID_CONTEXT"); }
  if (invalidId(actorId) || invalidId(actorScopeId) || !Array.isArray(roles) ||
      roles.length === 0 || roles.length > 16) return deny("INVALID_CONTEXT");
  let permitted = false;
  try {
    for (const role of roles) {
      if (typeof role !== "string" || role.length > 40) return deny("INVALID_CONTEXT");
      if (ACTION_ROLES[action as MediaPolicyAction].includes(role as MediaPolicyRole)) permitted = true;
    }
  } catch { return deny("INVALID_CONTEXT"); }
  if (!permitted) return deny("ROLE_DENIED");
  if (action === "upload") return { allowed: true, requiresAudit: true };

  if (invalidId(assetScopeId) || invalidId(uploaderId)) return deny("INVALID_CONTEXT");
  if (actorScopeId !== assetScopeId) return deny("SCOPE_DENIED");
  if (typeof status !== "string") return deny("INVALID_CONTEXT");

  switch (action) {
    case "read-metadata":
      // Viewer can only see approved metadata; editor can inspect own drafts;
      // admin/reviewer can inspect scoped records but never receive raw bytes.
      if (status === "AVAILABLE" ||
          (roles.includes("admin") || roles.includes("reviewer")) && status !== "DELETED" ||
          (roles.includes("editor") && actorId === uploaderId && status !== "DELETED")) {
        return { allowed: true, requiresAudit: true };
      }
      return deny("STATE_DENIED");
    case "review":
      return status === "SCAN_PASSED" ? { allowed: true, requiresAudit: true } : deny("STATE_DENIED");
    case "publish":
      if (verified !== true) return deny("UNVERIFIED_SCAN");
      return status === "REVIEW_APPROVED" ? { allowed: true, requiresAudit: true } : deny("STATE_DENIED");
    case "read-approved-bytes":
      if (verified !== true) return deny("UNVERIFIED_SCAN");
      return status === "AVAILABLE" ? { allowed: true, requiresAudit: true } : deny("STATE_DENIED");
    case "revoke":
      return status === "AVAILABLE" || status === "REVIEW_APPROVED"
        ? { allowed: true, requiresAudit: true } : deny("STATE_DENIED");
    case "delete":
      return status === "REJECTED" || status === "SCAN_FAILED" || status === "REVOKED" || status === "QUARANTINED" || status === "SCAN_PASSED"
        ? { allowed: true, requiresAudit: true } : deny("STATE_DENIED");
    default:
      return deny("INVALID_CONTEXT");
  }
}

/** Gate for any future serving/publish adapter, including admin and public. */
export function mediaCanBecomePublic(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  try {
    const source = value as { status?: unknown; trustedScanner?: unknown; trustedDerivative?: unknown; revoked?: unknown };
    const status = source.status;
    const trustedScanner = source.trustedScanner;
    const trustedDerivative = source.trustedDerivative;
    const revoked = source.revoked;
    return status === "AVAILABLE" && trustedScanner === true && trustedDerivative === true && revoked === false;
  } catch { return false; }
}
