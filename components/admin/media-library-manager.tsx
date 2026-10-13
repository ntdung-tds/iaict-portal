"use client";

import { useMemo, useState } from "react";
import type { MediaAsset, MediaSnapshotDto } from "@/lib/media-types";

type MediaLibraryManagerProps = {
  initialItems: MediaAsset[];
  initialRevision: number;
  storageReady: boolean;
  materialized: boolean;
};

type MediaResponse = Partial<MediaSnapshotDto> & {
  error?: string;
  message?: string;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MediaLibraryManager({
  initialItems,
  initialRevision,
  storageReady,
  materialized,
}: MediaLibraryManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [revision, setRevision] = useState(initialRevision);
  const [isMaterialized, setIsMaterialized] = useState(materialized);
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi");
    if (!needle) return items;
    return items.filter((item) =>
      [item.originalName, item.filename, item.alt, item.caption]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(needle),
    );
  }, [items, query]);

  function applyResponse(data: MediaResponse) {
    if (data.items) setItems(data.items);
    if (typeof data.revision === "number") setRevision(data.revision);
    if (typeof data.materialized === "boolean") setIsMaterialized(data.materialized);
  }

  async function upload() {
    if (!storageReady) {
      setNotice("Kho Media chưa được cấu hình.");
      return;
    }
    if (!file) {
      setNotice("Hãy chọn một ảnh để tải lên.");
      return;
    }
    if (!alt.trim()) {
      setNotice("Cần nhập mô tả ảnh (alt text).");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("alt", alt.trim());
    form.append("caption", caption.trim());
    form.append("expectedRevision", String(revision));

    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = (await response.json()) as MediaResponse;
      applyResponse(data);
      if (!response.ok) {
        setNotice(data.message ?? "Không thể tải ảnh lên.");
        return;
      }
      setFile(null);
      setAlt("");
      setCaption("");
      setIsMaterialized(true);
      setNotice("Đã tải ảnh lên Thư viện Media.");
      const input = document.getElementById("iaict-media-upload") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch {
      setNotice("Không thể kết nối API Media.");
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(item: MediaAsset) {
    setEditing(item);
    setEditAlt(item.alt);
    setEditCaption(item.caption);
    setNotice(null);
  }

  async function mutate(action: "update" | "delete", item: MediaAsset) {
    if (action === "delete" && !window.confirm(`Xóa ảnh “${item.originalName}”? Thao tác này không thể hoàn tác.`)) return;
    if (action === "update" && !editAlt.trim()) {
      setNotice("Alt text không được để trống.");
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          expectedRevision: revision,
          id: item.id,
          alt: action === "update" ? editAlt.trim() : undefined,
          caption: action === "update" ? editCaption.trim() : undefined,
        }),
      });
      const data = (await response.json()) as MediaResponse;
      applyResponse(data);
      if (!response.ok) {
        setNotice(data.message ?? "Không thể cập nhật Thư viện Media.");
        return;
      }

      if (action === "update") {
        setEditing(null);
        setNotice("Đã cập nhật alt text và caption.");
      } else {
        if (editing?.id === item.id) setEditing(null);
        setNotice("Đã xóa ảnh khỏi Thư viện Media.");
      }
    } catch {
      setNotice("Không thể kết nối API Media.");
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(item: MediaAsset) {
    try {
      await navigator.clipboard.writeText(item.publicUrl);
      setNotice(`Đã sao chép URL: ${item.publicUrl}`);
    } catch {
      setNotice(`URL ảnh: ${item.publicUrl}`);
    }
  }

  return (
    <div className="admin-media-manager">
      <section className="admin-media-upload-card">
        <div className="admin-media-upload-copy">
          <span>UPLOAD</span>
          <h2>Thêm ảnh vào thư viện</h2>
          <p>JPEG, PNG, WebP, GIF hoặc AVIF · tối đa 8 MB. Alt text là bắt buộc để đảm bảo khả năng truy cập.</p>
        </div>
        <div className="admin-media-upload-form">
          <label className="admin-media-file-field">
            <span>Chọn ảnh</span>
            <input
              id="iaict-media-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              disabled={busy || !storageReady}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <strong>{file ? `${file.name} · ${formatBytes(file.size)}` : "Chưa chọn tệp"}</strong>
          </label>
          <label>
            <span>Alt text</span>
            <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Mô tả ngắn nội dung của ảnh" />
          </label>
          <label>
            <span>Caption</span>
            <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Chú thích hiển thị dưới ảnh (không bắt buộc)" />
          </label>
          <button className="admin-button admin-button-primary" type="button" onClick={upload} disabled={busy || !storageReady}>
            {busy ? "Đang xử lý..." : "Tải ảnh lên"}
          </button>
        </div>
      </section>

      <section className="admin-media-summary">
        <div><span>Tổng ảnh</span><strong>{items.length}</strong></div>
        <div><span>Kết quả</span><strong>{filtered.length}</strong></div>
        <p>
          {storageReady
            ? isMaterialized
              ? `Private Blob hoạt động · revision ${revision}.`
              : "Kho Blob sẵn sàng. Manifest Media sẽ được tạo ở lần tải ảnh đầu tiên."
            : "Kho Blob chưa sẵn sàng; chức năng tải ảnh đang bị khóa."}
        </p>
        <div className="admin-search-box admin-media-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, alt, caption..." aria-label="Tìm ảnh" />
        </div>
      </section>

      {notice ? <div className="admin-inline-notice" role="status">{notice}</div> : null}

      {editing ? (
        <section className="admin-media-edit-panel">
          <img src={editing.publicUrl} alt={editing.alt} />
          <div>
            <span>EDIT METADATA</span>
            <h2>{editing.originalName}</h2>
            <label><span>Alt text</span><input value={editAlt} onChange={(event) => setEditAlt(event.target.value)} /></label>
            <label><span>Caption</span><textarea rows={3} value={editCaption} onChange={(event) => setEditCaption(event.target.value)} /></label>
            <div className="admin-media-edit-actions">
              <button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => mutate("update", editing)}>Lưu metadata</button>
              <button className="admin-button admin-button-secondary" type="button" disabled={busy} onClick={() => setEditing(null)}>Hủy</button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="admin-media-grid" aria-label="Danh sách ảnh">
        {filtered.map((item) => (
          <article className="admin-media-card" key={item.id}>
            <div className="admin-media-thumb"><img src={item.publicUrl} alt={item.alt} loading="lazy" /></div>
            <div className="admin-media-card-body">
              <span>{item.contentType.replace("image/", "").toUpperCase()} · {formatBytes(item.size)}</span>
              <strong title={item.originalName}>{item.originalName}</strong>
              <p>{item.alt}</p>
              {item.caption ? <small>{item.caption}</small> : <small className="muted">Chưa có caption</small>}
              <i>{formatDate(item.createdAt)}</i>
            </div>
            <div className="admin-media-card-actions">
              <button type="button" onClick={() => beginEdit(item)}>Sửa</button>
              <button type="button" onClick={() => copyUrl(item)}>Copy URL</button>
              <button className="danger" type="button" disabled={busy} onClick={() => mutate("delete", item)}>Xóa</button>
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <span>MEDIA LIBRARY</span>
          <strong>{items.length ? "Không tìm thấy ảnh phù hợp." : "Thư viện chưa có ảnh."}</strong>
          <p>{items.length ? "Thử đổi từ khóa tìm kiếm." : "Tải ảnh đầu tiên bằng biểu mẫu phía trên."}</p>
        </div>
      ) : null}
    </div>
  );
}
