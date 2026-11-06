/**
 * Actual local-browser image derivative encoder.
 * Never uploads input or output, never persists to R2/D1 and NEVER grants
 * Media publication. Uses browser image decode + canvas re-encode; it is NOT
 * the trusted isolated server-side scanner/decoder required for CMS publishing.
 */
import { MEDIA_POLICY } from "./media-policy";
import { planImageOptimization, type ImageVariantSpec } from "./media-image-optimization";

export type LocalImageDerivative = Readonly<{
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
  byteLength: number;
}>;

export type LocalImageCompression =
  | Readonly<{
      ok: true;
      profileId: "IAICT-IMAGE-OPT-V1";
      display: LocalImageDerivative;
      thumbnail: LocalImageDerivative;
      originalBytes: number;
      compressedTotalBytes: number;
      uploadPermitted: false;
      publicServingPermitted: false;
    }>
  | Readonly<{ ok: false; code:
      | "INVALID_INPUT"
      | "UNSUPPORTED_IMAGE"
      | "SIGNATURE_MISMATCH"
      | "ANIMATION_DENIED"
      | "IMAGE_TOO_LARGE"
      | "DECODER_UNAVAILABLE"
      | "DECODE_FAILED"
      | "ENCODE_FAILED"
      | "OUTPUT_TOO_LARGE" }>;

const SIZE_GETTER = Object.getOwnPropertyDescriptor(Blob.prototype, "size")?.get;
const TYPE_GETTER = Object.getOwnPropertyDescriptor(Blob.prototype, "type")?.get;

function supportedSignature(type: string, data: Uint8Array): boolean {
  if (type === "image/jpeg") return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (type === "image/png") return data.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((x, i) => data[i] === x);
  if (type === "image/webp") {
    return data.length >= 12 && [82,73,70,70].every((x,i)=>data[i]===x) &&
      [87,69,66,80].every((x,i)=>data[i+8]===x);
  }
  return false;
}

/**
 * Defensive local animation detection for APNG and animated WebP. This
 * is not an authoritative image parser; server still MUST verify all frames.
 */
function looksAnimated(type: string, data: Uint8Array): boolean {
  if (type === "image/webp") {
    if (data.length >= 21 && data[12] === 86 && data[13] === 80 &&
        data[14] === 56 && data[15] === 88 && (data[20] & 0x02) !== 0) return true;
    for (let i = 12; i < data.length - 3; i++) {
      if (data[i] === 65 && data[i + 1] === 78 && data[i + 2] === 73 && data[i + 3] === 77) return true;
    }
  }
  if (type === "image/png") {
    // Parse PNG chunks to find an actual acTL chunk, not coincidental pixel bytes.
    let i = 8;
    while (i + 12 <= data.length) {
      const len = ((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]) >>> 0;
      if (len > data.length - i - 12) break;
      if (data[i + 4] === 97 && data[i + 5] === 99 &&
          data[i + 6] === 84 && data[i + 7] === 76) return true;
      i += 12 + len;
    }
  }
  return false;
}

async function encode(
  image: ImageBitmap, spec: ImageVariantSpec,
): Promise<LocalImageDerivative | null> {
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return null;
  // No original EXIF or GPS is copied by drawing and re-encoding the bitmap.
  context.drawImage(image, 0, 0, spec.width, spec.height);
  const blob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(resolve, spec.mimeType, spec.quality === null ? undefined : spec.quality);
  });
  canvas.width = 0;
  canvas.height = 0;
  if (!blob || blob.type !== spec.mimeType || blob.size === 0 ||
      blob.size > MEDIA_POLICY.file.maxBytes) return null;
  return { blob, width: spec.width, height: spec.height,
    mimeType: spec.mimeType, byteLength: blob.size };
}

export async function compressLocalImage(input: unknown): Promise<LocalImageCompression> {
  let size: number;
  let mime: string;
  try {
    if (!(input instanceof Blob)) return { ok: false, code: "INVALID_INPUT" };
    size = SIZE_GETTER!.call(input);
    mime = TYPE_GETTER!.call(input);
    if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 1)
      return { ok: false, code: "INVALID_INPUT" };
    if (!MEDIA_POLICY.file.mimeTypes.some(x => x === mime)) return { ok: false, code: "UNSUPPORTED_IMAGE" };
    if (size > MEDIA_POLICY.file.maxBytes) return { ok: false, code: "IMAGE_TOO_LARGE" };
  } catch { return { ok: false, code: "INVALID_INPUT" }; }

  // Local file bytes are never transmitted; all checks precede canvas draw.
  let data: Uint8Array;
  try { data = new Uint8Array(await (input as Blob).arrayBuffer()); }
  catch { return { ok: false, code: "INVALID_INPUT" }; }
  if (data.byteLength !== size || !supportedSignature(mime, data))
    return { ok: false, code: "SIGNATURE_MISMATCH" };
  if (looksAnimated(mime, data)) return { ok: false, code: "ANIMATION_DENIED" };
  if (typeof createImageBitmap !== "function" || typeof document === "undefined")
    return { ok: false, code: "DECODER_UNAVAILABLE" };

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(input as Blob, { imageOrientation: "from-image" });
    const profile = planImageOptimization({
      mimeType: mime, width: bitmap.width, height: bitmap.height,
      frameCount: 1, originalBytes: size,
    });
    if (!profile.ok) return {
      ok: false, code: profile.code === "IMAGE_TOO_LARGE" ? "IMAGE_TOO_LARGE" : "DECODE_FAILED",
    };
    const display = await encode(bitmap, profile.display);
    const thumbnail = await encode(bitmap, profile.thumbnail);
    if (!display || !thumbnail) return { ok: false, code: "ENCODE_FAILED" };
    if (display.byteLength + thumbnail.byteLength > 2 * MEDIA_POLICY.file.maxBytes)
      return { ok: false, code: "OUTPUT_TOO_LARGE" };
    return {
      ok: true, profileId: profile.profileId,
      display, thumbnail,
      originalBytes: size,
      compressedTotalBytes: display.byteLength + thumbnail.byteLength,
      uploadPermitted: false,
      publicServingPermitted: false,
    };
  } catch { return { ok: false, code: "DECODE_FAILED" }; }
  finally { try { bitmap?.close(); } catch { /* no identity leak */ } }
}
