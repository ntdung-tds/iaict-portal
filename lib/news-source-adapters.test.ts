import { describe, expect, it, vi } from "vitest";
import {
  NEWS_SOURCE_ADAPTERS,
  fetchNewsSourceCandidates,
  getNewsSourceAdapter,
  parseHtmlNewsCandidates,
  parseRssNewsCandidates,
} from "./news-source-adapters";

describe("V16 news source adapters", () => {
  it("uses the verified MST RSS endpoint", () => {
    const adapter = getNewsSourceAdapter("mst-gov-vn");
    expect(adapter?.kind).toBe("rss");
    expect(adapter?.entryUrl).toBe("https://mst.gov.vn/rss/tin-tuc-su-kien.rss");
  });

  it("parses RSS metadata without importing full article content", () => {
    const definition = NEWS_SOURCE_ADAPTERS[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss><channel>
        <item>
          <title><![CDATA[Ứng dụng AI trong khoa học và công nghệ]]></title>
          <link>https://mst.gov.vn/tin-a?utm_source=rss</link>
          <description><![CDATA[<p>Mô tả ngắn của bài viết.</p>]]></description>
          <pubDate>Wed, 14 Oct 2026 03:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Ứng dụng AI trong khoa học và công nghệ</title>
          <link>https://mst.gov.vn/tin-a</link>
        </item>
      </channel></rss>`;

    const candidates = parseRssNewsCandidates("mst-gov-vn", xml, definition);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      sourceId: "mst-gov-vn",
      canonicalUrl: "https://mst.gov.vn/tin-a",
      title: "Ứng dụng AI trong khoa học và công nghệ",
      excerpt: "Mô tả ngắn của bài viết.",
      sourcePublishedAt: "2026-10-14T03:00:00.000Z",
    });
  });

  it("filters Government Portal HTML to approved hosts and article-like links", () => {
    const definition = NEWS_SOURCE_ADAPTERS[1];
    const html = `
      <nav><a href="/">Trang chủ</a></nav>
      <a href="https://example.com/bad">Một liên kết ngoài không được phép đi vào nguồn tin</a>
      <a href="https://baochinhphu.vn/hoan-thien-noi-dung-chinh-sach-102261014123456.htm">
        Hoàn thiện nội dung các chính sách, khẩn trương xây dựng hồ sơ dự án luật
      </a>
      <a href="https://baochinhphu.vn/hoan-thien-noi-dung-chinh-sach-102261014123456.htm?utm_source=portal">
        Hoàn thiện nội dung các chính sách, khẩn trương xây dựng hồ sơ dự án luật
      </a>`;

    const candidates = parseHtmlNewsCandidates("chinhphu-vn", html, definition);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].canonicalUrl).toBe(
      "https://baochinhphu.vn/hoan-thien-noi-dung-chinh-sach-102261014123456.htm",
    );
  });

  it("enforces fetch size and returns parsed candidates through an injected fetch", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(
      `<rss><channel><item><title>Tin khoa học công nghệ mới nhất</title><link>https://mst.gov.vn/tin-moi</link></item></channel></rss>`,
      { status: 200, headers: { "content-type": "application/rss+xml" } },
    ));

    const result = await fetchNewsSourceCandidates({ id: "mst-gov-vn" }, fetchMock);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.strategy).toBe("rss");
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].sourceUrl).toBe("https://mst.gov.vn/tin-moi");
  });

  it("rejects unknown source adapters", async () => {
    await expect(fetchNewsSourceCandidates({ id: "unknown" }, vi.fn<typeof fetch>())).rejects.toThrow(
      "No adapter configured",
    );
  });
});
