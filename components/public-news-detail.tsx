"use client";

import { useEffect, useState } from "react";
import liveStyles from "./public-news-live.module.css";

type PublishedNewsDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryId: string;
  publishedAt: string | null;
  sourceName: string | null;
  canonicalUrl: string | null;
  attributionText: string | null;
  body: string;
  sourcePublishedAt: string | null;
  fetchedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function PublicNewsDetail({ slug }: { slug: string }) {
  const [item, setItem] = useState<PublishedNewsDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/news/public?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as { item?: PublishedNewsDetail; error?: string };
        if (response.status === 404) {
          setState("missing");
          return;
        }
        if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
        setItem(payload.item ?? null);
        setState(payload.item ? "ready" : "missing");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Public newsroom detail failed", error);
        setState("error");
      });
    return () => controller.abort();
  }, [slug]);

  if (state === "loading") {
    return (
      <main id="main-content" className={liveStyles.detailPage}>
        <section className={liveStyles.detailHero}><div className="shell"><p>Đang tải bài viết…</p></div></section>
      </main>
    );
  }

  if (state === "missing" || state === "error" || !item) {
    return (
      <main id="main-content" className={liveStyles.detailPage}>
        <section className={liveStyles.detailHero}>
          <div className="shell">
            <p className={liveStyles.breadcrumb}><a href="/tin-tuc">Tin tức</a><span>/</span><span>Chi tiết</span></p>
            <h1>{state === "missing" ? "Không tìm thấy bài viết." : "Chưa thể tải bài viết."}</h1>
            <p className={liveStyles.detailLead}>Vui lòng quay lại trang Tin tức hoặc thử lại sau.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" className={liveStyles.detailPage} data-public-news-detail="ready">
      <section className={liveStyles.detailHero}>
        <div className="shell">
          <p className={liveStyles.breadcrumb}><a href="/tin-tuc">Tin tức</a><span>/</span><span>Bài đã xuất bản</span></p>
          <h1>{item.title}</h1>
          {item.excerpt && <p className={liveStyles.detailLead}>{item.excerpt}</p>}
          <div className={liveStyles.detailMeta}>
            <span>IAICT Newsroom</span>
            <span>{formatDate(item.publishedAt)}</span>
            <span>{item.sourceName ?? "Nguồn IAICT"}</span>
          </div>
        </div>
      </section>

      <section className={liveStyles.detailSection}>
        <div className={`shell ${liveStyles.detailGrid}`}>
          <article className={liveStyles.articleBody} dangerouslySetInnerHTML={{ __html: item.body }} />
          <aside className={liveStyles.provenance} data-news-provenance="ready">
            <span>Provenance / Nguồn gốc</span>
            <strong>{item.sourceName ?? "IAICT Newsroom"}</strong>
            <dl>
              <div><dt>Xuất bản tại IAICT</dt><dd>{formatDate(item.publishedAt)}</dd></div>
              <div><dt>Nguồn công bố</dt><dd>{formatDate(item.sourcePublishedAt)}</dd></div>
              <div><dt>Thu thập</dt><dd>{formatDate(item.fetchedAt)}</dd></div>
              <div><dt>Ghi nguồn</dt><dd>{item.attributionText ?? "Nguồn đã được lưu trong hệ thống."}</dd></div>
            </dl>
            {item.canonicalUrl && (
              <a className={liveStyles.sourceLink} href={item.canonicalUrl} target="_blank" rel="noopener noreferrer">Mở bài gốc ↗</a>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
