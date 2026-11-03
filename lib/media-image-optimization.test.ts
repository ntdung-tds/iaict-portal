import { describe, expect, it } from "vitest";
import {
  MEDIA_IMAGE_OPTIMIZATION,
  planImageOptimization,
} from "./media-image-optimization";

const image = (patch: Record<string, unknown> = {}) => ({
  mimeType: "image/jpeg",
  width: 4000,
  height: 3000,
  frameCount: 1,
  originalBytes: 3_000_000,
  ...patch,
});

describe("B3.6 image optimization: trusted-decode output plan only", () => {
  it("chooses 1920px display and 480px thumbnail without upscaling", () => {
    expect(MEDIA_IMAGE_OPTIMIZATION).toMatchObject({
      displayMaxEdge: 1920, thumbnailMaxEdge: 480,
      jpegQuality: 0.82, webpQuality: 0.80,
      neverUpscale: true, stripAllMetadata: true,
      neverServeOriginal: true, requiresCleanScan: true,
    });
    const result = planImageOptimization(image());
    expect(result).toEqual({
      ok: true,
      profileId: "IAICT-IMAGE-OPT-V1",
      display: { width: 1920, height: 1440, mimeType: "image/jpeg", encoding: "lossy", quality: 0.82 },
      thumbnail: { width: 480, height: 360, mimeType: "image/jpeg", encoding: "lossy", quality: 0.82 },
      metadataAction: "strip-all",
      orientationAction: "normalize-after-trusted-decode",
      animatedAllowed: false,
      needsTrustedDecode: true,
      requiresScanner: true,
      originalCanBeServed: false,
      outputsContainCompressedBytes: false,
    });
  });

  it("keeps a 300x180 small image at original resolution, no fake upscale", () => {
    const r = planImageOptimization(image({ width: 300, height: 180 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.display).toMatchObject({ width: 300, height: 180 });
    expect(r.thumbnail).toMatchObject({ width: 300, height: 180 });
  });

  it("preserves portrait orientation and variant aspect ratio", () => {
    const r = planImageOptimization(image({ width: 1000, height: 5000 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.display).toMatchObject({ width: 384, height: 1920 });
    expect(r.thumbnail).toMatchObject({ width: 96, height: 480 });
  });

  it("keeps PNG lossless and WebP lossy independently of JPEG policy", () => {
    const png = planImageOptimization(image({ mimeType: "image/png" }));
    const webp = planImageOptimization(image({ mimeType: "image/webp" }));
    expect(png.ok).toBe(true);
    expect(webp.ok).toBe(true);
    if (!png.ok || !webp.ok) return;
    expect(png.display).toMatchObject({ mimeType: "image/png", encoding: "lossless", quality: null });
    expect(webp.display).toMatchObject({ mimeType: "image/webp", encoding: "lossy", quality: 0.8 });
  });

  it("rejects unapproved files, animation and unsupported dimensions", () => {
    expect(planImageOptimization(image({ mimeType: "image/svg+xml" }))).toEqual({ ok: false, code: "UNSUPPORTED_IMAGE" });
    expect(planImageOptimization(image({ mimeType: "application/pdf" }))).toEqual({ ok: false, code: "UNSUPPORTED_IMAGE" });
    expect(planImageOptimization(image({ frameCount: 2 }))).toEqual({ ok: false, code: "ANIMATION_DENIED" });
    expect(planImageOptimization(image({ frameCount: 0 }))).toEqual({ ok: false, code: "INVALID_METADATA" });
    for (const width of [0,-1,3.14,NaN,Infinity,"4000"]) {
      expect(planImageOptimization(image({ width }))).toEqual({ ok: false, code: "INVALID_DIMENSIONS" });
    }
  });

  it("enforces preapproved byte, pixel and dimension caps before encoding", () => {
    for (const patch of [
      { width: 8193, height: 1 },
      { width: 6000, height: 5000 },
      { width: 8192, height: 8192 },
      { originalBytes: 10 * 1024 * 1024 + 1 },
    ]) expect(planImageOptimization(image(patch))).toEqual({ ok: false, code: "IMAGE_TOO_LARGE" });
    expect(planImageOptimization(image({ originalBytes: 0 }))).toEqual({ ok: false, code: "INVALID_METADATA" });
  });

  it("snapshots hostile inputs once and never throws on a revoked proxy", () => {
    const x = Proxy.revocable(image(), {}); x.revoke();
    expect(planImageOptimization(x.proxy)).toEqual({ ok: false, code: "INVALID_METADATA" });
    let reads = 0;
    const hostile = {
      get mimeType() { reads++; throw Error("synthetic"); },
    };
    expect(planImageOptimization(hostile)).toEqual({ ok: false, code: "INVALID_METADATA" });
    expect(reads).toBe(1);
  });
});
