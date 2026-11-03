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

/** XML numeric references must resolve to valid Unicode scalar values. */
function validXmlCodePoint(value: number) {
  // XML 1.0 Char production: TAB / LF / CR, valid BMP text, or supplementary scalar.
  return Number.isInteger(value) && (value === 0x9 || value === 0xa || value === 0xd
    || (value >= 0x20 && value <= 0xd7ff)
    || (value >= 0xe000 && value <= 0xfffd)
    || (value >= 0x10000 && value <= 0x10ffff));
}

function decodeEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return validXmlCodePoint(codePoint) ? String.fromCodePoint(codePoint) : "\uFFFD";
    }
    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return validXmlCodePoint(codePoint) ? String.fromCodePoint(codePoint) : "\uFFFD";
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
    return url.protocol === "https:" && !url.port && !url.username && !url.password
      && definition.allowedHosts.includes(url.hostname.toLowerCase());
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

// Keep quoted attributes intact, including a literal ">" inside their value.
const HTML_ANCHOR_RE = /<a\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/a>/gi;
// Only the actual `href` attribute counts, never data-href or title text.
const HTML_ATTRIBUTE_RE = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function getAnchorHref(attributes: string) {
  for (const match of attributes.matchAll(HTML_ATTRIBUTE_RE)) {
    if (match[1].toLowerCase() === "href") return match[2] ?? match[3];
  }
  return null;
}
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

  for (const match of html.matchAll(HTML_ANCHOR_RE)) {
    const rawHref = getAnchorHref(match[1]);
    if (!rawHref) continue;
    const href = decodeEntities(rawHref).trim();
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

const MAX_SOURCE_REDIRECTS = 3;
const SOURCE_REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

function checkAllowedFeedUrl(value: string, definition: NewsSourceAdapterDefinition) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("News source redirect target is not approved");
  }
  if (url.protocol !== "https:" || url.port || !definition.allowedHosts.includes(url.hostname.toLowerCase())
    || url.username || url.password) {
    throw new Error("News source redirect target is not approved");
  }
  url.hash = "";
  return url.toString();
}

async function readBoundedFeed(response: Response, maxBytes: number) {
  const lengthHeader = response.headers.get("content-length");
  if (lengthHeader !== null && /^\d+$/.test(lengthHeader.trim()) && Number(lengthHeader) > maxBytes) {
    void response.body?.cancel().catch(() => {});
    throw new Error("Source response exceeds " + maxBytes + " bytes");
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let byteCount = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteCount += value.byteLength;
      if (byteCount > maxBytes) {
        // An untrusted stream's cancellation may never resolve; fail closed immediately.
        void reader.cancel().catch(() => {});
        throw new Error("Source response exceeds " + maxBytes + " bytes");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export async function fetchNewsSourceCandidates(
  source: Pick<NewsSourceDefinition, "id">,
  fetchImpl: typeof fetch = fetch,
): Promise<NewsSourceFetchResult> {
  const definition = getNewsSourceAdapter(source.id);
  if (!definition) throw new Error("No adapter configured for source " + source.id);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), definition.timeoutMs);

  try {
    let url = checkAllowedFeedUrl(definition.entryUrl, definition);
    let response: Response | undefined;
    for (let hop = 0; hop <= MAX_SOURCE_REDIRECTS; hop++) {
      const current = await fetchImpl(url, {
        method: "GET",
        // A trusted upstream can redirect to an unapproved or private origin.
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: definition.kind === "rss"
            ? "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8"
            : "text/html,application/xhtml+xml;q=0.9",
          "User-Agent": USER_AGENT,
        },
      });

      if (!SOURCE_REDIRECT_CODES.has(current.status)) {
        response = current;
        break;
      }
      // Redirect bodies are unused; cancel even on invalid targets, without
      // waiting for a potentially stalled remote stream's cancel promise.
      void current.body?.cancel().catch(() => {});
      if (hop === MAX_SOURCE_REDIRECTS) throw new Error("News source exceeded redirect limit");
      const location = current.headers.get("location");
      if (!location) throw new Error("News source redirect missing Location");
      try {
        url = checkAllowedFeedUrl(new URL(location, url).toString(), definition);
      } catch {
        throw new Error("News source redirect target is not approved");
      }
    }

    if (!response) throw new Error("News source exceeded redirect limit");
    if (!response.ok) throw new Error("Source fetch failed with HTTP " + response.status);

    // response.text() allocates the whole stream before the max is checked.
    const payload = await readBoundedFeed(response, definition.maxResponseBytes);

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
