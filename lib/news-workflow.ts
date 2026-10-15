export const NEWS_REVIEW_STATUSES = [
  "pending",
  "editing",
  "approved",
  "rejected",
  "published",
] as const;

export type NewsReviewStatus = (typeof NEWS_REVIEW_STATUSES)[number];

export type NewsSourceDefinition = {
  id: string;
  name: string;
  homepageUrl: string;
  entryUrl: string;
  fetchStrategy: "html_discovery" | "rss" | "api" | "manual";
  trustLevel: "official" | "verified" | "reference";
  requiresEditorialReview: true;
  attributionMode: "source_link" | "source_name_and_link" | "custom";
  attributionText?: string;
  enabledByDefault: boolean;
};

export type NewsDiscoveryCandidate = {
  sourceId: string;
  sourceUrl: string;
  canonicalUrl?: string | null;
  title: string;
  excerpt?: string | null;
  sourcePublishedAt?: string | null;
};

export type NewsReviewDraft = {
  sourceId: string;
  sourceUrl: string;
  canonicalUrl: string;
  normalizedTitle: string;
  dedupeKey: string;
  suggestedTitle: string;
  suggestedExcerpt: string | null;
  workflowStatus: "pending";
};

const TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
]);

const REVIEW_TRANSITIONS: Record<NewsReviewStatus, readonly NewsReviewStatus[]> = {
  pending: ["editing", "approved", "rejected"],
  editing: ["pending", "approved", "rejected"],
  approved: ["editing", "published", "rejected"],
  rejected: ["pending", "editing"],
  published: [],
};

/**
 * Initial V16 source registry.
 *
 * These are discovery entry points only. V16 deliberately does not assume that
 * a site exposes a stable RSS/API endpoint until that endpoint is verified.
 * Every discovered item is editorial-review-only and can never auto-publish.
 */
export const DEFAULT_NEWS_SOURCES: readonly NewsSourceDefinition[] = [
  {
    id: "mst-gov-vn",
    name: "Cổng Thông tin điện tử Bộ Khoa học và Công nghệ",
    homepageUrl: "https://mst.gov.vn/",
    entryUrl: "https://mst.gov.vn/",
    fetchStrategy: "html_discovery",
    trustLevel: "official",
    requiresEditorialReview: true,
    attributionMode: "custom",
    attributionText: "Nguồn: Cổng Thông tin điện tử Bộ Khoa học và Công nghệ (mst.gov.vn)",
    enabledByDefault: true,
  },
  {
    id: "chinhphu-vn",
    name: "Cổng Thông tin điện tử Chính phủ",
    homepageUrl: "https://chinhphu.vn/",
    entryUrl: "https://chinhphu.vn/",
    fetchStrategy: "html_discovery",
    trustLevel: "official",
    requiresEditorialReview: true,
    attributionMode: "source_name_and_link",
    enabledByDefault: true,
  },
] as const;

export function normalizeNewsTitle(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("vi")
    .replace(/[“”„‟«»'’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function canonicalizeNewsUrl(value: string) {
  const url = new URL(value);
  url.hash = "";

  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_QUERY_KEYS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function buildNewsDedupeKey(input: { canonicalUrl?: string | null; title: string }) {
  if (input.canonicalUrl) {
    return `url:${canonicalizeNewsUrl(input.canonicalUrl)}`;
  }
  return `title:${normalizeNewsTitle(input.title)}`;
}

export function canTransitionNewsReviewStatus(from: NewsReviewStatus, to: NewsReviewStatus) {
  return REVIEW_TRANSITIONS[from].includes(to);
}

export function getAllowedNewsReviewTransitions(status: NewsReviewStatus) {
  return [...REVIEW_TRANSITIONS[status]];
}

export function buildNewsReviewDraft(candidate: NewsDiscoveryCandidate): NewsReviewDraft {
  const canonicalUrl = canonicalizeNewsUrl(candidate.canonicalUrl ?? candidate.sourceUrl);
  const normalizedTitle = normalizeNewsTitle(candidate.title);

  return {
    sourceId: candidate.sourceId,
    sourceUrl: candidate.sourceUrl,
    canonicalUrl,
    normalizedTitle,
    dedupeKey: buildNewsDedupeKey({ canonicalUrl, title: candidate.title }),
    suggestedTitle: candidate.title.trim(),
    suggestedExcerpt: candidate.excerpt?.trim() || null,
    workflowStatus: "pending",
  };
}

export function findProbableDuplicate(
  candidate: NewsReviewDraft,
  existing: readonly Pick<NewsReviewDraft, "canonicalUrl" | "normalizedTitle" | "dedupeKey">[],
) {
  return (
    existing.find((item) => item.dedupeKey === candidate.dedupeKey) ??
    existing.find((item) => item.canonicalUrl === candidate.canonicalUrl) ??
    existing.find((item) => item.normalizedTitle === candidate.normalizedTitle) ??
    null
  );
}

export function getNewsWorkflowPolicy() {
  return {
    autoPublish: false,
    editorialReviewRequired: true,
    publishedIsTerminal: true,
    sourceAttributionRequired: true,
    statuses: [...NEWS_REVIEW_STATUSES],
  } as const;
}
