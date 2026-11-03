/** Pure, fail-closed CMS Media upload preflight contract.
 * NOT wired to routes/R2; a magic-byte match is not decoding, malware scanning,
 * dimension validation, quota enforcement or authorization.
 * The caller MUST supply an approved policy; there are no live defaults.
 */

export type MediaImageMime = "image/jpeg" | "image/png" | "image/webp";
export type MediaUploadPolicy = Readonly<{
  allowedMimeTypes: readonly MediaImageMime[];
  maxBytes: number;
}>;

export type MediaUploadCandidate = Readonly<{
  filename: unknown;
  declaredMimeType: unknown;
  bytes: unknown;
  declaredSize?: unknown;
}>;

export type MediaUploadRejectionCode =
  | "POLICY_NOT_CONFIGURED"
  | "INVALID_INPUT"
  | "INVALID_FILENAME"
  | "UNSUPPORTED_EXTENSION"
  | "UNSUPPORTED_MIME"
  | "MIME_EXTENSION_MISMATCH"
  | "SIGNATURE_MISMATCH"
  | "EMPTY_FILE"
  | "TOO_LARGE"
  | "INVALID_DECLARED_SIZE"
  | "DECLARED_SIZE_MISMATCH";

export type MediaUploadPreflight =
  | Readonly<{ ok: true; mimeType: MediaImageMime; displayFilename: string; byteLength: number }>
  | Readonly<{ ok: false; code: MediaUploadRejectionCode }>;

const EXTENSIONS: Record<MediaImageMime, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};
const MEDIA_KINDS = Object.keys(EXTENSIONS) as MediaImageMime[];
const RISKY_COMPOUND_EXTENSIONS = new Set([
  "exe", "dll", "bat", "cmd", "com", "scr", "ps1", "sh", "php",
  "html", "htm", "svg", "js", "mjs", "pdf", "doc", "docx", "zip",
]);

function reject(code: MediaUploadRejectionCode): MediaUploadPreflight {
  return { ok: false, code };
}

function isApprovedPolicy(value: unknown): value is MediaUploadPolicy {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Partial<MediaUploadPolicy>;
  if (!Number.isSafeInteger(candidate.maxBytes) || (candidate.maxBytes ?? 0) <= 0) return false;
  if (!Array.isArray(candidate.allowedMimeTypes) || candidate.allowedMimeTypes.length === 0) return false;
  const seen = new Set<string>();
  for (const mime of candidate.allowedMimeTypes) {
    if (typeof mime !== "string" || !MEDIA_KINDS.includes(mime as MediaImageMime) || seen.has(mime)) return false;
    seen.add(mime);
  }
  return true;
}

function safeDisplayFilename(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const filename = value.normalize("NFC");
  // Never normalize a client-supplied path into an R2 key. Reject ambiguous names.
  if (!filename || filename.length > 180 || filename !== filename.trim()) return null;
  if (filename.startsWith(".") || filename.endsWith(".") || filename.includes("..")) return null;
  if (!/^[\p{L}\p{N} _().-]+$/u.test(filename)) return null;
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) return null;
  const pieces = filename.split(".");
  if (pieces.length < 2 || !pieces[0].trim() || pieces.slice(0, -1).some(x => RISKY_COMPOUND_EXTENSIONS.has(x.toLowerCase()))) return null;
  return filename;
}

function signatureMime(bytes: Uint8Array): MediaImageMime | null {
  // Signature recognition only; this does not validate an entire decoded image.
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)) return "image/png";
  if (bytes.length >= 12 && [82, 73, 70, 70].every((n, i) => bytes[i] === n) &&
      [87, 69, 66, 80].every((n, i) => bytes[i + 8] === n)) return "image/webp";
  return null;
}

export function validateMediaUploadPreflight(input: unknown, policy: unknown): MediaUploadPreflight {
  if (!isApprovedPolicy(policy)) return reject("POLICY_NOT_CONFIGURED");
  if (input === null || typeof input !== "object" || Array.isArray(input)) return reject("INVALID_INPUT");
  const candidate = input as MediaUploadCandidate;
  const filename = safeDisplayFilename(candidate.filename);
  if (!filename) return reject("INVALID_FILENAME");
  const extension = filename.split(".").at(-1)?.toLowerCase();
  if (!extension || !Object.values(EXTENSIONS).some(exts => exts.includes(extension))) return reject("UNSUPPORTED_EXTENSION");

  if (typeof candidate.declaredMimeType !== "string") return reject("UNSUPPORTED_MIME");
  const claimed = candidate.declaredMimeType.trim().toLowerCase();
  if (!MEDIA_KINDS.includes(claimed as MediaImageMime) || !policy.allowedMimeTypes.includes(claimed as MediaImageMime)) return reject("UNSUPPORTED_MIME");
  const mime = claimed as MediaImageMime;
  if (!EXTENSIONS[mime].includes(extension)) return reject("MIME_EXTENSION_MISMATCH");

  if (!(candidate.bytes instanceof Uint8Array)) return reject("INVALID_INPUT");
  const bytes = candidate.bytes;
  if (bytes.byteLength === 0) return reject("EMPTY_FILE");
  if (bytes.byteLength > policy.maxBytes) return reject("TOO_LARGE");
  if (candidate.declaredSize !== undefined) {
    if (!Number.isSafeInteger(candidate.declaredSize) || (candidate.declaredSize as number) < 0) return reject("INVALID_DECLARED_SIZE");
    if (candidate.declaredSize !== bytes.byteLength) return reject("DECLARED_SIZE_MISMATCH");
  }
  if (signatureMime(bytes) !== mime) return reject("SIGNATURE_MISMATCH");
  return { ok: true, mimeType: mime, displayFilename: filename, byteLength: bytes.byteLength };
}

const V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Only a private *quarantine* key, never a public URL or proof of scan approval. */
export function newMediaQuarantineKey(uuid: () => string = () => crypto.randomUUID()): string {
  const id = uuid();
  if (typeof id !== "string" || !V4_UUID.test(id)) throw new Error("INVALID_MEDIA_KEY_UUID");
  return "quarantine/v1/" + id;
}
