/**
 * CMS Media B3.4 — SOURCE-ONLY bounded stream inspection contract.
 *
 * NOT imported by Worker, R2, API, browser or IAM; no policy/limits are live.
 * This consumes an entire stream (discards content beyond a tiny signature
 * prefix). DO NOT use it as a staging upload pipeline: a future deployment
 * needs bounded forwarding, robust deadlines, decoding, scan, role policy,
 * durable D1/R2 compensation and explicit Owner approval.
 */
export type MediaStreamInspectionPolicy = Readonly<{
  maxBytes: number;
  maxChunks: number;
}>;
export type MediaStreamRejection =
  | "POLICY_NOT_CONFIGURED"
  | "INVALID_STREAM"
  | "INVALID_CHUNK"
  | "EMPTY_BODY"
  | "TOO_LARGE"
  | "TOO_MANY_CHUNKS";

export type MediaStreamInspection =
  | Readonly<{
      ok: true;
      totalBytes: number;
      chunkCount: number;
      signaturePrefix: readonly number[];
    }>
  | Readonly<{ ok: false; code: MediaStreamRejection }>;

function reject(code: MediaStreamRejection): MediaStreamInspection {
  return { ok: false, code };
}

function policySnapshot(raw: unknown): MediaStreamInspectionPolicy | null {
  if (raw === null || typeof raw !== "object") return null;
  try {
    if (Array.isArray(raw)) return null;
    const value = raw as Partial<MediaStreamInspectionPolicy>;
    const maxBytes = value.maxBytes;
    const maxChunks = value.maxChunks;
    if (typeof maxBytes !== "number" || !Number.isSafeInteger(maxBytes) || maxBytes <= 0) return null;
    if (typeof maxChunks !== "number" || !Number.isSafeInteger(maxChunks) || maxChunks <= 0) return null;
    return { maxBytes, maxChunks };
  } catch {
    return null; // revoked proxies / throwing getters are invalid policy
  }
}

const BYTE_LENGTH_GETTER =
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "byteLength")?.get;

function intrinsicByteLength(input: unknown): number | null {
  try {
    // Intrinsic getter also accepts non-byte typed arrays: require Uint8Array.
    if (!(input instanceof Uint8Array)) return null;
    const length = BYTE_LENGTH_GETTER?.call(input);
    return typeof length === "number" && Number.isSafeInteger(length) && length >= 0 ? length : null;
  } catch {
    return null;
  }
}

/**
 * Iterates *only* an explicit async iterable; never trusts declared Content-Length.
 * Bounded by BOTH total byte count and yielded chunk count. Detects malicious
 * zero-progress chunk streams by requiring a caller-supplied maxChunks.
 *
 * The prefix (at most 12 bytes) is diagnostic fixture data only, not a safe
 * image decoder or a malware verdict. A successful inspection does not make
 * any asset publishable. The source may still stall inside iterator.next();
 * future callers must impose separate timeout/cancellation policy.
 */
export async function inspectBoundedMediaStream(input: unknown, rawPolicy: unknown): Promise<MediaStreamInspection> {
  const policy = policySnapshot(rawPolicy);
  if (!policy) return reject("POLICY_NOT_CONFIGURED");
  if (input === null || (typeof input !== "object" && typeof input !== "function")) {
    return reject("INVALID_STREAM");
  }

  let iterator: AsyncIterator<unknown>;
  let next: () => Promise<IteratorResult<unknown>>;
  try {
    // Snapshot the factory and .next method once: untrusted getters can vary.
    const factory = (input as AsyncIterable<unknown>)[Symbol.asyncIterator];
    if (typeof factory !== "function") return reject("INVALID_STREAM");
    const created = factory.call(input) as AsyncIterator<unknown>;
    if (!created) return reject("INVALID_STREAM");
    const nextMethod = created.next;
    if (typeof nextMethod !== "function") return reject("INVALID_STREAM");
    iterator = created;
    next = () => Reflect.apply(nextMethod, created, []) as Promise<IteratorResult<unknown>>;
  } catch {
    return reject("INVALID_STREAM");
  }

  let completed = false;
  let total = 0;
  let chunks = 0;
  const header = new Uint8Array(12);
  let prefixLength = 0;
  try {
    while (true) {
      const item = await next();
      if (item === null || typeof item !== "object") return reject("INVALID_STREAM");
      const done = item.done; // snapshot a possibly dynamic getter once
      if (done !== true && done !== false && done !== undefined) return reject("INVALID_STREAM");
      if (done === true) {
        completed = true;
        if (total === 0) return reject("EMPTY_BODY");
        return { ok: true, totalBytes: total, chunkCount: chunks, signaturePrefix: Array.from(header.subarray(0, prefixLength)) };
      }

      // A zero-length chunk still counts toward the budget. Avoid an infinite
      // iterable that reports no byte progress forever.
      chunks++;
      if (chunks > policy.maxChunks) return reject("TOO_MANY_CHUNKS");

      const chunk = item.value; // same chunk for length and signature; no getter TOCTOU
      const length = intrinsicByteLength(chunk);
      if (length === null) return reject("INVALID_CHUNK");
      if (length > policy.maxBytes - total) return reject("TOO_LARGE");

      const take = Math.min(12 - prefixLength, length);
      if (take > 0) {
        // Native typed-array methods fail closed for Proxy wrappers and cannot
        // be fooled by a subclass overriding .length or .byteLength.
        Uint8Array.prototype.set.call(
          header,
          Uint8Array.prototype.subarray.call(chunk, 0, take),
          prefixLength,
        );
        prefixLength += take;
      }
      total += length;
    }
  } catch {
    return reject("INVALID_STREAM");
  } finally {
    if (!completed) {
      // Best-effort cancellation on invalid/oversize streams. Cleanup failure
      // cannot upgrade a rejected inspection to success.
      try { await iterator.return?.(); } catch { /* no secrets in logs */ }
    }
  }
}
