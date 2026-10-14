"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import entries from "@/lib/search-index.json";
import { searchPublicContent } from "@/lib/public-search";

const categories = ["Tất cả", "Công nghệ", "Giải pháp", "Đào tạo", "Dự án", "Tri thức", "Về Viện"];
const suggestions = ["AI", "IoT", "Trâm Rừng", "Đào tạo"];
const resultsId = "public-search-results";

export function PublicSearch() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [ready, setReady] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const q = (params.get("q") ?? "").slice(0, 120);
      const group = params.get("nhom") ?? "Tất cả";
      setDraft(q);
      setQuery(q);
      setCategory(categories.includes(group) ? group : "Tất cả");
    };

    sync();
    setReady(true);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  function search(value: string, group = category) {
    const q = value.trim().slice(0, 120);
    setDraft(q);
    setQuery(q);
    setCategory(group);

    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    if (group !== "Tất cả") url.searchParams.set("nhom", group);
    else url.searchParams.delete("nhom");
    window.history.pushState(null, "", url);
  }

  const results = searchPublicContent(entries, query, category);

  return (
    <div className="public-search" data-ready={ready}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search(draft);
        }}
      >
        <label htmlFor="site-search">Tìm trong nội dung IAICT</label>
        <div className="public-search-box">
          <input
            ref={input}
            id="site-search"
            name="q"
            type="search"
            maxLength={120}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ví dụ: AI, IoT, Trâm Rừng, đào tạo..."
            aria-describedby="public-search-help"
          />
          <button disabled={!ready} type="submit" aria-controls={resultsId}>
            Tìm kiếm <span aria-hidden="true">↗</span>
          </button>
        </div>
        <p id="public-search-help">Tìm theo tên, chủ đề hoặc mô tả. Có thể nhập tiếng Việt không dấu.</p>
      </form>

      <div className="public-search-suggestions" role="group" aria-label="Gợi ý tìm kiếm">
        <span>Gợi ý:</span>
        {suggestions.map((value) => (
          <button
            disabled={!ready}
            type="button"
            key={value}
            aria-controls={resultsId}
            onClick={() => search(value, "Tất cả")}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="public-search-filters" role="group" aria-label="Lọc nhóm nội dung">
        {categories.map((value) => (
          <button
            disabled={!ready}
            type="button"
            key={value}
            aria-controls={resultsId}
            aria-pressed={category === value}
            onClick={() => search(query, value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="public-search-status">
        <p role="status" aria-live="polite" aria-atomic="true">
          {results.length} kết quả{query ? ` cho “${query}”` : " trong nội dung đang công khai"}
        </p>
        {(query || category !== "Tất cả") && (
          <button
            type="button"
            aria-controls={resultsId}
            onClick={() => {
              search("", "Tất cả");
              input.current?.focus();
            }}
          >
            Xóa tìm kiếm & bộ lọc
          </button>
        )}
      </div>

      <div id={resultsId} className="public-search-results" role="region" aria-label="Kết quả tìm kiếm IAICT">
        {results.map((item) => (
          <article key={item.href + item.title}>
            <span>{item.category}</span>
            <h3>
              <Link href={item.href}>
                {item.title}<span aria-hidden="true">↗</span>
              </Link>
            </h3>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>

      {results.length === 0 && (
        <div className="public-search-empty">
          <h3>Chưa tìm thấy nội dung phù hợp.</h3>
          <p>Thử từ khóa ngắn hơn hoặc chọn “Tất cả”. Bạn cũng có thể xem các nhóm nội dung bên dưới.</p>
          <button
            type="button"
            aria-controls={resultsId}
            onClick={() => {
              search("", "Tất cả");
              input.current?.focus();
            }}
          >
            Xem tất cả nội dung
          </button>
        </div>
      )}
    </div>
  );
}
