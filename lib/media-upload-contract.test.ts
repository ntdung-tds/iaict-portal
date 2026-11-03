import { describe, expect, it } from "vitest";
import {
  newMediaQuarantineKey,
  validateMediaUploadPreflight,
  type MediaUploadPolicy,
} from "./media-upload-contract";

// All limits/types here are synthetic fixture values. No live policy is approved.
const fixturePolicy: MediaUploadPolicy = {
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 64,
};
const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const webp = Uint8Array.from([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80, 1]);
const candidate = (filename: unknown = "ảnh thử nghiệm.png", declaredMimeType: unknown = "image/png", bytes: unknown = png) =>
  ({ filename, declaredMimeType, bytes });
const fail = (data: unknown, code: string, policy: unknown = fixturePolicy) =>
  expect(validateMediaUploadPreflight(data, policy)).toEqual({ ok: false, code });

describe("CMS-MEDIA-013: isolated MIME/extension/signature preflight", () => {
  it("accepts matching JPEG PNG and WebP *signatures* with explicitly injected fixture policy", () => {
    expect(validateMediaUploadPreflight(candidate("photo.JPG", "IMAGE/JPEG", jpeg), fixturePolicy)).toEqual({
      ok: true, displayFilename: "photo.JPG", mimeType: "image/jpeg", byteLength: jpeg.length,
    });
    expect(validateMediaUploadPreflight(candidate("ảnh thử nghiệm.png", "image/png", png), fixturePolicy)).toMatchObject({ ok: true, mimeType: "image/png" });
    expect(validateMediaUploadPreflight(candidate("image.webp", "image/webp", webp), fixturePolicy)).toMatchObject({ ok: true, mimeType: "image/webp" });
  });

  it("rejects extension MIME and magic-byte mismatches regardless of header claims", () => {
    fail(candidate("photo.svg", "image/png", png), "UNSUPPORTED_EXTENSION");
    fail(candidate("file.exe", "image/png", png), "UNSUPPORTED_EXTENSION");
    fail(candidate("photo.jpg", "image/png", png), "MIME_EXTENSION_MISMATCH");
    fail(candidate("photo.png", "image/jpeg", png), "MIME_EXTENSION_MISMATCH");
    fail(candidate("photo.png", "image/png", jpeg), "SIGNATURE_MISMATCH");
    fail(candidate("photo.jpeg", "image/jpeg", png), "SIGNATURE_MISMATCH");
    fail(candidate("photo.webp", "image/webp", png), "SIGNATURE_MISMATCH");
    fail(candidate("photo.png", "image/png", new Uint8Array([60, 115, 99, 114, 105, 112, 116])), "SIGNATURE_MISMATCH");
    fail(candidate("photo.png", "image/png;charset=utf-8", png), "UNSUPPORTED_MIME");
    fail(candidate("photo.png", "image/svg+xml", png), "UNSUPPORTED_MIME");
    fail(candidate("photo.png", 1, png), "UNSUPPORTED_MIME");
  });

  it("honors an explicitly narrower policy without inferring live format approvals", () => {
    fail(candidate("portrait.jpg", "image/jpeg", jpeg), "UNSUPPORTED_MIME", {
      allowedMimeTypes: ["image/png"], maxBytes: 64,
    });
    fail(candidate("portrait.webp", "image/webp", webp), "UNSUPPORTED_MIME", {
      allowedMimeTypes: ["image/jpeg"], maxBytes: 64,
    });
  });
});

describe("CMS-MEDIA-014: safe display filenames and opaque quarantine keys", () => {
  it("rejects traversal paths ambiguous encodings controls and dangerous compound suffixes", () => {
    for (const filename of [
      "../photo.png", "a\\photo.png", "/tmp/photo.png", "photo%2fsecret.png", "photo%252fsecret.png",
      "a..png", ".hidden.png", "photo.png.", " file.png", "file.png ", "CON.png",
      "index.html.png", "evil.svg.png", "script.js.jpg", "sample.pdf.webp",
      "photo\u0000.png", "photo\u202e.png", "photo\uff0fsecret.png", "photo#1.png", "🚀.png", "x".repeat(181) + ".png",
    ]) fail(candidate(filename, "image/png", png), "INVALID_FILENAME");
  });

  it("keeps Unicode display names while the object key is generated independently", () => {
    expect(validateMediaUploadPreflight(candidate("ảnh đại diện 2026.PNG", "image/png", png), fixturePolicy)).toMatchObject({
      ok: true, displayFilename: "ảnh đại diện 2026.PNG",
    });
    expect(newMediaQuarantineKey(() => "123e4567-e89b-42d3-a456-426614174000"))
      .toBe("quarantine/v1/123e4567-e89b-42d3-a456-426614174000");
    expect(newMediaQuarantineKey()).toMatch(/^quarantine\/v1\/[a-f0-9-]{36}$/);
  });

  it("never uses caller-selected keys or unsafe ID generator outputs", () => {
    for (const id of ["../escape", "../../public/file", "bad", "", "123e4567-e89b-12d3-a456-426614174000", "123E4567-E89B-42D3-A456-426614174000"]) {
      expect(() => newMediaQuarantineKey(() => id)).toThrow("INVALID_MEDIA_KEY_UUID");
    }
  });
});

describe("CMS-MEDIA-015: mandatory policy and bounded byte preflight", () => {
  it("fails closed when policy is missing malformed or includes unsupported formats", () => {
    expect(validateMediaUploadPreflight(candidate(), undefined)).toEqual({ ok: false, code: "POLICY_NOT_CONFIGURED" });
    for (const policy of [
      null, {}, { maxBytes: 64 }, { allowedMimeTypes: [], maxBytes: 64 },
      { allowedMimeTypes: ["image/jpeg", "image/jpeg"], maxBytes: 64 },
      { allowedMimeTypes: ["image/png", "image/svg+xml"], maxBytes: 64 },
      { allowedMimeTypes: ["image/png"], maxBytes: 0 },
      { allowedMimeTypes: ["image/png"], maxBytes: -1 },
      { allowedMimeTypes: ["image/png"], maxBytes: 2.2 },
      { allowedMimeTypes: ["image/png"], maxBytes: Number.POSITIVE_INFINITY },
    ]) fail(candidate(), "POLICY_NOT_CONFIGURED", policy);
  });

  it("rejects invalid inputs and empty bytes without reflecting user data in errors", () => {
    for (const bad of [null, "bad", [], 1, {}]) {
      const verdict = validateMediaUploadPreflight(bad, fixturePolicy);
      expect(verdict.ok).toBe(false);
    }
    fail(candidate("photo.png", "image/png", new Uint8Array()), "EMPTY_FILE");
    fail(candidate("photo.png", "image/png", "fake"), "INVALID_INPUT");
    fail(candidate(null, "image/png", png), "INVALID_FILENAME");
  });

  it("checks actual bytes at below equal and over fixture bound; checks claimed byte length", () => {
    const p: MediaUploadPolicy = { allowedMimeTypes: ["image/png"], maxBytes: png.length };
    expect(validateMediaUploadPreflight({ ...candidate(), declaredSize: png.length }, p).ok).toBe(true);
    fail({ ...candidate(), declaredSize: png.length - 1 }, "DECLARED_SIZE_MISMATCH", p);
    fail({ ...candidate(), declaredSize: "9" }, "INVALID_DECLARED_SIZE", p);
    fail({ ...candidate(), declaredSize: -1 }, "INVALID_DECLARED_SIZE", p);
    fail({ ...candidate(), declaredSize: Number.NaN }, "INVALID_DECLARED_SIZE", p);
    fail({ ...candidate(), bytes: Uint8Array.from([...png, 4]) }, "TOO_LARGE", p);
    fail(candidate(), "TOO_LARGE", { allowedMimeTypes: ["image/png"], maxBytes: png.length - 1 });
  });
});


describe("CMS-MEDIA-015: stable policy snapshot (review-loop regression)", () => {
  it("never re-reads a dynamic size getter after validation", () => {
    let reads = 0;
    const changingPolicy = {
      allowedMimeTypes: ["image/png"],
      get maxBytes() {
        reads++;
        return reads === 1 ? png.byteLength - 1 : 1024;
      },
    };
    expect(validateMediaUploadPreflight(candidate(), changingPolicy))
      .toEqual({ ok: false, code: "TOO_LARGE" });
    expect(reads).toBe(1);
  });

  it("never re-reads a dynamic MIME allowlist getter after validation", () => {
    let reads = 0;
    const changingPolicy = {
      maxBytes: 64,
      get allowedMimeTypes() {
        reads++;
        return reads <= 3 ? ["image/png"] : ["image/jpeg"];
      },
    };
    expect(validateMediaUploadPreflight(candidate("spoof.jpg", "image/jpeg", jpeg), changingPolicy))
      .toEqual({ ok: false, code: "UNSUPPORTED_MIME" });
    expect(reads).toBe(1);
  });

  it("rejects a policy getter that throws, without surfacing the exception", () => {
    const throwingPolicy = {
      allowedMimeTypes: ["image/png"],
      get maxBytes(): number {
        throw new Error("untrusted policy read");
      },
    };
    expect(validateMediaUploadPreflight(candidate(), throwingPolicy))
      .toEqual({ ok: false, code: "POLICY_NOT_CONFIGURED" });
  });
});


describe("CMS-MEDIA-015: snapshot untrusted upload candidate (independent review)", () => {
  it("returns INVALID_INPUT when reading a filename getter throws", () => {
    const input = {
      get filename(): string {
        throw new Error("synthetic malicious accessor");
      },
      declaredMimeType: "image/png",
      bytes: png,
    };
    expect(validateMediaUploadPreflight(input, fixturePolicy)).toEqual({ ok: false, code: "INVALID_INPUT" });
  });

  it("reads the declared MIME only once, even for a changing getter", () => {
    let reads = 0;
    const input = {
      filename: "photo.png",
      get declaredMimeType(): unknown {
        reads++;
        return reads === 1 ? "image/png" : undefined;
      },
      bytes: png,
    };
    expect(validateMediaUploadPreflight(input, fixturePolicy)).toMatchObject({ ok: true });
    expect(reads).toBe(1);
  });

  it("reads actual bytes and claimed byte length once per preflight", () => {
    let bytesReads = 0;
    let sizeReads = 0;
    const input = {
      filename: "photo.png",
      declaredMimeType: "image/png",
      get bytes() {
        bytesReads++;
        return bytesReads === 1 ? png : new Uint8Array();
      },
      get declaredSize() {
        sizeReads++;
        return sizeReads === 1 ? png.byteLength : 1024;
      },
    };
    expect(validateMediaUploadPreflight(input, fixturePolicy)).toMatchObject({ ok: true });
    expect(bytesReads).toBe(1);
    expect(sizeReads).toBe(1);
  });
});


describe("CMS-MEDIA-015: native typed-array byte length (third review pass)", () => {
  it("cannot bypass maxBytes with an overridden Uint8Array subclass getter", () => {
    class SpoofedBytes extends Uint8Array {
      get byteLength(): number { return 1; }
      get length(): number { return 8; }
    }
    const huge = new SpoofedBytes(100);
    huge.set(png.subarray(0, 8));
    expect(validateMediaUploadPreflight(candidate("image.png", "image/png", huge), fixturePolicy))
      .toEqual({ ok: false, code: "TOO_LARGE" });
  });

  it("returns INVALID_INPUT for a Proxy wrapping a typed array", () => {
    const proxy = new Proxy(png, {});
    expect(validateMediaUploadPreflight(candidate("image.png", "image/png", proxy), fixturePolicy))
      .toEqual({ ok: false, code: "INVALID_INPUT" });
  });
});
