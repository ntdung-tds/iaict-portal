import {
  type NewsDiscoveryCandidate,
  type NewsSourceDefinition,
  canonicalizeNewsUrl,
  normalizeNewsTitle,
} from "./news-workflow";

export type NewsAdapterKind = "rss" | "html";

export type NewsSourceAdapterDefinition = {
  sourceId: string;
  kind: NewsAdapterKind;
  entryUrl: string;
  allowedHosts: readonly string[];
  maxItems: number;
  timeoutMs: number;
  maxResponseBytes: number;
};

export type NewsSourceFetchResult = {
  sourceId: string;
  strategy: NewsAdapterKind;
  entryUrl: string;
  fetchedAt: string;
  candidates: NewsDiscoveryCandidate[];
};

const USER_AGENT = "IAICT-Newsroom/16";

export const NEWS_SOURCE_ADAPTERS: readonly NewsSourceAdapterDefinition[] = [
  {
    sourceId: "mst-gov-vn",
    kind: "rss",
    entryUrl: "https://mst.gov.vn/rss/tin-tuc-su-kien.rss",
    allowedHosts: ["mst.gov.vn"],
    maxItems: 30,
    timeoutMs: 8_000,
    maxResponseBytes: 1_500_000,
  },
  {
    sourceId: "chinhphu-vn",
    kind: "html",
    entryUrl: "https://chinhphu.vn/",
    allowedHosts: ["chinhphu.vn", "baochinhphu.vn"],
    maxItems: 30,
    timeoutMs: 8_000,
    maxResponseBytes: 2_500_000,
  },
] as const;

const COMMON_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return COMMON_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function stripMarkup(value: string) {
  return decodeEntities(
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function readXmlTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripMarkup(match[1]) : null;
}

function normalizeDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isAllowedUrl(value: string, definition: NewsSourceAdapterDefinition) {
  try {
    const url = new URL(value, definition.entryUrl);
    return url.protocol === "https:" && definition.allowedHosts.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function toAbsoluteUrl(value: string, definition: NewsSourceAdapterDefinition) {
  return new URL(value, definition.entryUrl).toString();
}

function trimExcerpt(value: string | null, maxLength = 500) {
  if (!value) return null;
  const clean = stripMarkup(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function uniqueCandidates(candidates: NewsDiscoveryCandidate[], maxItems: number) {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const result: NewsDiscoveryCandidate[] = [];

  for (const candidate of candidates) {
    let canonical: string;
    try {
      canonical = canonicalizeNewsUrl(candidate.canonicalUrl ?? candidate.sourceUrl);
    } catch {
      continue;
    }

    const normalizedTitle = normalizeNewsTitle(candidate.title);
    if (!normalizedTitle || seenUrls.has(canonical) || seenTitles.has(normalizedTitle)) continue;

    seenUrls.add(canonical);
    seenTitles.add(normalizedTitle);
    result.push({ ...candidate, canonicalUrl: canonical });
    if (result.length >= maxItems) break;
  }

  return result;
}

export function getNewsSourceAdapter(sourceId: string) {
  return NEWS_SOURCE_ADAPTERS.find((adapter) => adapter.sourceId === sourceId) ?? null;
}

export function parseRssNewsCandidates(
  sourceId: string,
  xml: string,
  definition: NewsSourceAdapterDefinition,
) {
  const candidates: NewsDiscoveryCandidate[] = [];
  const itemMatches = xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi);

  for (const match of itemMatches) {
    const block = match[1];
    const title = readXmlTag(block, "title");
    const link = readXmlTag(block, "link");
    if (!title || !link || title.length < 8 || !isAllowedUrl(link, definition)) continue;

    const sourceUrl = toAbsoluteUrl(link, definition);
    candidates.push({
      sourceId,
      sourceUrl,
      canonicalUrl: sourceUrl,
      title,
      excerpt: trimExcerpt(readXmlTag(block, "description")),
      sourcePublishedAt: normalizeDate(readXmlTag(block, "pubDate") ?? readXmlTag(block, "date")),
    });
  }

  return uniqueCandidates(candidates, definition.maxItems);
}

const HTML_LINK_RE = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
const NON_ARTICLE_LABELS = new Set([
  "trang chủ",
  "xem thêm",
  "chính phủ",
  "công dân",
  "doanh nghiệp",
  "kiều bào",
  "english",
]);

export function parseHtmlNewsCandidates(
  sourceId: string,
  html: string,
  definition: NewsSourceAdapterDefinition,
) {
  const candidates: NewsDiscoveryCandidate[] = [];

  for (const match of html.matchAll(HTML_LINK_RE)) {
    const href = decodeEntities(match[1]).trim();
    const title = stripMarkup(match[2]);
    if (title.length < 24 || NON_ARTICLE_LABELS.has(title.toLocaleLowerCase("vi"))) continue;
    if (!isAllowedUrl(href, definition)) continue;

    const sourceUrl = toAbsoluteUrl(href, definition);
    const url = new URL(sourceUrl);
    if (url.pathname === "/" || url.pathname.length < 6) continue;

    candidates.push({
      sourceId,
      sourceUrl,
      canonicalUrl: sourceUrl,
      title,
      excerpt: null,
      sourcePublishedAt: null,
    });
  }

  return uniqueCandidates(candidates, definition.maxItems);
}

export function parseNewsSourcePayload(
  sourceId: string,
  payload: string,
  definition = getNewsSourceAdapter(sourceId),
) {
  if (!definition) throw new Error(`Unsupported news source: ${sourceId}`);
  return definition.kind === "rss"
    ? parseRssNewsCandidates(sourceId, payload, definition)
    : parseHtmlNewsCandidates(sourceId, payload, definition);
}

export async function fetchNewsSourceCandidates(
  source: Pick<NewsSourceDefinition, "id">,
  fetchImpl: typeof fetch = fetch,
): Promise<NewsSourceFetchResult> {
  const definition = getNewsSourceAdapter(source.id);
  if (!definition) throw new Error(`No adapter configured for source ${source.id}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), definition.timeoutMs);

  try {
    const response = await fetchImpl(definition.entryUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: definition.kind === "rss"
          ? "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8"
          : "text/html,application/xhtml+xml;q=0.9",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) throw new Error(`Source fetch failed with HTTP ${response.status}`);

    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength > definition.maxResponseBytes) {
      throw new Error(`Source response exceeds ${definition.maxResponseBytes} bytes`);
    }

    const payload = await response.text();
    const actualBytes = new TextEncoder().encode(payload).byteLength;
    if (actualBytes > definition.maxResponseBytes) {
      throw new Error(`Source response exceeds ${definition.maxResponseBytes} bytes`);
    }

    return {
      sourceId: source.id,
      strategy: definition.kind,
      entryUrl: definition.entryUrl,
      fetchedAt: new Date().toISOString(),
      candidates: parseNewsSourcePayload(source.id, payload, definition),
    };
  } finally {
    clearTimeout(timeout);
  }
}
