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


  it("rejects unapproved redirect targets without fetching the destination", async () => {
    const mock = vi.fn<typeof fetch>(async () =>
      new Response(null, { status: 302, headers: { location: "https://untrusted.example.test/redirected.xml" } }));
    await expect(fetchNewsSourceCandidates({ id: "mst-gov-vn" }, mock))
      .rejects.toThrow("News source redirect target is not approved");
    expect(mock).toHaveBeenCalledOnce();
    expect(mock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });

  it("follows a bounded relative HTTPS redirect on the approved host", async () => {
    const payload = "<rss><channel><item><title>Tin khoa học công nghệ mới nhất</title>" +
      "<link>https://mst.gov.vn/tin-moi</link></item></channel></rss>";
    const mock = vi.fn<typeof fetch>(async (url) => {
      if (String(url) === "https://mst.gov.vn/rss/tin-tuc-su-kien.rss") {
        return new Response(null, { status: 302, headers: { location: "/rss/updated.xml" } });
      }
      return new Response(payload, { status: 200 });
    });
    const result = await fetchNewsSourceCandidates({ id: "mst-gov-vn" }, mock);
    expect(result.candidates).toHaveLength(1);
    expect(mock.mock.calls.map(([url]) => String(url))).toEqual([
      "https://mst.gov.vn/rss/tin-tuc-su-kien.rss",
      "https://mst.gov.vn/rss/updated.xml",
    ]);
    expect(mock.mock.calls.every(([, init]) => init?.redirect === "manual")).toBe(true);
  });

  it("stops redirect loops at a small bounded hop count", async () => {
    const mock = vi.fn<typeof fetch>(async () =>
      new Response(null, { status: 302, headers: { location: "/rss/tin-tuc-su-kien.rss" } }));
    await expect(fetchNewsSourceCandidates({ id: "mst-gov-vn" }, mock))
      .rejects.toThrow("News source exceeded redirect limit");
    expect(mock.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("cancels streaming responses once actual bytes exceed the cap, even without Content-Length", async () => {
    let cancelled = false;
    let pulls = 0;
    const mock = vi.fn<typeof fetch>(async () => new Response(new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls > 8) return controller.close();
        controller.enqueue(new Uint8Array(400_000));
      },
      cancel() { cancelled = true; },
    }), { status: 200 }));
    await expect(fetchNewsSourceCandidates({ id: "mst-gov-vn" }, mock))
      .rejects.toThrow("Source response exceeds 1500000 bytes");
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(8);
  });

  it("refuses declared excessive Content-Length before reading a body", async () => {
    const mock = vi.fn<typeof fetch>(async () => new Response(new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array([65])); controller.close(); },
    }), { status: 200, headers: { "content-length": "1500001" } }));
    await expect(fetchNewsSourceCandidates({ id: "mst-gov-vn" }, mock))
      .rejects.toThrow("Source response exceeds 1500000 bytes");
    expect(mock).toHaveBeenCalledOnce();
  });

  it("rejects unknown source adapters", async () => {
    await expect(fetchNewsSourceCandidates({ id: "unknown" }, vi.fn<typeof fetch>())).rejects.toThrow(
      "No adapter configured",
    );
  });
});
