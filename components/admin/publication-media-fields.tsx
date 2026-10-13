"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MediaAsset } from "@/lib/media-types";

type Target = "cover" | "og";

type MediaResponse = {
  items?: MediaAsset[];
  message?: string;
};

type PublicationMediaFieldsProps = {
  coverMediaId?: string;
  ogMediaId?: string;
  onChange: (value: { coverMediaId?: string; ogMediaId?: string }) => void;
};

export function PublicationMediaFields({ coverMediaId, ogMediaId, onChange }: PublicationMediaFieldsProps) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [query, setQuery] = useState("");

  const cover = items.find((item) => item.id === coverMediaId);
  const og = items.find((item) => item.id === ogMediaId);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi");
    if (!needle) return items;
    return items.filter((item) => `${item.originalName} ${item.alt} ${item.caption}`.toLocaleLowerCase("vi").includes(needle));
  }, [items, query]);

  async function loadMedia() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const data = (await response.json()) as MediaResponse;
      if (!response.ok) {
        setError(data.message ?? "Không thể tải Thư viện Media.");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError("Không thể kết nối Thư viện Media.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMedia();
  }, []);

  async function openPicker(nextTarget: Target) {
    setTarget(nextTarget);
    setQuery("");
    if (!items.length && !loading) await loadMedia();
  }

  function choose(asset: MediaAsset) {
    if (target === "cover") onChange({ coverMediaId: asset.id, ogMediaId });
    if (target === "og") onChange({ coverMediaId, ogMediaId: asset.id });
    setTarget(null);
  }

  function clear(which: Target) {
    if (which === "cover") onChange({ coverMediaId: undefined, ogMediaId });
    else onChange({ coverMediaId, ogMediaId: undefined });
  }

  function preview(asset: MediaAsset | undefined, which: Target) {
    const title = which === "cover" ? "Ảnh đại diện / Thumbnail" : "Ảnh chia sẻ OpenGraph";
    const description = which === "cover"
      ? "Hiển thị ở trang chủ, newsroom, tìm kiếm và đầu bài viết."
      : "Dùng khi chia sẻ bài lên mạng xã hội. Nếu để trống, hệ thống tự dùng ảnh đại diện.";

    return (
      <div className="admin-publication-media-card">
        <div className="admin-publication-media-copy">
          <span>{title}</span>
          <small>{description}</small>
        </div>
        {asset ? (
          <div className="admin-publication-media-selected">
            <img src={asset.publicUrl} alt={asset.alt} />
            <div><strong>{asset.alt}</strong><small>{asset.originalName}</small></div>
          </div>
        ) : (
          <div className="admin-publication-media-empty"><span>Chưa chọn ảnh</span></div>
        )}
        <div className="admin-publication-media-actions">
          <button type="button" onClick={() => openPicker(which)}>{asset ? "Đổi ảnh" : "Chọn từ thư viện"}</button>
          {asset ? <button type="button" className="subtle" onClick={() => clear(which)}>Bỏ chọn</button> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-publication-media-fields">
      <div className="admin-publication-media-head">
        <div><span>MEDIA & SOCIAL</span><strong>Ảnh đại diện và ảnh chia sẻ</strong></div>
        <Link href="/dashboard/thu-vien">Mở Thư viện Media ↗</Link>
      </div>
      <div className="admin-publication-media-grid">
        {preview(cover, "cover")}
        {preview(og, "og")}
      </div>
      {error ? <p className="admin-publication-media-error">{error}</p> : null}

      {target ? (
        <div className="admin-media-picker-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setTarget(null);
        }}>
          <section className="admin-media-picker admin-cover-picker" role="dialog" aria-modal="true" aria-label="Chọn ảnh bài viết">
            <div className="admin-media-picker-head">
              <div><span>{target === "cover" ? "THUMBNAIL" : "OPEN GRAPH"}</span><strong>Chọn ảnh từ Thư viện Media</strong></div>
              <button type="button" aria-label="Đóng" onClick={() => setTarget(null)}>×</button>
            </div>
            <div className="admin-cover-picker-tools">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên ảnh, alt text, caption..." aria-label="Tìm ảnh" />
              <button type="button" onClick={() => void loadMedia()} disabled={loading}>{loading ? "Đang tải..." : "Làm mới"}</button>
            </div>
            <div className="admin-media-picker-body">
              {loading ? <div className="admin-media-picker-empty">Đang tải Thư viện Media...</div> : null}
              {!loading && error ? <div className="admin-media-picker-empty">{error}</div> : null}
              {!loading && !error && filtered.length ? (
                <div className="admin-media-picker-grid">
                  {filtered.map((item) => (
                    <button type="button" key={item.id} className="admin-media-picker-item" onClick={() => choose(item)}>
                      <img src={item.publicUrl} alt={item.alt} loading="lazy" />
                      <span>{item.originalName}</span>
                      <small>{item.alt}</small>
                    </button>
                  ))}
                </div>
              ) : null}
              {!loading && !error && !filtered.length ? (
                <div className="admin-media-picker-empty">Chưa có ảnh phù hợp. <Link href="/dashboard/thu-vien">Tải ảnh lên Thư viện Media</Link>.</div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
