/**
 * Media image optimization specification — staging B3.6 source only.
 *
 * This returns a deterministic encoder PLAN, not a compressed image, decoder,
 * antivirus scan, trusted dimension proof or permission to serve bytes.
 * A production adapter must fully decode untrusted input in an isolated
 * hardened decoder, inspect orientation/frames/pixels, re-encode and strip ALL
 * metadata, verify integrity and the actual scanner verdict before publication.
 */
import { MEDIA_POLICY } from "./media-policy";

export type ImageVariantSpec = Readonly<{
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  encoding: "lossless" | "lossy";
  quality: number | null;
}>;

export type ImageOptimizationPlan =
  | Readonly<{
      ok: true;
      profileId: "IAICT-IMAGE-OPT-V1";
      display: ImageVariantSpec;
      thumbnail: ImageVariantSpec;
      metadataAction: "strip-all";
      orientationAction: "normalize-after-trusted-decode";
      animatedAllowed: false;
      needsTrustedDecode: true;
      requiresScanner: true;
      originalCanBeServed: false;
      outputsContainCompressedBytes: false;
    }>
  | Readonly<{ ok: false; code:
      | "INVALID_METADATA"
      | "UNSUPPORTED_IMAGE"
      | "INVALID_DIMENSIONS"
      | "IMAGE_TOO_LARGE"
      | "ANIMATION_DENIED" }>;

export const MEDIA_IMAGE_OPTIMIZATION = Object.freeze({
  profileId: "IAICT-IMAGE-OPT-V1" as const,
  displayMaxEdge: 1920,
  thumbnailMaxEdge: 480,
  jpegQuality: 0.82,
  webpQuality: 0.80,
  pngEncoding: "lossless" as const,
  neverUpscale: true,
  stripAllMetadata: true,
  neverServeOriginal: true,
  requiresTrustedDecoder: true,
  requiresCleanScan: true,
});

function downscale(width: number, height: number, maxEdge: number): Readonly<{ width: number; height: number }> {
  const ratio = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}
function spec(mime: ImageVariantSpec["mimeType"], width: number, height: number, maxEdge: number): ImageVariantSpec {
  const dims = downscale(width, height, maxEdge);
  return Object.freeze({
    ...dims,
    mimeType: mime,
    encoding: mime === "image/png" ? "lossless" as const : "lossy" as const,
    quality: mime === "image/png" ? null :
      mime === "image/webp" ? MEDIA_IMAGE_OPTIMIZATION.webpQuality : MEDIA_IMAGE_OPTIMIZATION.jpegQuality,
  });
}

/** Input metadata MUST come from a trusted decoder after full decode and frame checks. */
export function planImageOptimization(raw: unknown): ImageOptimizationPlan {
  if (raw === null || typeof raw !== "object") return { ok: false, code: "INVALID_METADATA" };
  let mime: unknown, width: unknown, height: unknown, frames: unknown, byteLength: unknown;
  try {
    if (Array.isArray(raw)) return { ok: false, code: "INVALID_METADATA" };
    const d = raw as Record<string, unknown>;
    mime = d.mimeType;
    width = d.width;
    height = d.height;
    frames = d.frameCount;
    byteLength = d.originalBytes;
  } catch { return { ok: false, code: "INVALID_METADATA" }; }
  if (typeof mime !== "string" ||
      !MEDIA_POLICY.file.mimeTypes.some(x => x === mime)) {
    return { ok: false, code: "UNSUPPORTED_IMAGE" };
  }
  if (typeof frames !== "number" || !Number.isSafeInteger(frames) || frames < 1) {
    return { ok: false, code: "INVALID_METADATA" };
  }
  if (frames !== 1) return { ok: false, code: "ANIMATION_DENIED" };
  if (typeof width !== "number" || typeof height !== "number" ||
      !Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1) {
    return { ok: false, code: "INVALID_DIMENSIONS" };
  }
  if (typeof byteLength !== "number" || !Number.isSafeInteger(byteLength) || byteLength < 1) {
    return { ok: false, code: "INVALID_METADATA" };
  }
  if (byteLength > MEDIA_POLICY.file.maxBytes ||
      width > MEDIA_POLICY.file.maxDimension ||
      height > MEDIA_POLICY.file.maxDimension ||
      width * height > MEDIA_POLICY.file.maxPixels) {
    return { ok: false, code: "IMAGE_TOO_LARGE" };
  }
  const kind = mime as ImageVariantSpec["mimeType"];
  return {
    ok: true,
    profileId: MEDIA_IMAGE_OPTIMIZATION.profileId,
    display: spec(kind, width, height, MEDIA_IMAGE_OPTIMIZATION.displayMaxEdge),
    thumbnail: spec(kind, width, height, MEDIA_IMAGE_OPTIMIZATION.thumbnailMaxEdge),
    metadataAction: "strip-all",
    orientationAction: "normalize-after-trusted-decode",
    animatedAllowed: false,
    needsTrustedDecode: true,
    requiresScanner: true,
    originalCanBeServed: false,
    outputsContainCompressedBytes: false,
  };
}
