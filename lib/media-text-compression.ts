/**
 * B3.6 source-only actual gzip compressor for explicitly authorized TEXT assets.
 *
 * This helper is NOT an upload allowlist, decompressor, archive extractor,
 * document parser, R2 writer or HTTP delivery route. CMS Media remains
 * JPEG/PNG/WebP-only until a separate document-upload acceptance.
 *
 * After future D1/R2 acceptance a caller must persist original content-type,
 * storage content-encoding and hashes together; authorized downloads must
 * negotiate decoding. Never blindly apply gzip to jpeg/png/webp, pdf,
 * docx/xlsx/zip, encrypted or already-compressed formats.
 */
export const TEXT_FILE_COMPRESSION = Object.freeze({
  profileId: "IAICT-TEXT-GZIP-V1" as const,
  eligibleMimeTypes: Object.freeze(["text/plain", "text/csv", "application/json"] as const),
  maxInputBytes: 5 * 1024 * 1024,
  maxOutputBytes: 5 * 1024 * 1024 + 64 * 1024,
  minimumSavingsPercent: 5,
  algorithm: "gzip" as const,
  uploadEnabled: false,
  archivesAcceptedAsUploads: false,
});

export type TextCompressionResult =
  | Readonly<{
      ok: true;
      profileId: typeof TEXT_FILE_COMPRESSION.profileId;
      storageEncoding: "gzip" | "identity";
      bytes: Uint8Array;
      inputBytes: number;
      outputBytes: number;
      savingsBytes: number;
      isUploadPermission: false;
    }>
  | Readonly<{ ok: false; code:
      | "INVALID_INPUT"
      | "INVALID_TEXT_ENCODING"
      | "UNSUPPORTED_FORMAT"
      | "EMPTY_INPUT"
      | "TOO_LARGE"
      | "COMPRESSION_UNAVAILABLE"
      | "OUTPUT_LIMIT_EXCEEDED" }>;

const BYTE_LENGTH_GETTER =
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "byteLength")?.get;

function trustedCopy(input: unknown): Uint8Array<ArrayBuffer> | null {
  try {
    if (!(input instanceof Uint8Array)) return null;
    const length = BYTE_LENGTH_GETTER?.call(input);
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0) return null;
    // Built-in typed-array copy does not trust attacker-supplied length/index getters.
    const out = new Uint8Array(length);
    Uint8Array.prototype.set.call(out, input, 0);
    return out;
  } catch { return null; }
}

/**
 * Compress bytes from a locally supplied, already-safe synthetic text buffer.
 * Does not decompress or accept archives. The compressed output is bounded.
 * On inadequate savings, returns a defensive copy with "identity".
 *
 * No AV/decoder verification occurs here. A future runtime caller MUST
 * enforce independent quotas, rate limits, scan and access checks.
 */
export async function compressEligibleTextFile(
  rawBytes: unknown,
  rawMime: unknown,
): Promise<TextCompressionResult> {
  if (typeof rawMime !== "string" ||
      !TEXT_FILE_COMPRESSION.eligibleMimeTypes.some(x => x === rawMime)) {
    return { ok: false, code: "UNSUPPORTED_FORMAT" };
  }

  // Preflight the intrinsic slot BEFORE allocating a copy. Otherwise an
  // attacker can force large allocations by submitting an unbounded view.
  try {
    if (!(rawBytes instanceof Uint8Array)) return { ok: false, code: "INVALID_INPUT" };
    const size = BYTE_LENGTH_GETTER?.call(rawBytes);
    if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0)
      return { ok: false, code: "INVALID_INPUT" };
    if (size === 0) return { ok: false, code: "EMPTY_INPUT" };
    if (size > TEXT_FILE_COMPRESSION.maxInputBytes) return { ok: false, code: "TOO_LARGE" };
  } catch {
    return { ok: false, code: "INVALID_INPUT" };
  }
  const original = trustedCopy(rawBytes);
  if (!original) return { ok: false, code: "INVALID_INPUT" };
  // The first iteration only supports valid UTF-8 text. Never infer safe file
  // content from a caller-controlled MIME or extension alone.
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(original);
  } catch { return { ok: false, code: "INVALID_TEXT_ENCODING" }; }

  if (typeof CompressionStream !== "function")
    return { ok: false, code: "COMPRESSION_UNAVAILABLE" };

  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(original);
      controller.close();
    },
  });
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const output: Uint8Array[] = [];
  let total = 0;
  try {
    reader = source.pipeThrough(new CompressionStream("gzip")).getReader();
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      const piece = trustedCopy(item.value);
      if (!piece) return { ok: false, code: "COMPRESSION_UNAVAILABLE" };
      if (piece.byteLength > TEXT_FILE_COMPRESSION.maxOutputBytes - total) {
        void reader.cancel().catch(() => undefined);
        return { ok: false, code: "OUTPUT_LIMIT_EXCEEDED" };
      }
      total += piece.byteLength;
      output.push(piece);
    }
  } catch {
    try { await reader?.cancel(); } catch { /* no uncontrolled throw */ }
    return { ok: false, code: "COMPRESSION_UNAVAILABLE" };
  } finally {
    try { reader?.releaseLock(); } catch { /* best effort */ }
  }
  // On small or high-entropy text, gzip framing can increase size; never
  // persist a larger object just because "compression" was requested.
  if (total * 100 > original.byteLength * (100 - TEXT_FILE_COMPRESSION.minimumSavingsPercent)) {
    return {
      ok: true, profileId: TEXT_FILE_COMPRESSION.profileId,
      storageEncoding: "identity", bytes: original,
      inputBytes: original.byteLength, outputBytes: original.byteLength,
      savingsBytes: 0, isUploadPermission: false,
    };
  }
  const zipped = new Uint8Array(total);
  let offset = 0;
  for (const chunk of output) { zipped.set(chunk, offset); offset += chunk.byteLength; }
  return {
    ok: true, profileId: TEXT_FILE_COMPRESSION.profileId,
    storageEncoding: "gzip", bytes: zipped,
    inputBytes: original.byteLength, outputBytes: zipped.byteLength,
    savingsBytes: original.byteLength - zipped.byteLength, isUploadPermission: false,
  };
}
