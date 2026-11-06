/**
 * Source-only B3.5 admission plan. This composes the approved Media policy,
 * a CMS role/scope decision and the existing MIME/extension/signature preflight.
 *
 * A PASS means "eligible for PRIVATE QUARANTINE review", never safe decoded,
 * scanned, persisted or publicly available. Not wired to Worker, D1 or R2.
 * Future callers must validate the actor against fresh D1, reserve idempotency
 * and quotas atomically, read bounded stream, and verify the scanner/decoder.
 */
import { MEDIA_POLICY, evaluateMediaPolicyAction } from "./media-policy";
import { validateMediaUploadPreflight, type MediaImageMime } from "./media-upload-contract";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ID = /^[A-Za-z0-9_-]{1,128}$/;

export type PrivateMediaAdmission =
  | Readonly<{
      ok: true;
      state: "QUARANTINED";
      publicServingAllowed: false;
      scannerPending: true;
      key: string;
      mimeType: MediaImageMime;
      displayFilename: string;
      bytes: number;
      policyId: typeof MEDIA_POLICY.id;
    }>
  | Readonly<{ ok: false; code: string }>;

function reject(code: string): PrivateMediaAdmission { return { ok: false, code }; }

/**
 * requestedScope must come from an authorized server-side CMS route, not
 * direct user metadata. uuid must be cryptographically generated server-side.
 * Explicitly NOT a D1/R2 write, and does not allocate bytes or perform scans.
 */
export function planPrivateMediaAdmission(
  candidate: unknown,
  actor: unknown,
  requestedScope: unknown,
  uuid: () => string = () => crypto.randomUUID(),
): PrivateMediaAdmission {
  if (typeof requestedScope !== "string" || !ID.test(requestedScope)) return reject("INVALID_SCOPE");
  if (!actor || typeof actor !== "object") return reject("INVALID_ACTOR");
  let id: unknown, scope: unknown, roles: unknown;
  try {
    const a = actor as Record<string, unknown>;
    id = a.id;
    scope = a.scopeId;
    roles = a.roles;
  } catch { return reject("INVALID_ACTOR"); }
  if (scope !== requestedScope) return reject("SCOPE_DENIED");
  const authorization = evaluateMediaPolicyAction("upload", {
    actorId: id, actorScopeId: scope, roles,
  });
  if (!authorization.allowed) return reject(authorization.code);
  const checked = validateMediaUploadPreflight(candidate, {
    allowedMimeTypes: MEDIA_POLICY.file.mimeTypes,
    maxBytes: MEDIA_POLICY.file.maxBytes,
  });
  if (!checked.ok) return reject(checked.code);

  // Key generation must occur *after* all untrusted fields were validated.
  let key: string;
  try {
    const random = uuid();
    if (typeof random !== "string" || !UUID_V4.test(random))
      return reject("INVALID_KEY_GENERATOR");
    key = "quarantine/v2/" + requestedScope + "/" + random;
  } catch { return reject("INVALID_KEY_GENERATOR"); }
  return {
    ok: true, state: "QUARANTINED", publicServingAllowed: false, scannerPending: true,
    key, mimeType: checked.mimeType,
    displayFilename: checked.displayFilename, bytes: checked.byteLength,
    policyId: MEDIA_POLICY.id,
  };
}
