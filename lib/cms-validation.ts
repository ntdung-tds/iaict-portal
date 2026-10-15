import type { D1DatabaseLike } from "./cloudflare-db";
import type { CmsModuleConfig } from "./cms-schema";

type CmsData = Record<string, unknown>;

function invalid(code: string): never {
  throw new Error(`INVALID_CMS_${code}`);
}

function empty(value: unknown) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function validateUrl(key: string, value: unknown) {
  if (empty(value)) return;
  try {
    const url = new URL(String(value));
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error("protocol");
  } catch {
    invalid(`FIELD_${key.toUpperCase()}_URL`);
  }
}

function validateEmail(key: string, value: unknown) {
  if (empty(value)) return;
  const email = String(value).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid(`FIELD_${key.toUpperCase()}_EMAIL`);
}

function validateJson(key: string, value: unknown) {
  if (empty(value) || typeof value !== "string") return;
  try { JSON.parse(value); }
  catch { invalid(`FIELD_${key.toUpperCase()}_JSON`); }
}

function validateNumber(key: string, value: unknown) {
  if (empty(value)) return;
  if (!Number.isFinite(Number(value))) invalid(`FIELD_${key.toUpperCase()}_NUMBER`);
}

function filenameFromUrl(value: unknown) {
  try {
    const url = new URL(String(value));
    const raw = url.pathname.split("/").filter(Boolean).at(-1);
    if (raw) return decodeURIComponent(raw).slice(0, 180);
  } catch {
    // URL validation reports the user-facing error before this fallback is relevant.
  }
  return `media-${crypto.randomUUID().slice(0, 8)}`;
}

function mimeFromFilename(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  const known: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
    pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    mp4: "video/mp4", webm: "video/webm",
  };
  return extension ? known[extension] ?? "" : "";
}

export async function prepareCmsData(
  db: D1DatabaseLike,
  moduleKey: string,
  config: CmsModuleConfig,
  id: string | null,
  input: CmsData,
) {
  const data: CmsData = { ...input };
  let current: CmsData | null = null;

  if (id) {
    current = await db.prepare(`SELECT * FROM ${config.table} WHERE id = ? LIMIT 1`).bind(id).first<CmsData>();
    if (!current) invalid("NOT_FOUND");
  }

  if (moduleKey === "media") {
    // storage_key is an internal persistence detail. Operators should not need to type or edit it.
    delete data.storage_key;
    const effectiveUrl = data.public_url !== undefined ? data.public_url : current?.public_url;
    if (empty(effectiveUrl)) invalid("MEDIA_SOURCE_REQUIRED");
    validateUrl("public_url", effectiveUrl);

    if (!id) data.storage_key = `external/${crypto.randomUUID()}`;
    const effectiveFilename = data.filename !== undefined ? data.filename : current?.filename;
    if (empty(effectiveFilename)) data.filename = filenameFromUrl(effectiveUrl);
    const nextFilename = String(data.filename ?? effectiveFilename ?? "");
    const effectiveMime = data.mime_type !== undefined ? data.mime_type : current?.mime_type;
    if (empty(effectiveMime)) {
      const inferred = mimeFromFilename(nextFilename);
      if (inferred) data.mime_type = inferred;
    }
  }

  for (const field of config.fields) {
    if (field.readonly) continue;
    const value = data[field.key] !== undefined ? data[field.key] : current?.[field.key];
    const generatedMediaStorageKey = moduleKey === "media" && field.key === "storage_key";
    if (field.required && !generatedMediaStorageKey && empty(value)) invalid(`FIELD_${field.key.toUpperCase()}_REQUIRED`);
    if (field.type === "url") validateUrl(field.key, value);
    if (field.type === "email") validateEmail(field.key, value);
    if (field.type === "json") validateJson(field.key, value);
    if (field.type === "number") validateNumber(field.key, value);
  }

  return data;
}
