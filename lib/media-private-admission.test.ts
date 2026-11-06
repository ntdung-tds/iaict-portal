import { describe, expect, it } from "vitest";
import { planPrivateMediaAdmission } from "./media-private-admission";
import { MEDIA_POLICY } from "./media-policy";

const goodUuid = "7bc91f5e-2bb5-4890-8d12-23456789a0bc";
const uuid = () => goodUuid;
const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0]);
const file = (overrides: Record<string, unknown> = {}) => ({
  filename: "ảnh sản phẩm.PNG",
  declaredMimeType: "image/png",
  bytes: png,
  ...overrides,
});
const actor = (overrides: Record<string, unknown> = {}) => ({
  id: "editor-1", scopeId: "cms-main", roles: ["editor"],
  ...overrides,
});
const admit = (input: unknown = file(), currentActor: unknown = actor(), scope: unknown = "cms-main", generate = uuid) =>
  planPrivateMediaAdmission(input, currentActor, scope, generate);

describe("Media policy admission composition — offline private quarantine only", () => {
  it("allows only explicitly approved CMS upload roles to plan private quarantine", () => {
    for (const role of ["admin", "editor"]) {
      expect(admit(file(), actor({ roles: [role] }))).toEqual({
        ok: true,
        state: "QUARANTINED",
        publicServingAllowed: false,
        scannerPending: true,
        key: "quarantine/v2/cms-main/" + goodUuid,
        mimeType: "image/png",
        displayFilename: "ảnh sản phẩm.PNG",
        bytes: 11,
        policyId: MEDIA_POLICY.id,
      });
    }
  });

  it("rejects all CMS viewer/reviewer and news-only roles before generating a key", () => {
    for (const role of ["viewer", "reviewer", "news_admin", "news_editor", "news_reviewer"]) {
      let generated = 0;
      expect(admit(file(), actor({ roles: [role] }), "cms-main", () => { generated++; return goodUuid; }))
        .toEqual({ ok: false, code: "ROLE_DENIED" });
      expect(generated).toBe(0);
    }
  });

  it("rejects cross-scope and unrecognized scopes before reading untrusted body", () => {
    let getters = 0;
    const malicious = { get filename() { getters++; throw Error("should not read"); } };
    expect(admit(malicious, actor(), "cms-other")).toEqual({ ok: false, code: "SCOPE_DENIED" });
    expect(admit(malicious, actor(), "../../escape")).toEqual({ ok: false, code: "INVALID_SCOPE" });
    expect(getters).toBe(0);
  });

  it("rejects false content claims and blocked formats, not just filename suffix", () => {
    expect(admit(file({ filename: "evil.svg" }))).toEqual({ ok: false, code: "UNSUPPORTED_EXTENSION" });
    expect(admit(file({ filename: "a.png", declaredMimeType: "image/jpeg" })))
      .toEqual({ ok: false, code: "MIME_EXTENSION_MISMATCH" });
    expect(admit(file({ filename: "a.png", bytes: Uint8Array.from([0xff, 0xd8, 0xff]) })))
      .toEqual({ ok: false, code: "SIGNATURE_MISMATCH" });
  });

  it("rejects oversize, declared-size lies and untrusted paths", () => {
    expect(admit(file({ bytes: new Uint8Array(MEDIA_POLICY.file.maxBytes + 1) })))
      .toEqual({ ok: false, code: "TOO_LARGE" });
    expect(admit(file({ declaredSize: 2 })))
      .toEqual({ ok: false, code: "DECLARED_SIZE_MISMATCH" });
    expect(admit(file({ filename: "../secret.png" })))
      .toEqual({ ok: false, code: "INVALID_FILENAME" });
  });

  it("requires valid cryptographic v4 UUID and never accepts an object key from user", () => {
    expect(admit(file({ storageKey: "public/admin.png" }), actor(), "cms-main", uuid)).toMatchObject({
      ok: true, key: "quarantine/v2/cms-main/" + goodUuid,
    });
    expect(admit(file(), actor(), "cms-main", () => "public/evil")).toEqual({
      ok: false, code: "INVALID_KEY_GENERATOR",
    });
    expect(admit(file(), actor(), "cms-main", () => { throw Error("entropy unavailable"); })).toEqual({
      ok: false, code: "INVALID_KEY_GENERATOR",
    });
  });

  it("handles Proxy throwing actor getters without revealing file content", () => {
    const revoked = Proxy.revocable(actor(), {}); revoked.revoke();
    expect(admit(file(), revoked.proxy)).toEqual({ ok: false, code: "INVALID_ACTOR" });
    expect(admit(file(), { get id() { throw Error("synthetic"); } }))
      .toEqual({ ok: false, code: "INVALID_ACTOR" });
  });

  it("never includes a URL, safe-image verdict, publication status or scan result in an admission plan", () => {
    const result = admit();
    expect(result.ok).toBe(true);
    expect("publicUrl" in result).toBe(false);
    expect("approved" in result).toBe(false);
    expect("scanVerdict" in result).toBe(false);
  });
});
