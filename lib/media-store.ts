import { del, get, put } from "@vercel/blob";
import type { MediaAsset } from "@/lib/media-types";

export type MediaState = {
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  items: MediaAsset[];
};

export type MediaSnapshot = {
  state: MediaState;
  storageReady: boolean;
  materialized: boolean;
};

const MEDIA_MANIFEST_PATH = "cms/media.json";

function emptyState(): MediaState {
  return {
    schemaVersion: 1,
    revision: 0,
    updatedAt: new Date().toISOString(),
    items: [],
  };
}

function isMediaState(value: unknown): value is MediaState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MediaState>;
  return candidate.schemaVersion === 1 && typeof candidate.revision === "number" && Array.isArray(candidate.items);
}

export function isMediaStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getMediaSnapshot(): Promise<MediaSnapshot> {
  const fallback = emptyState();
  if (!isMediaStorageConfigured()) {
    return { state: fallback, storageReady: false, materialized: false };
  }

  try {
    const result = await get(MEDIA_MANIFEST_PATH, {
      access: "private",
      useCache: false,
    });

    if (!result?.stream) {
      return { state: fallback, storageReady: true, materialized: false };
    }

    const parsed = JSON.parse(await new Response(result.stream).text()) as unknown;
    if (!isMediaState(parsed)) {
      return { state: fallback, storageReady: true, materialized: false };
    }

    return {
      state: {
        ...parsed,
        items: parsed.items.filter((item) => item && typeof item.id === "string" && typeof item.pathname === "string"),
      },
      storageReady: true,
      materialized: true,
    };
  } catch {
    return { state: fallback, storageReady: true, materialized: false };
  }
}

export async function persistMediaState(state: MediaState) {
  if (!isMediaStorageConfigured()) throw new Error("MEDIA_STORAGE_NOT_CONFIGURED");

  await put(MEDIA_MANIFEST_PATH, JSON.stringify(state), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function filenameBase(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
}

export function mediaExtensionForType(contentType: string) {
  return extensionByType[contentType];
}

export function mediaPublicUrl(id: string, filename: string) {
  return `/media/${encodeURIComponent(id)}/${encodeURIComponent(filename)}`;
}

export async function uploadMediaBlob(file: File, id: string) {
  const extension = mediaExtensionForType(file.type);
  if (!extension) throw new Error("UNSUPPORTED_MEDIA_TYPE");

  const filename = `${filenameBase(file.name)}.${extension}`;
  const pathname = `media/${id}/${filename}`;

  await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: file.type,
    cacheControlMaxAge: 31536000,
  });

  return { filename, pathname, publicUrl: mediaPublicUrl(id, filename) };
}

export async function deleteMediaBlob(pathname: string) {
  await del(pathname);
}
