import type { D1DatabaseLike } from "./cloudflare-db";
import type { CmsField, CmsModuleConfig } from "./cms-schema";

type CmsData = Record<string, unknown>;

function invalid(code: string): never {
  throw new Error(`INVALID_CMS_${code}`);
}

function empty(value: unknown) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

function normalizedUrl(key: string, value: unknown, httpsOnly = false) {
  if (empty(value)) return "";
  try {
    const url = new URL(String(value).trim());
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("protocol");
    if (httpsOnly && url.protocol !== "https:") invalid(`FIELD_${key.toUpperCase()}_HTTPS`);
    return url.toString();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_CMS_")) throw error;
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

function validateDateTime(key: string, value: unknown) {
  if (empty(value)) return;
  if (Number.isNaN(new Date(String(value)).getTime())) invalid(`FIELD_${key.toUpperCase()}_DATETIME`);
}

function filenameFromUrl(value: unknown) {
  try {
    const url = new URL(String(value));
    const raw = url.pathname.split("/").filter(Boolean).at(-1);
    if (raw) return decodeURIComponent(raw).slice(0, 180);
  } catch {
    // URL validation returns the user-facing error.
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
    mp4: "video/mp4", webm: "video/webm", txt: "text/plain", csv: "text/csv",
  };
  return extension ? known[extension] ?? "" : "";
}

function mediaTypeFromMime(mime: string) {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("application/") || mime.startsWith("text/")) return "document";
  return null;
}

function effective(data: CmsData, current: CmsData | null, key: string) {
  return data[key] !== undefined ? data[key] : current?.[key];
}

async function validateMediaReference(db: D1DatabaseLike, field: CmsField, value: unknown) {
  if (empty(value) || !field.key.endsWith("_media_id")) return;
  const row = await db.prepare(`SELECT id,type FROM media WHERE id=? LIMIT 1`).bind(String(value)).first<{ id: string; type: string }>();
  if (!row) invalid(`FIELD_${field.key.toUpperCase()}_NOT_FOUND`);
  if (["hero_media_id", "photo_media_id", "logo_media_id"].includes(field.key) && row.type !== "image") {
    invalid(`FIELD_${field.key.toUpperCase()}_IMAGE_REQUIRED`);
  }
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

  if (config.slugColumn) {
    const supplied = data[config.slugColumn];
    const title = effective(data, current, config.titleColumn);
    if ((!id && empty(supplied)) || (id && supplied !== undefined && empty(supplied))) {
      const generated = title ? slugify(String(title)) : "";
      if (generated) data[config.slugColumn] = generated;
    }
  }

  if (moduleKey === "pages") {
    const slug = String(effective(data, current, "slug") ?? "").trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) invalid("PAGE_SLUG_INVALID");
    for (const key of ["layout_json", "seo_json"]) {
      const raw = effective(data, current, key);
      if (empty(raw)) continue;
      validateJson(key, raw);
      const value = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!value || typeof value !== "object" || Array.isArray(value)) invalid("PAGE_JSON_OBJECT_REQUIRED");
      if (key === "seo_json" && ["title", "description"].some((name) => value[name] !== undefined && typeof value[name] !== "string")) invalid("PAGE_SEO_TEXT_REQUIRED");
    }
    const heroId = effective(data, current, "hero_media_id");
    if (!empty(heroId)) {
      const media = await db.prepare(`SELECT id,type,visibility,public_url FROM media WHERE id=? LIMIT 1`).bind(String(heroId)).first<{id:string;type:string;visibility:string;public_url:string|null}>();
      if (!media || media.type !== "image" || media.visibility !== "public" || !media.public_url?.startsWith("https://")) invalid("PAGE_HERO_PUBLIC_REQUIRED");
    }
  }

  if (moduleKey === "media") {
    delete data.storage_key;
    const effectiveUrl = effective(data, current, "public_url");
    if (empty(effectiveUrl)) invalid("MEDIA_SOURCE_REQUIRED");
    const url = normalizedUrl("public_url", effectiveUrl, true);
    data.public_url = url;

    const duplicate = await db.prepare(`SELECT id FROM media WHERE public_url = ? AND id <> ? LIMIT 1`)
      .bind(url, id ?? "").first<{ id: string }>();
    if (duplicate) invalid("MEDIA_URL_DUPLICATE");

    if (!id) data.storage_key = `external/${crypto.randomUUID()}`;
    const effectiveFilename = effective(data, current, "filename");
    if (empty(effectiveFilename)) data.filename = filenameFromUrl(url);
    const nextFilename = String(data.filename ?? effectiveFilename ?? "");
    const effectiveMime = effective(data, current, "mime_type");
    const inferredMime = empty(effectiveMime) ? mimeFromFilename(nextFilename) : String(effectiveMime).trim();
    if (inferredMime && empty(effectiveMime)) data.mime_type = inferredMime;

    const effectiveType = String(effective(data, current, "type") ?? "").trim();
    const inferredTypes = [
      inferredMime ? mediaTypeFromMime(inferredMime.toLowerCase()) : null,
      mediaTypeFromMime(mimeFromFilename(nextFilename)),
      mediaTypeFromMime(mimeFromFilename(new URL(url).pathname)),
    ].filter(Boolean);
    if (effectiveType && effectiveType !== "other" && inferredTypes.some((type) => type !== effectiveType)) invalid("MEDIA_TYPE_MISMATCH");

    const effectiveSize = effective(data, current, "size_bytes");
    if (!empty(effectiveSize)) {
      const parsedSize = Number(effectiveSize);
      if (!Number.isSafeInteger(parsedSize) || parsedSize < 0) invalid("MEDIA_SIZE_INVALID");
    }
  }

  for (const field of config.fields) {
    if (field.readonly) continue;
    const value = effective(data, current, field.key);
    const generatedMediaStorageKey = moduleKey === "media" && field.key === "storage_key";
    if (field.required && !generatedMediaStorageKey && empty(value)) invalid(`FIELD_${field.key.toUpperCase()}_REQUIRED`);
    if (!empty(value) && field.type === "select" && field.options?.length && !field.options.some((option) => option.value === String(value))) {
      invalid(`FIELD_${field.key.toUpperCase()}_OPTION`);
    }
    if (field.type === "url" && moduleKey !== "media") normalizedUrl(field.key, value);
    if (field.type === "email") validateEmail(field.key, value);
    if (field.type === "json") validateJson(field.key, value);
    if (field.type === "number") validateNumber(field.key, value);
    if (field.type === "datetime") validateDateTime(field.key, value);
    await validateMediaReference(db, field, value);
  }

  if (moduleKey === "events") {
    const start = effective(data, current, "start_at");
    const end = effective(data, current, "end_at");
    if (!empty(start) && !empty(end) && new Date(String(end)).getTime() < new Date(String(start)).getTime()) invalid("EVENT_END_BEFORE_START");
  }

  if (moduleKey === "redirects") {
    const source = String(effective(data, current, "source_path") ?? "").trim();
    const destination = String(effective(data, current, "destination_path") ?? "").trim();
    if (source && (!source.startsWith("/") || source.startsWith("//"))) invalid("REDIRECT_SOURCE_PATH");
    if (destination && !destination.startsWith("/")) normalizedUrl("destination_path", destination);
    if (source && destination && source === destination) invalid("REDIRECT_LOOP");
  }

  if (moduleKey === "navigation") {
    const href = String(effective(data, current, "href") ?? "").trim();
    if (href && !href.startsWith("/")) normalizedUrl("href", href);
    const parentId = String(effective(data, current, "parent_id") ?? "").trim();
    if (id && parentId === id) invalid("NAVIGATION_SELF_PARENT");
    if (parentId) {
      const parent = await db.prepare(`SELECT id FROM navigation_items WHERE id=? LIMIT 1`).bind(parentId).first<{ id: string }>();
      if (!parent) invalid("NAVIGATION_PARENT_NOT_FOUND");
    }
    const sortOrder = effective(data, current, "sort_order");
    if (!empty(sortOrder) && (!Number.isInteger(Number(sortOrder)) || Number(sortOrder) < 0)) invalid("NAVIGATION_SORT_ORDER");
  }

  if (moduleKey === "leads") {
    const ownerId = String(effective(data, current, "owner_id") ?? "").trim();
    if (ownerId) {
      const owner = await db.prepare(`SELECT id FROM admin_users WHERE id=? AND is_active=1 LIMIT 1`).bind(ownerId).first<{ id: string }>();
      if (!owner) invalid("LEAD_OWNER_NOT_FOUND");
    }
  }

  return data;
}
