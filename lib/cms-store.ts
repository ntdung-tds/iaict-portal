import { get, put } from "@vercel/blob";
import { publications as repositoryPublications, type Publication } from "@/lib/publications";

export type CmsPublicationStatus = "draft" | "published";
export type PublicCmsPublication = Publication & { contentHtml?: string };

export type CmsPublication = Publication & {
  contentHtml?: string;
  id: string;
  status: CmsPublicationStatus;
  createdAt: string;
  updatedAt: string;
  originSlug?: string;
};

export type CmsAuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: "save-draft" | "publish" | "unpublish" | "delete";
  publicationId: string;
  title: string;
};

export type CmsState = {
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  items: CmsPublication[];
  audit: CmsAuditEntry[];
};

export type CmsSnapshot = {
  state: CmsState;
  storageReady: boolean;
  materialized: boolean;
};

const CMS_PATHNAME = "cms/publications.json";

function repositorySeed(): CmsState {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    revision: 0,
    updatedAt: now,
    items: repositoryPublications.map((item) => ({
      ...item,
      id: `repo:${item.slug}`,
      status: "published" as const,
      createdAt: `${item.publishedAt}T00:00:00+07:00`,
      updatedAt: `${item.publishedAt}T00:00:00+07:00`,
    })),
    audit: [],
  };
}

function isCmsState(value: unknown): value is CmsState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CmsState>;
  return candidate.schemaVersion === 1 && typeof candidate.revision === "number" && Array.isArray(candidate.items);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function isCmsStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getCmsSnapshot(): Promise<CmsSnapshot> {
  const fallback = repositorySeed();
  if (!isCmsStorageConfigured()) {
    return { state: fallback, storageReady: false, materialized: false };
  }

  try {
    const result = await get(CMS_PATHNAME, {
      access: "private",
      useCache: false,
    });

    if (!result?.stream) {
      return { state: fallback, storageReady: true, materialized: false };
    }

    const parsed = JSON.parse(await new Response(result.stream).text()) as unknown;
    if (!isCmsState(parsed)) {
      return { state: fallback, storageReady: true, materialized: false };
    }

    return {
      state: {
        ...parsed,
        audit: Array.isArray(parsed.audit) ? parsed.audit : [],
      },
      storageReady: true,
      materialized: true,
    };
  } catch {
    return { state: fallback, storageReady: true, materialized: false };
  }
}

export async function persistCmsState(state: CmsState) {
  if (!isCmsStorageConfigured()) {
    throw new Error("CMS_STORAGE_NOT_CONFIGURED");
  }

  await put(CMS_PATHNAME, JSON.stringify(state), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export function toPublicPublication(item: CmsPublication): PublicCmsPublication {
  const {
    id: _id,
    status: _status,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    originSlug: _originSlug,
    ...publication
  } = item;
  return publication;
}

export async function getPublishedPublications(): Promise<PublicCmsPublication[]> {
  const snapshot = await getCmsSnapshot();
  return snapshot.state.items
    .filter((item) => item.status === "published")
    .map(toPublicPublication)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPublishedPublication(slug: string): Promise<PublicCmsPublication | undefined> {
  const publications = await getPublishedPublications();
  return publications.find((item) => item.slug === slug);
}

export function bodyFromPublication(item: PublicCmsPublication) {
  if (typeof item.contentHtml === "string") return item.contentHtml;

  return item.sections
    .map((section) => {
      const parts: string[] = [];
      if (section.heading) parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
      if (section.paragraphs?.length) {
        parts.push(...section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`));
      }
      if (section.bullets?.length) {
        parts.push(`<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`);
      }
      return parts.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function sectionsFromBody(body: string) {
  const blocks = body
    .split(/\n\s*\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!blocks.length) return [];

  const sections: Publication["sections"] = [];
  let current: Publication["sections"][number] = { paragraphs: [] };

  for (const block of blocks) {
    if (block.startsWith("## ")) {
      if (current.heading || current.paragraphs?.length || current.bullets?.length) sections.push(current);
      current = { heading: block.slice(3).trim(), paragraphs: [] };
      continue;
    }

    if (block.startsWith("- ")) {
      current.bullets = [...(current.bullets ?? []), block.slice(2).trim()];
      continue;
    }

    current.paragraphs = [...(current.paragraphs ?? []), block];
  }

  if (current.heading || current.paragraphs?.length || current.bullets?.length) sections.push(current);
  return sections;
}

export function estimateReadingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} phút đọc`;
}
