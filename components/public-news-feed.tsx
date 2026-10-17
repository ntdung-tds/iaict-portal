"use client";

import { publicApiUrl, publicContentUrl } from "@/lib/public-preview";

import { useEffect, useState } from "react";
import publicStyles from "./public.module.css";
import liveStyles from "./public-news-live.module.css";

type PublishedNewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryId: string;
  publishedAt: string | null;
  sourceName: string | null;
  canonicalUrl: string | null;
  attributionText: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Chưa có thời gian xuất bản";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function PublicNewsFeed() {
  const [items, setItems] = useState<PublishedNewsItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(publicApiUrl("/api/news/public?limit=12"), { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { items?: PublishedNewsItem[]; error?: string };
        if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
        setItems(payload.items ?? []);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Public newsroom feed failed", error);
        setState("error");
      });
    return () => controller.abort();
  }, []);

  if (state === "loading") {
    return <div className={liveStyles.feedState} data-public-news-state="loading">Đang tải các bài viết đã xuất bản…</div>;
  }

  if (state === "error") {
    return <div className={liveStyles.feedState} data-public-news-state="error">Chưa thể tải luồng tin lúc này. Vui lòng thử lại sau.</div>;
  }

  if (items.length === 0) {
    return <div className={liveStyles.feedState} data-public-news-state="ready">Chưa có bài viết nào được xuất bản từ Newsroom.</div>;
  }

  return (
    <div className={publicStyles.newsGrid} data-public-news-state="ready">
      {items.map((item) => (
        <article className={publicStyles.newsCard} key={item.id} data-news-slug={item.slug}>
          <span>{item.sourceName ?? "IAICT Newsroom"}</span>
          <h3>
            <a className={liveStyles.cardLink} href={publicContentUrl(`/tin-tuc/${encodeURIComponent(item.slug)}`)}>{item.title}</a>
          </h3>
          <p>{item.excerpt ?? "Bài viết đã được duyệt và xuất bản từ IAICT Newsroom."}</p>
          <small>{formatDate(item.publishedAt)} · Có truy vết nguồn</small>
        </article>
      ))}
    </div>
  );
}
