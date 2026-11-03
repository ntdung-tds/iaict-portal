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

  it("ignores data-href and title text impersonating the actual HTML href attribute", () => {
    const html = [
      '<a data-href="https://baochinhphu.vn/fake-story">Đây là tin giả dạng dữ liệu không có href thật</a>',
      '<a title="faked href=\'https://baochinhphu.vn/fake-title\'">Tên bài viết giả mạo đường dẫn trong tiêu đề</a>',
      '<a href="https://untrusted.example/story" data-href="https://baochinhphu.vn/fake-swap">Bài viết không được phép nhập vào nguồn tin</a>',
    ].join("");
    expect(parseHtmlNewsCandidates("chinhphu-vn", html, NEWS_SOURCE_ADAPTERS[1])).toEqual([]);
  });

  it("preserves real allowed href when an untrusted data-href precedes or follows it", () => {
    const html = [
      '<a data-href="https://untrusted.example/bait" HREF=\'https://baochinhphu.vn/verified-real-article\'>Bài viết chính sách công nghệ hợp lệ cần nhập vào nguồn</a>',
      '<a href="https://baochinhphu.vn/verified-real-article?utm_medium=feed" data-href="https://untrusted.example/other">Bài viết chính sách công nghệ hợp lệ cần nhập vào nguồn</a>',
    ].join("");
    const items = parseHtmlNewsCandidates("chinhphu-vn", html, NEWS_SOURCE_ADAPTERS[1]);
    expect(items).toHaveLength(1);
    expect(items[0].canonicalUrl).toBe("https://baochinhphu.vn/verified-real-article");
  });

  it("parses actual quoted href after an attribute containing > and an href-like string", () => {
    const html = '<a title="review > faked href=\'https://baochinhphu.vn/spoof\'" href="https://baochinhphu.vn/verified-article">Một bài hợp lệ với thuộc tính tiêu đề có dấu lớn hơn</a>';
    const items = parseHtmlNewsCandidates("chinhphu-vn", html, NEWS_SOURCE_ADAPTERS[1]);
    expect(items).toHaveLength(1);
    expect(items[0].sourceUrl).toBe("https://baochinhphu.vn/verified-article");
  });

  it("ignores a real off-allowlist href when title or data attributes contain approved URLs", () => {
    const html = '<a title="https://baochinhphu.vn/title" data-href="https://baochinhphu.vn/swap" href="https://untrusted.example/actual">Bài có đường dẫn thực tế không an toàn và phải loại bỏ</a>';
    expect(parseHtmlNewsCandidates("chinhphu-vn", html, NEWS_SOURCE_ADAPTERS[1])).toEqual([]);
  });

  it("the full HTML fetch adapter never imports data-href-only bait", async () => {
    const html = [
      '<a data-href="https://baochinhphu.vn/hidden-article">Bài viết không có liên kết thực sự để nhập vào hệ thống</a>',
      '<a href="https://untrusted.example/actual" data-href="https://baochinhphu.vn/misleading">Đường dẫn thật không được phép và không nên vào hàng chờ</a>',
      '<a href="https://baochinhphu.vn/verified-news">Chỉ bài thật thuộc nguồn tin Chính phủ được chấp nhận</a>',
    ].join("");
    const fetched = vi.fn<typeof fetch>(async () => new Response(html, { status: 200 }));
    const result = await fetchNewsSourceCandidates({ id: "chinhphu-vn" }, fetched);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].canonicalUrl).toBe("https://baochinhphu.vn/verified-news");
    expect(fetched).toHaveBeenCalledOnce();
  });

  it("does not discover article URLs inside HTML comments, script, style or template regions", () => {
    const bait = (path: string) => `<a href="https://baochinhphu.vn/${path}">Một tin chứa trong vùng ẩn không được nhập vào CMS</a>`;
    const html = [
      `<!-- ${bait("comment-bait")} -->`,
      `<script>const fake = ${JSON.stringify(bait("script-bait"))};</script>`,
      `<style>${bait("style-bait")}</style>`,
      `<template>${bait("template-bait")}</template>`,
      '<a href="https://baochinhphu.vn/visible-real">Bài viết thật sự hiển thị trên trang nguồn tin</a>',
    ].join("");
    const items = parseHtmlNewsCandidates("chinhphu-vn", html, NEWS_SOURCE_ADAPTERS[1]);
    expect(items.map(item => item.sourceUrl)).toEqual(["https://baochinhphu.vn/visible-real"]);
  });

  it("does not treat an unclosed HTML comment or script as a navigational article", () => {
    const html = '<a href="https://baochinhphu.vn/genuine-visible">Bài viết thực sự nằm trước vùng HTML không hợp lệ</a>' +
      '<!-- <a href="https://baochinhphu.vn/hidden">Bài viết giả nằm trong bình luận chưa đóng</a>';
    const items = parseHtmlNewsCandidates("chinhphu-vn", html, NEWS_SOURCE_ADAPTERS[1]);
    expect(items.map(item => item.sourceUrl)).toEqual(["https://baochinhphu.vn/genuine-visible"]);
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

  it("rejects approved-host redirects to a nonstandard HTTPS port", async () => {
    const mock = vi.fn<typeof fetch>(async () => new Response(null, {
      status: 302, headers: { location: "https://mst.gov.vn:8443/rss/private" },
    }));
    await expect(fetchNewsSourceCandidates({ id: "mst-gov-vn" }, mock))
      .rejects.toThrow("News source redirect target is not approved");
    expect(mock).toHaveBeenCalledOnce();
  });

  it("rejects RSS and HTML article candidate URLs with custom ports or credentials", () => {
    const rss = '<rss><channel><item>' +
      '<title>Nội dung công nghệ Việt Nam cập nhật</title>' +
      '<link>https://mst.gov.vn:9443/unsafe</link>' +
      '</item><item>' +
      '<title>Nội dung khoa học Việt Nam mới nhất</title>' +
      '<link>https://tester:secret@mst.gov.vn/unsafe</link>' +
      '</item></channel></rss>';
    expect(parseRssNewsCandidates("mst-gov-vn", rss, NEWS_SOURCE_ADAPTERS[0])).toEqual([]);
    const html = '<a href="https://baochinhphu.vn:9000/unsafe">Tin chính sách kinh tế xã hội mới</a>' +
      '<a href="https://tester:secret@baochinhphu.vn/unsafe">Tin xây dựng Chính phủ điện tử</a>';
    expect(parseHtmlNewsCandidates("chinhphu-vn", html, NEWS_SOURCE_ADAPTERS[1])).toEqual([]);
  });

  it("does not throw on invalid XML numeric entities in RSS titles or summaries", () => {
    const rss = '<rss><channel><item>' +
      '<title>Tin khoa học mới nhất &#x110000; về nghiên cứu</title>' +
      '<link>https://mst.gov.vn/tin-khoa-hoc</link>' +
      '<description>Thông tin &#99999999999999999999; và &#xD800; và &#x1; không hợp lệ.</description>' +
      '</item></channel></rss>';
    expect(() => parseRssNewsCandidates("mst-gov-vn", rss, NEWS_SOURCE_ADAPTERS[0]))
      .not.toThrow();
    const rows = parseRssNewsCandidates("mst-gov-vn", rss, NEWS_SOURCE_ADAPTERS[0]);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toContain("Tin khoa học");
    expect(rows[0].excerpt).toContain("không hợp lệ");
    expect(rows[0].excerpt).toContain("\uFFFD");
    expect(rows[0].excerpt).not.toContain("\u0001");
  });

  it("accepts the implicit HTTPS default port but not custom ports", async () => {
    const payload = "<rss><channel><item><title>Tin khoa học mới Việt Nam</title>" +
      "<link>https://mst.gov.vn:443/tin-moi</link></item></channel></rss>";
    const mock = vi.fn<typeof fetch>(async (url) => String(url).endsWith(".rss")
      ? new Response(null, { status: 302, headers: { location: "https://mst.gov.vn:443/rss/new.xml" } })
      : new Response(payload, { status: 200 }));
    const result = await fetchNewsSourceCandidates({ id: "mst-gov-vn" }, mock);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].sourceUrl).toBe("https://mst.gov.vn/tin-moi");
  });

  it("does not await a stalled redirect-body cancellation before the next approved fetch", async () => {
    const payload = "<rss><channel><item><title>Tin khoa học Việt Nam mới nhất</title>" +
      "<link>https://mst.gov.vn/tin-moi</link></item></channel></rss>";
    const hungBody = new ReadableStream<Uint8Array>({
      cancel() { return new Promise<void>(() => {}); },
    });
    let count = 0;
    const mock = vi.fn<typeof fetch>(async () => ++count === 1
      ? new Response(hungBody, { status: 302, headers: { location: "/rss/updated.xml" } })
      : new Response(payload, { status: 200 }));
    const result = await fetchNewsSourceCandidates({ id: "mst-gov-vn" }, mock);
    expect(result.candidates).toHaveLength(1);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("cancels declared oversized response bodies even before streaming reads", async () => {
    let cancelled = false;
    const response = new Response(new ReadableStream<Uint8Array>({
      cancel() { cancelled = true; },
    }), { status: 200, headers: { "content-length": "1500001" } });
    await expect(fetchNewsSourceCandidates({ id: "mst-gov-vn" }, vi.fn(async () => response)))
      .rejects.toThrow("Source response exceeds 1500000 bytes");
    expect(cancelled).toBe(true);
  });

  it("rejects unknown source adapters", async () => {
    await expect(fetchNewsSourceCandidates({ id: "unknown" }, vi.fn<typeof fetch>())).rejects.toThrow(
      "No adapter configured",
    );
  });
});
