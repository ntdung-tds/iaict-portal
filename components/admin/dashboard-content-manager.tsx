"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type ContentType = "news" | "insight" | "notice" | "event";
type ContentStatus = "published" | "draft";

export type AdminContentItem = {
  id: string;
  originSlug?: string;
  slug: string;
  title: string;
  category: string;
  type: ContentType;
  publishedAt: string;
  readingTime: string;
  excerpt: string;
  body: string;
  keywords: string[];
  featured: boolean;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

type EditorState = {
  id?: string;
  originSlug?: string;
  title: string;
  slug: string;
  category: string;
  type: ContentType;
  excerpt: string;
  body: string;
  keywords: string;
  featured: boolean;
};

type MutationResponse = {
  revision?: number;
  updatedAt?: string;
  storageReady?: boolean;
  materialized?: boolean;
  items?: AdminContentItem[];
  error?: string;
  message?: string;
};

const EMPTY_EDITOR: EditorState = {
  title: "",
  slug: "",
  category: "Tin hoạt động Viện",
  type: "news",
  excerpt: "",
  body: "",
  keywords: "",
  featured: false,
};

function typeLabel(type: ContentType) {
  if (type === "insight") return "Góc nhìn";
  if (type === "notice") return "Thông báo";
  if (type === "event") return "Sự kiện";
  return "Tin IAICT";
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function DashboardContentManager({
  initialItems,
  initialRevision,
  storageReady,
  materialized,
}: {
  initialItems: AdminContentItem[];
  initialRevision: number;
  storageReady: boolean;
  materialized: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContentType>("all");
  const [items, setItems] = useState<AdminContentItem[]>(initialItems);
  const [revision, setRevision] = useState(initialRevision);
  const [isMaterialized, setIsMaterialized] = useState(materialized);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!normalized) return true;
      return [item.title, item.category, item.excerpt, item.slug, ...item.keywords]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalized);
    });
  }, [items, query, typeFilter]);

  const publishedCount = items.filter((item) => item.status === "published").length;
  const draftCount = items.filter((item) => item.status === "draft").length;

  function startNew() {
    setEditor({ ...EMPTY_EDITOR });
    setNotice(null);
  }

  function editItem(item: AdminContentItem) {
    setEditor({
      id: item.status === "draft" ? item.id : undefined,
      originSlug: item.status === "published" ? item.slug : item.originSlug,
      title: item.title,
      slug: item.slug,
      category: item.category,
      type: item.type,
      excerpt: item.excerpt,
      body: item.body,
      keywords: item.keywords.join(", "),
      featured: item.featured,
    });
    setNotice(null);
  }

  function editorPayload(current: EditorState) {
    return {
      id: current.id,
      originSlug: current.originSlug,
      title: current.title.trim(),
      slug: current.slug.trim() || slugify(current.title),
      category: current.category.trim() || "Tin hoạt động Viện",
      type: current.type,
      excerpt: current.excerpt.trim(),
      body: current.body.trim(),
      keywords: current.keywords
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      featured: current.featured,
    };
  }

  async function mutate(
    action: "save-draft" | "publish" | "unpublish" | "delete",
    options: { editor?: EditorState; id?: string },
  ) {
    if ((action === "save-draft" || action === "publish") && !options.editor?.title.trim()) {
      setNotice("Cần nhập tiêu đề trước khi lưu.");
      return;
    }
    if (!storageReady) {
      setNotice("Kho lưu trữ CMS chưa sẵn sàng. Không có dữ liệu nào được ghi.");
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          expectedRevision: revision,
          item: options.editor ? editorPayload(options.editor) : undefined,
          id: options.id,
        }),
      });
      const data = (await response.json()) as MutationResponse;

      if (data.items && typeof data.revision === "number") {
        setItems(data.items);
        setRevision(data.revision);
        setIsMaterialized(Boolean(data.materialized ?? true));
      }

      if (!response.ok) {
        setNotice(data.message ?? "Không thể ghi dữ liệu CMS. Vui lòng thử lại.");
        return;
      }

      if (action === "save-draft") {
        const saved = data.items?.find(
          (item) =>
            item.status === "draft" &&
            item.slug === (options.editor?.slug || slugify(options.editor?.title ?? "")),
        );
        if (saved) {
          setEditor({
            id: saved.id,
            originSlug: saved.originSlug,
            title: saved.title,
            slug: saved.slug,
            category: saved.category,
            type: saved.type,
            excerpt: saved.excerpt,
            body: saved.body,
            keywords: saved.keywords.join(", "),
            featured: saved.featured,
          });
        }
        setNotice("Đã lưu bản nháp vào kho CMS.");
      } else if (action === "publish") {
        setEditor(null);
        setNotice("Đã xuất bản. Newsroom công khai đọc trực tiếp từ kho CMS.");
      } else if (action === "unpublish") {
        setNotice("Đã gỡ xuất bản và chuyển nội dung về trạng thái nháp.");
      } else {
        if (editor?.id === options.id) setEditor(null);
        setNotice("Đã xóa bản nháp khỏi kho CMS.");
      }
    } catch {
      setNotice("Không thể kết nối API CMS.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-content-manager">
      <section className="admin-content-toolbar">
        <div className="admin-search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Tìm nội dung"
            placeholder="Tìm theo tiêu đề, chuyên mục, từ khóa..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="admin-content-filters" aria-label="Lọc theo loại nội dung">
          {(["all", "news", "insight", "notice", "event"] as const).map((value) => (
            <button
              className={typeFilter === value ? "active" : ""}
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
            >
              {value === "all" ? "Tất cả" : typeLabel(value)}
            </button>
          ))}
        </div>
        <button className="admin-button admin-button-primary" type="button" onClick={startNew} disabled={busy}>
          + Tạo nội dung
        </button>
      </section>

      <section className="admin-content-summary">
        <div><span>Đang hiển thị</span><strong>{filtered.length}</strong></div>
        <div><span>Đã xuất bản</span><strong>{publishedCount}</strong></div>
        <div><span>Bản nháp</span><strong>{draftCount}</strong></div>
        <p>
          {storageReady
            ? isMaterialized
              ? `Vercel Blob đang hoạt động · revision ${revision}.`
              : "Kho Blob đã sẵn sàng. Dữ liệu repository sẽ được materialize khi có thay đổi đầu tiên."
            : "Kho lưu trữ CMS chưa được cấu hình; các thao tác ghi bị khóa."}
        </p>
      </section>

      {notice ? <div className="admin-inline-notice" role="status">{notice}</div> : null}

      {editor ? (
        <section className="admin-editor-panel" aria-label="Trình biên tập nội dung">
          <div className="admin-editor-head">
            <div>
              <span>{editor.id ? "CMS DRAFT" : editor.originSlug ? "EDIT COPY" : "NEW CONTENT"}</span>
              <h2>{editor.id ? "Biên tập bản nháp" : editor.originSlug ? "Biên tập từ nội dung đã xuất bản" : "Tạo nội dung mới"}</h2>
            </div>
            <button type="button" onClick={() => setEditor(null)} aria-label="Đóng trình biên tập">×</button>
          </div>

          <div className="admin-editor-grid">
            <label className="admin-field admin-field-wide">
              <span>Tiêu đề</span>
              <input
                value={editor.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setEditor((current) => current ? {
                    ...current,
                    title,
                    slug: current.id || current.originSlug ? current.slug : slugify(title),
                  } : current);
                }}
                placeholder="Nhập tiêu đề bài viết"
              />
            </label>

            <label className="admin-field">
              <span>Loại nội dung</span>
              <select value={editor.type} onChange={(event) => setEditor({ ...editor, type: event.target.value as ContentType })}>
                <option value="news">Tin IAICT</option>
                <option value="insight">Góc nhìn chuyên môn</option>
                <option value="notice">Thông báo</option>
                <option value="event">Sự kiện</option>
              </select>
            </label>

            <label className="admin-field">
              <span>Chuyên mục</span>
              <input value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} />
            </label>

            <label className="admin-field admin-field-wide">
              <span>Slug</span>
              <input value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: slugify(event.target.value) })} />
            </label>

            <label className="admin-field admin-field-wide">
              <span>Mô tả ngắn</span>
              <textarea rows={4} value={editor.excerpt} onChange={(event) => setEditor({ ...editor, excerpt: event.target.value })} placeholder="Nội dung tóm tắt hiển thị ở danh sách và metadata" />
            </label>

            <div className="admin-field admin-field-wide admin-rich-field">
              <span>Nội dung chi tiết</span>
              <RichTextEditor value={editor.body} onChange={(body) => setEditor({ ...editor, body })} />
              <small className="admin-field-help">Soạn thảo trực quan hoặc chuyển sang HTML Code để kiểm soát trực tiếp mã của bài viết.</small>
            </div>

            <label className="admin-field admin-field-wide">
              <span>Từ khóa</span>
              <input value={editor.keywords} onChange={(event) => setEditor({ ...editor, keywords: event.target.value })} placeholder="AI, dữ liệu, IoT, đào tạo..." />
            </label>

            <label className="admin-check-field">
              <input type="checkbox" checked={editor.featured} onChange={(event) => setEditor({ ...editor, featured: event.target.checked })} />
              <span>Đánh dấu nội dung nổi bật</span>
            </label>
          </div>

          <div className="admin-editor-actions">
            <div>
              <button className="admin-button admin-button-secondary" type="button" disabled={busy} onClick={() => mutate("save-draft", { editor })}>{busy ? "Đang lưu..." : "Lưu bản nháp"}</button>
              <button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => mutate("publish", { editor })}>{busy ? "Đang xử lý..." : "Xuất bản"}</button>
            </div>
            <small>Lưu nháp không thay đổi bài đang công khai. Xuất bản sẽ cập nhật newsroom ngay từ kho CMS.</small>
          </div>
        </section>
      ) : null}

      <section className="admin-content-table-panel">
        <div className="admin-table-head"><span>Nội dung</span><span>Loại</span><span>Trạng thái</span><span>Ngày</span><span>Thao tác</span></div>
        <div className="admin-content-rows">
          {filtered.map((item, index) => (
            <article className="admin-content-row" key={item.id}>
              <div className="admin-content-title-cell">
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div><strong>{item.title}</strong><span>{item.category}{item.featured ? " · Nổi bật" : ""}</span></div>
              </div>
              <span>{typeLabel(item.type)}</span>
              <span className={`admin-status-pill ${item.status === "draft" ? "is-draft" : "is-published"}`}>{item.status === "draft" ? "Bản nháp" : "Đã xuất bản"}</span>
              <span>{item.status === "draft" ? `Sửa ${new Date(item.updatedAt).toLocaleDateString("vi-VN")}` : formatDate(item.publishedAt)}</span>
              <div className="admin-row-actions">
                <button type="button" disabled={busy} onClick={() => editItem(item)}>Biên tập</button>
                {item.status === "published" ? <Link href={`/tin-tuc/${item.slug}`}>Mở ↗</Link> : null}
                {item.status === "published" ? (
                  <button type="button" disabled={busy} onClick={() => mutate("unpublish", { id: item.id })}>Gỡ xuất bản</button>
                ) : (
                  <button className="danger" type="button" disabled={busy} onClick={() => mutate("delete", { id: item.id })}>Xóa</button>
                )}
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty-state"><span>0 kết quả</span><strong>Không tìm thấy nội dung phù hợp.</strong><p>Thử đổi từ khóa hoặc loại nội dung.</p></div>
        ) : null}
      </section>
    </div>
  );
}
