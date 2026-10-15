export const NEWS_REVIEW_STATUSES = [
  "pending",
  "editing",
  "approved",
  "rejected",
  "published",
] as const;

export type NewsReviewStatus = (typeof NEWS_REVIEW_STATUSES)[number];
export type NewsTrustLevel = "official" | "verified" | "reference";
export type NewsPublicationMode = "inherit" | "manual" | "auto";

export type NewsWorkflowSettings = {
  autoPublishEnabled: boolean;
  autoPublishMinTrust: NewsTrustLevel;
  autoPublishMaxPerRun: number;
  requireAttribution: boolean;
  requireSourcePublishedAt: boolean;
};

export type NewsSourceDefinition = {
  id: string;
  name: string;
  homepageUrl: string;
  entryUrl: string;
  fetchStrategy: "html_discovery" | "rss" | "api" | "manual";
  trustLevel: NewsTrustLevel;
  publicationMode: NewsPublicationMode;
  requiresEditorialWorkflow: true;
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

export type AutoPublishChecks = {
  isDuplicate: boolean;
  hasAttribution: boolean;
  hasValidTitle: boolean;
  hasValidCanonicalUrl: boolean;
  hasSourcePublishedAt: boolean;
};

export type NewsPublicationDecision = {
  mode: "manual" | "auto";
  eligible: boolean;
  reasons: string[];
};

export const DEFAULT_NEWS_WORKFLOW_SETTINGS: NewsWorkflowSettings = {
  autoPublishEnabled: false,
  autoPublishMinTrust: "official",
  autoPublishMaxPerRun: 10,
  requireAttribution: true,
  requireSourcePublishedAt: false,
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

const TRUST_SCORE: Record<NewsTrustLevel, number> = {
  reference: 0,
  verified: 1,
  official: 2,
};

/**
 * Initial V16 source registry.
 *
 * Sources inherit the global CMS publication policy by default. The global
 * auto-publish switch is OFF unless an administrator explicitly enables it.
 * Every item still passes through the editorial workflow so manual and
 * policy-driven approvals remain auditable.
 */
export const DEFAULT_NEWS_SOURCES: readonly NewsSourceDefinition[] = [
  {
    id: "mst-gov-vn",
    name: "Cổng Thông tin điện tử Bộ Khoa học và Công nghệ",
    homepageUrl: "https://mst.gov.vn/",
    entryUrl: "https://mst.gov.vn/rss/tin-tuc-su-kien.rss",
    fetchStrategy: "rss",
    trustLevel: "official",
    publicationMode: "inherit",
    requiresEditorialWorkflow: true,
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
    publicationMode: "inherit",
    requiresEditorialWorkflow: true,
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

export function resolveNewsPublicationDecision(
  source: NewsSourceDefinition,
  settings: NewsWorkflowSettings,
  checks: AutoPublishChecks,
): NewsPublicationDecision {
  const reasons: string[] = [];

  if (!settings.autoPublishEnabled) reasons.push("global-auto-publish-disabled");
  if (source.publicationMode === "manual") reasons.push("source-forced-manual");
  if (!source.enabledByDefault) reasons.push("source-disabled");
  if (TRUST_SCORE[source.trustLevel] < TRUST_SCORE[settings.autoPublishMinTrust]) {
    reasons.push("trust-level-below-threshold");
  }
  if (checks.isDuplicate) reasons.push("duplicate-detected");
  if (!checks.hasValidTitle) reasons.push("invalid-title");
  if (!checks.hasValidCanonicalUrl) reasons.push("invalid-canonical-url");
  if (settings.requireAttribution && !checks.hasAttribution) reasons.push("missing-attribution");
  if (settings.requireSourcePublishedAt && !checks.hasSourcePublishedAt) {
    reasons.push("missing-source-published-at");
  }

  const sourceAllowsAuto = source.publicationMode === "inherit" || source.publicationMode === "auto";
  const eligible = sourceAllowsAuto && reasons.length === 0;

  return {
    mode: eligible ? "auto" : "manual",
    eligible,
    reasons,
  };
}

export function getNewsWorkflowPolicy(settings = DEFAULT_NEWS_WORKFLOW_SETTINGS) {
  return {
    autoPublishAvailable: true,
    autoPublishEnabled: settings.autoPublishEnabled,
    autoPublishDefault: false,
    editorialWorkflowAlwaysUsed: true,
    autoApprovalRecorded: true,
    publishedIsTerminal: true,
    sourceAttributionRequired: settings.requireAttribution,
    statuses: [...NEWS_REVIEW_STATUSES],
  } as const;
}
