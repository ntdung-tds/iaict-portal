import { describe, expect, it } from "vitest";
import { MEDIA_POLICY, MEDIA_POLICY_ID, evaluateMediaPolicyAction, mediaCanBecomePublic } from "./media-policy";

const fixture = {
  actorId: "person-a",
  actorScopeId: "cms-main",
  assetScopeId: "cms-main",
  uploaderId: "person-b",
  roles: ["admin"],
  status: "AVAILABLE",
  verifiedScanAndDerivative: true,
};
const check = (action: string, changes: Record<string, unknown> = {}) =>
  evaluateMediaPolicyAction(action, { ...fixture, ...changes });
const allowed = { allowed: true, requiresAudit: true };

describe("B3.5 Owner-delegated Media policy: approved values, NOT an implemented upload route", () => {
  it("records exact scope, mime, byte/pixel, chunk and deadline limits", () => {
    expect(MEDIA_POLICY_ID).toBe("IAICT-MEDIA-20261104-V1");
    expect(MEDIA_POLICY.environment).toBe("staging");
    expect(MEDIA_POLICY.file.mimeTypes).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(MEDIA_POLICY.file.maxBytes).toBe(10_485_760);
    expect(MEDIA_POLICY.file.maxPixels).toBe(25_000_000);
    expect(MEDIA_POLICY.file.maxDimension).toBe(8192);
    expect(MEDIA_POLICY.file.maxChunks).toBe(4096);
    expect(MEDIA_POLICY.file.receiveDeadlineMs).toBe(30000);
    expect(MEDIA_POLICY.file.allowAnimated).toBe(false);
    expect(MEDIA_POLICY.file.allowSvg).toBe(false);
    expect(MEDIA_POLICY.file.allowPdf).toBe(false);
  });

  it("enforces a bounded operational quota baseline for future DB rate controls", () => {
    expect(MEDIA_POLICY.limits).toEqual({
      uploadsPerActorHour: 20,
      uploadsPerScopeDay: 200,
      bytesPerScopeDay: 1073741824,
      storedBytesPerScope: 5368709120,
      inFlightPerActor: 2,
    });
  });

  it("fail-closes scanning until a real isolated scanner is configured", () => {
    expect(MEDIA_POLICY.scan).toMatchObject({
      required: true, serviceConfigured: false, failClosed: true,
      decoderReencodeRequired: true, metadataStripRequired: true,
      attestationMaxAgeMs: 900000,
    });
    expect(MEDIA_POLICY.storage).toMatchObject({
      privateR2: true, directR2PublicAccess: false,
      serveOriginal: false, serveApprovedDerivativeOnly: true,
      requireD1Cas: true, requireScopeOwnership: true, requireAudit: true,
    });
    expect(MEDIA_POLICY.retention).toEqual({
      pendingReservationHours: 1,
      quarantineDays: 7,
      rejectedOrScanFailedDays: 2,
      revokedPurgeHours: 24,
      tombstoneDays: 90,
      orphanGraceHours: 24,
    });
  });

  it("immutably pins the entire static policy even if a caller mutates allowed types", () => {
    expect(Object.isFrozen(MEDIA_POLICY.file.mimeTypes)).toBe(true);
    expect(Object.isFrozen(MEDIA_POLICY.file)).toBe(true);
    expect(Object.isFrozen(MEDIA_POLICY.scan)).toBe(true);
  });
});

describe("B3.5 CMS-only Media role and scope policy matrix — pure, not auth", () => {
  it("lets only CMS admin and editor upload", () => {
    for (const role of ["admin", "editor"]) {
      expect(check("upload", { roles: [role] })).toEqual(allowed);
    }
    for (const role of ["reviewer", "viewer", "news_admin", "news_editor", "news_reviewer"]) {
      expect(check("upload", { roles: [role] })).toEqual({ allowed: false, code: "ROLE_DENIED" });
    }
  });

  it("permits admin/reviewer review only after a scan-passed state", () => {
    for (const role of ["admin", "reviewer"]) {
      expect(check("review", { roles: [role], status: "SCAN_PASSED" })).toEqual(allowed);
      for (const state of ["QUARANTINED", "SCAN_PENDING", "SCAN_FAILED", "REJECTED", "REVIEW_APPROVED", "AVAILABLE", "DELETED"]) {
        expect(check("review", { roles: [role], status: state })).toEqual({ allowed: false, code: "STATE_DENIED" });
      }
    }
    expect(check("review", { roles: ["editor"], status: "SCAN_PASSED" }))
      .toEqual({ allowed: false, code: "ROLE_DENIED" });
  });

  it("lets only admin publish and only after trusted scan + approval", () => {
    expect(check("publish", { status: "REVIEW_APPROVED" })).toEqual(allowed);
    expect(check("publish", { status: "REVIEW_APPROVED", verifiedScanAndDerivative: false }))
      .toEqual({ allowed: false, code: "UNVERIFIED_SCAN" });
    expect(check("publish", { status: "SCAN_PASSED" })).toEqual({ allowed: false, code: "STATE_DENIED" });
    expect(check("publish", { roles: ["reviewer"], status: "REVIEW_APPROVED" }))
      .toEqual({ allowed: false, code: "ROLE_DENIED" });
  });

  it("requires matching exact asset scope for every existing-asset operation", () => {
    for (const action of ["review", "publish", "read-metadata", "read-approved-bytes", "revoke", "delete"]) {
      expect(check(action, { assetScopeId: "other-scope" }))
        .toEqual({ allowed: false, code: "SCOPE_DENIED" });
    }
  });

  it("enforces approved byte delivery, never raw quarantine even for admin", () => {
    for (const role of ["admin", "editor", "reviewer", "viewer"]) {
      expect(check("read-approved-bytes", { roles: [role], status: "AVAILABLE" })).toEqual(allowed);
      expect(check("read-approved-bytes", { roles: [role], status: "SCAN_PASSED" }))
        .toEqual({ allowed: false, code: "STATE_DENIED" });
      expect(check("read-approved-bytes", { roles: [role], verifiedScanAndDerivative: false }))
        .toEqual({ allowed: false, code: "UNVERIFIED_SCAN" });
    }
  });

  it("limits reviewer/viewer/editor draft metadata access without leaking deleted assets", () => {
    expect(check("read-metadata", { roles: ["viewer"], status: "QUARANTINED" })).toEqual({ allowed: false, code: "STATE_DENIED" });
    expect(check("read-metadata", { roles: ["editor"], actorId: "person-a", uploaderId: "person-b", status: "QUARANTINED" }))
      .toEqual({ allowed: false, code: "STATE_DENIED" });
    expect(check("read-metadata", { roles: ["editor"], actorId: "person-a", uploaderId: "person-a", status: "QUARANTINED" })).toEqual(allowed);
    expect(check("read-metadata", { roles: ["reviewer"], status: "QUARANTINED" })).toEqual(allowed);
    for (const role of ["admin", "editor", "reviewer", "viewer"]) {
      expect(check("read-metadata", { roles: [role], status: "DELETED" }))
        .toEqual({ allowed: false, code: "STATE_DENIED" });
    }
  });

  it("reserves revoke and delete for CMS admin with appropriate state", () => {
    expect(check("revoke", { status: "AVAILABLE" })).toEqual(allowed);
    expect(check("revoke", { status: "QUARANTINED" })).toEqual({ allowed: false, code: "STATE_DENIED" });
    expect(check("delete", { status: "REJECTED" })).toEqual(allowed);
    expect(check("delete", { status: "AVAILABLE" })).toEqual({ allowed: false, code: "STATE_DENIED" });
    expect(check("delete", { roles: ["editor"], status: "REJECTED" }))
      .toEqual({ allowed: false, code: "ROLE_DENIED" });
  });

  it("rejects unknown actions, malicious structures and cross-scope input", () => {
    expect(evaluateMediaPolicyAction("change-owner", fixture)).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
    expect(evaluateMediaPolicyAction("__proto__", fixture)).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
    expect(evaluateMediaPolicyAction("upload", null)).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
    expect(check("upload", { actorId: "" })).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
    expect(check("upload", { roles: [] })).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
    expect(check("upload", { roles: ["admin", null] })).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
    expect(check("upload", { actorScopeId: "../cms" })).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
    const proxy = Proxy.revocable(fixture, {});proxy.revoke();
    expect(evaluateMediaPolicyAction("upload", proxy.proxy)).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
    const badRoles = new Proxy(["admin"], { get() { throw new Error("synthetic getter"); } });
    expect(check("read-metadata", { roles: badRoles })).toEqual({ allowed: false, code: "INVALID_CONTEXT" });
  });

  it("does not accept client-style scanner flags as proof of public availability", () => {
    expect(mediaCanBecomePublic({ status: "AVAILABLE", trustedScanner: true, trustedDerivative: true, revoked: false })).toBe(true);
    for (const fake of [
      {}, null, { status: "SCAN_PASSED", trustedScanner: true, trustedDerivative: true, revoked: false },
      { status: "AVAILABLE", trustedScanner: false, trustedDerivative: true, revoked: false },
      { status: "AVAILABLE", trustedScanner: true, trustedDerivative: false, revoked: false },
      { status: "AVAILABLE", trustedScanner: true, trustedDerivative: true, revoked: true },
    ]) expect(mediaCanBecomePublic(fake)).toBe(false);
  });
});
