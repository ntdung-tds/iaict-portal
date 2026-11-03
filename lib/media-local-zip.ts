/**
 * Actual ZIP download generator for *local, user-selected files only*.
 * No CMS server file reference, R2 access, upload parser or archive extraction.
 * Every file is subject to strict byte/count/name caps. This does not grant
 * CMS read rights: server-hosted assets need separate D1 scope checks and
 * a future authorized download adapter.
 *
 * ZIP32 store/deflate-raw with CRC32, UTF-8 filenames and central directory.
 */
export const LOCAL_ZIP_POLICY = Object.freeze({
  maxFiles: 20,
  maxFileBytes: 10 * 1024 * 1024,
  maxInputBytes: 30 * 1024 * 1024,
  maxArchiveBytes: 40 * 1024 * 1024,
  maxFilenameBytes: 180,
  profileId: "IAICT-LOCAL-ZIP-V1" as const,
  serverUploadAllowed: false,
  serverReadAuthorized: false,
});

export type LocalZipInput = Readonly<{ name: unknown; bytes: unknown }>;
export type LocalZipOutput =
  | Readonly<{
      ok: true;
      profileId: typeof LOCAL_ZIP_POLICY.profileId;
      bytes: Uint8Array<ArrayBuffer>;
      fileCount: number;
      inputBytes: number;
      archiveBytes: number;
      compressedEntries: number;
      serverUploadAllowed: false;
    }>
  | Readonly<{ ok: false; code:
      | "INVALID_INPUT"
      | "INVALID_FILENAME"
      | "DUPLICATE_FILENAME"
      | "EMPTY_FILE"
      | "TOO_MANY_FILES"
      | "FILE_TOO_LARGE"
      | "TOTAL_TOO_LARGE"
      | "ARCHIVE_TOO_LARGE"
      | "COMPRESSION_FAILURE" }>;

const BYTE_LENGTH_GETTER =
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "byteLength")?.get;

function copyBytes(value: unknown): Uint8Array<ArrayBuffer> | null {
  try {
    if (!(value instanceof Uint8Array)) return null;
    const size = BYTE_LENGTH_GETTER?.call(value);
    if (!Number.isSafeInteger(size) || typeof size !== "number" || size < 0) return null;
    const out = new Uint8Array(size);
    Uint8Array.prototype.set.call(out, value, 0);
    return out;
  } catch { return null; }
}

function validateName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const n = value.normalize("NFC");
  if (!n || n !== n.trim() || n.length > 150 || n.startsWith(".") ||
      n.includes("..") || n.endsWith(".") ||
      !/^[\p{L}\p{N} _().-]+$/u.test(n) ||
      /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(n)) return null;
  if (new TextEncoder().encode(n).byteLength > LOCAL_ZIP_POLICY.maxFilenameBytes) return null;
  return n;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.byteLength; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function put16(view: DataView, off: number, n: number): void { view.setUint16(off, n, true); }
function put32(view: DataView, off: number, n: number): void { view.setUint32(off, n, true); }

async function deflateRaw(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer> | null> {
  if (typeof CompressionStream !== "function") return null;
  try {
    // Copy into a fresh ArrayBuffer view, never accept a SharedArrayBuffer.
    const readable = new ReadableStream<BufferSource>({
      start(controller) { controller.enqueue(data); controller.close(); },
    });
    const reader = readable.pipeThrough(new CompressionStream("deflate-raw")).getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        const copy = copyBytes(part.value);
        if (!copy) return null;
        size += copy.byteLength;
        if (size > data.byteLength + 1024) { void reader.cancel().catch(() => undefined); return null; }
        chunks.push(copy);
      }
    } finally { try { reader.releaseLock(); } catch { /* best effort */ } }
    const out = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) { out.set(c, offset); offset += c.byteLength; }
    return out;
  } catch { return null; }
}

function mayCompress(name: string): boolean {
  const extension = name.split(".").at(-1)?.toLowerCase() ?? "";
  return ["txt", "csv", "json", "md", "log", "xml"].includes(extension);
}

type Entry = {
  filename: Uint8Array<ArrayBuffer>;
  data: Uint8Array<ArrayBuffer>;
  size: number;
  method: 0 | 8;
  checksum: number;
  offset: number;
};

/**
 * Builds a valid single-disk ZIP32 in memory. No user-supplied directory
 * paths, no ZIP64, no encrypted entries, no symlinks, no decompression.
 * Compresses eligible plain-text files only if DEFLATE saves at least 5%.
 */
export async function createLocalZipArchive(raw: unknown): Promise<LocalZipOutput> {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, code: "INVALID_INPUT" };
  if (raw.length > LOCAL_ZIP_POLICY.maxFiles) return { ok: false, code: "TOO_MANY_FILES" };

  let totalInput = 0;
  let totalEstimate = 22;
  const inputs: Array<{ filename: Uint8Array<ArrayBuffer>; data: Uint8Array<ArrayBuffer>; name: string }> = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return { ok: false, code: "INVALID_INPUT" };
    let name: unknown, original: unknown;
    try { name = (item as LocalZipInput).name; original = (item as LocalZipInput).bytes; }
    catch { return { ok: false, code: "INVALID_INPUT" }; }
    const safe = validateName(name);
    if (!safe) return { ok: false, code: "INVALID_FILENAME" };
    const key = safe.normalize("NFKC").toLocaleLowerCase("en-US");
    if (seen.has(key)) return { ok: false, code: "DUPLICATE_FILENAME" };
    seen.add(key);

    // Inspect intrinsic size before copying, so an oversized input cannot
    // trigger an unnecessary multi-megabyte allocation.
    let n: number;
    try {
      if (!(original instanceof Uint8Array)) return { ok: false, code: "INVALID_INPUT" };
      n = BYTE_LENGTH_GETTER?.call(original);
      if (typeof n !== "number" || !Number.isSafeInteger(n)) return { ok: false, code: "INVALID_INPUT" };
    } catch { return { ok: false, code: "INVALID_INPUT" }; }
    if (n === 0) return { ok: false, code: "EMPTY_FILE" };
    if (n > LOCAL_ZIP_POLICY.maxFileBytes) return { ok: false, code: "FILE_TOO_LARGE" };
    if (totalInput + n > LOCAL_ZIP_POLICY.maxInputBytes) return { ok: false, code: "TOTAL_TOO_LARGE" };
    const data = copyBytes(original);
    if (!data) return { ok: false, code: "INVALID_INPUT" };
    const filename = new TextEncoder().encode(safe);
    totalInput += n;
    totalEstimate += n + 76 + filename.byteLength * 2;
    if (totalEstimate > LOCAL_ZIP_POLICY.maxArchiveBytes) return { ok: false, code: "ARCHIVE_TOO_LARGE" };
    inputs.push({ filename, name: safe, data });
  }

  const entries: Entry[] = [];
  let zipSize = 0;
  let compressedEntries = 0;

  for (const input of inputs) {
    let content = input.data;
    let method: 0 | 8 = 0;
    if (mayCompress(input.name)) {
      const result = await deflateRaw(input.data);
      if (result && result.byteLength * 100 <= input.data.byteLength * 95) {
        content = result;
        method = 8;
        compressedEntries++;
      }
    }
    // Local record 30 bytes, central record 46 bytes and 22 byte EOCD.
    const recordSize = 30 + input.filename.byteLength + content.byteLength;
    const directorySize = 46 + input.filename.byteLength;
    if (zipSize + recordSize + directorySize > LOCAL_ZIP_POLICY.maxArchiveBytes - 22) {
      return { ok: false, code: "ARCHIVE_TOO_LARGE" };
    }
    entries.push({
      filename: input.filename, data: content, size: input.data.byteLength,
      method, checksum: crc32(input.data), offset: zipSize,
    });
    zipSize += recordSize;
  }

  const localBytes = zipSize;
  const centralSize = entries.reduce((n, e) => n + 46 + e.filename.byteLength, 0);
  const total = localBytes + centralSize + 22;
  if (total > LOCAL_ZIP_POLICY.maxArchiveBytes) return { ok: false, code: "ARCHIVE_TOO_LARGE" };
  const zip = new Uint8Array(total);
  const view = new DataView(zip.buffer);
  let offset = 0;

  for (const e of entries) {
    put32(view, offset, 0x04034b50);
    put16(view, offset + 4, 20);
    put16(view, offset + 6, 0x0800); // UTF-8 bit
    put16(view, offset + 8, e.method);
    put16(view, offset + 10, 0);
    put16(view, offset + 12, 0);
    put32(view, offset + 14, e.checksum);
    put32(view, offset + 18, e.data.byteLength);
    put32(view, offset + 22, e.size);
    put16(view, offset + 26, e.filename.byteLength);
    put16(view, offset + 28, 0);
    zip.set(e.filename, offset + 30);
    zip.set(e.data, offset + 30 + e.filename.byteLength);
    offset += 30 + e.filename.byteLength + e.data.byteLength;
  }

  const centralOffset = offset;
  for (const e of entries) {
    put32(view, offset, 0x02014b50);
    put16(view, offset + 4, 20);
    put16(view, offset + 6, 20);
    put16(view, offset + 8, 0x0800);
    put16(view, offset + 10, e.method);
    put16(view, offset + 12, 0);
    put16(view, offset + 14, 0);
    put32(view, offset + 16, e.checksum);
    put32(view, offset + 20, e.data.byteLength);
    put32(view, offset + 24, e.size);
    put16(view, offset + 28, e.filename.byteLength);
    put16(view, offset + 30, 0);
    put16(view, offset + 32, 0);
    put16(view, offset + 34, 0);
    put16(view, offset + 36, 0);
    put32(view, offset + 38, 0);
    put32(view, offset + 42, e.offset);
    zip.set(e.filename, offset + 46);
    offset += 46 + e.filename.byteLength;
  }
  put32(view, offset, 0x06054b50);
  put16(view, offset + 4, 0);
  put16(view, offset + 6, 0);
  put16(view, offset + 8, entries.length);
  put16(view, offset + 10, entries.length);
  put32(view, offset + 12, centralSize);
  put32(view, offset + 16, centralOffset);
  put16(view, offset + 20, 0);

  return {
    ok: true, profileId: LOCAL_ZIP_POLICY.profileId, bytes: zip,
    fileCount: entries.length, inputBytes: totalInput, archiveBytes: zip.byteLength,
    compressedEntries, serverUploadAllowed: false,
  };
}
