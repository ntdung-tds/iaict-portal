"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ContentType = "news" | "insight" | "notice" | "event";
type ContentStatus = "published" | "draft";

type ContentItem = {
  slug: string;
  title: string;
  category: string;
  type: ContentType;
  publishedAt: string;
  excerpt: string;
  keywords: string[];
  featured: boolean;
  status: ContentStatus;
};

type DraftItem = ContentItem & {
  id: string;
  updatedAt: string;
  originSlug?: string;
};

type EditorState = {
  id?: string;
  originSlug?: string;
  title: string;
  slug: string;
  category: string;
  type: ContentType;
  excerpt: string;
  keywords: string;
  featured: boolean;
};

const EMPTY_EDITOR: EditorState = {
  title: "",
  slug: "",
  category: "Tin hoạt động Viện",
  type: "news",
  excerpt: "",
  keywords: "",
  featured: false,
};

const STORAGE_KEY = "iaict-dashboard-local-drafts-v1";

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

export function DashboardContentManager({ initialItems }: { initialItems: ContentItem[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContentType>("all");
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDrafts(JSON.parse(raw) as DraftItem[]);
    } catch {
      setDrafts([]);
    }
  }, []);

  const combined = useMemo(() => {
    const published: (ContentItem & { local?: boolean; updatedAt?: string; id?: string })[] = initialItems;
    const local = drafts.map((item) => ({ ...item, local: true }));
    return [...local, ...published];
  }, [drafts, initialItems]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return combined.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!normalized) return true;
      return [item.title, item.category, item.excerpt, item.slug, ...item.keywords]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalized);
    });
  }, [combined, query, typeFilter]);

  function startNew() {
    setEditor({ ...EMPTY_EDITOR });
    setNotice(null);
  }

  function editPublished(item: ContentItem) {
    setEditor({
      originSlug: item.slug,
      title: item.title,
      slug: item.slug,
      category: item.category,
      type: item.type,
      excerpt: item.excerpt,
      keywords: item.keywords.join(", "),
      featured: item.featured,
    });
    setNotice(null);
  }

  function editDraft(item: DraftItem) {
    setEditor({
      id: item.id,
      originSlug: item.originSlug,
      title: item.title,
      slug: item.slug,
      category: item.category,
      type: item.type,
      excerpt: item.excerpt,
      keywords: item.keywords.join(", "),
      featured: item.featured,
    });
    setNotice(null);
  }

  function persistDrafts(next: DraftItem[]) {
    setDrafts(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function saveDraft() {
    if (!editor || !editor.title.trim()) {
      setNotice("Cần nhập tiêu đề trước khi lưu bản nháp.");
      return;
    }

    const now = new Date().toISOString();
    const id = editor.id ?? `draft-${Date.now()}`;
    const item: DraftItem = {
      id,
      originSlug: editor.originSlug,
      title: editor.title.trim(),
      slug: editor.slug.trim() || slugify(editor.title),
      category: editor.category.trim() || "Chưa phân loại",
      type: editor.type,
      publishedAt: now.slice(0, 10),
      excerpt: editor.excerpt.trim(),
      keywords: editor.keywords
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      featured: editor.featured,
      status: "draft",
      updatedAt: now,
    };

    const next = drafts.some((draft) => draft.id === id)
      ? drafts.map((draft) => (draft.id === id ? item : draft))
      : [item, ...drafts];

    persistDrafts(next);
    setEditor({
      id,
      originSlug: item.originSlug,
      title: item.title,
      slug: item.slug,
      category: item.category,
      type: item.type,
      excerpt: item.excerpt,
      keywords: item.keywords.join(", "),
      featured: item.featured,
    });
    setNotice("Đã lưu bản nháp trên trình duyệt này. Chưa xuất bản ra website.");
  }

  function removeDraft(id: string) {
    const next = drafts.filter((item) => item.id !== id);
    persistDrafts(next);
    if (editor?.id === id) setEditor(null);
    setNotice("Đã xóa bản nháp cục bộ.");
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
        <button className="admin-button admin-button-primary" type="button" onClick={startNew}>
          + Tạo nội dung
        </button>
      </section>

      <section className="admin-content-summary">
        <div>
          <span>Đang hiển thị</span>
          <strong>{filtered.length}</strong>
        </div>
        <div>
          <span>Đã xuất bản</span>
          <strong>{initialItems.length}</strong>
        </div>
        <div>
          <span>Nháp cục bộ</span>
          <strong>{drafts.length}</strong>
        </div>
        <p>Bản nháp chỉ tồn tại trên trình duyệt hiện tại cho đến khi database được kết nối.</p>
      </section>

      {notice ? <div className="admin-inline-notice" role="status">{notice}</div> : null}

      {editor ? (
        <section className="admin-editor-panel" aria-label="Trình biên tập nội dung">
          <div className="admin-editor-head">
            <div>
              <span>{editor.id ? "LOCAL DRAFT" : editor.originSlug ? "EDIT COPY" : "NEW CONTENT"}</span>
              <h2>{editor.id ? "Biên tập bản nháp" : editor.originSlug ? "Tạo bản nháp từ nội dung đã xuất bản" : "Tạo nội dung mới"}</h2>
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
              <textarea
                rows={4}
                value={editor.excerpt}
                onChange={(event) => setEditor({ ...editor, excerpt: event.target.value })}
                placeholder="Nội dung tóm tắt hiển thị ở danh sách và metadata"
              />
            </label>

            <label className="admin-field admin-field-wide">
              <span>Từ khóa</span>
              <input
                value={editor.keywords}
                onChange={(event) => setEditor({ ...editor, keywords: event.target.value })}
                placeholder="AI, dữ liệu, IoT, đào tạo..."
              />
            </label>

            <label className="admin-check-field">
              <input
                type="checkbox"
                checked={editor.featured}
                onChange={(event) => setEditor({ ...editor, featured: event.target.checked })}
              />
              <span>Đánh dấu nội dung nổi bật</span>
            </label>
          </div>

          <div className="admin-editor-actions">
            <div>
              <button className="admin-button admin-button-primary" type="button" onClick={saveDraft}>Lưu bản nháp cục bộ</button>
              <button className="admin-button admin-button-disabled" type="button" disabled title="Cần kết nối CMS và xác thực trước khi xuất bản">Xuất bản</button>
            </div>
            <small>Xuất bản thật sẽ được mở sau khi xác thực, database và audit log được kết nối.</small>
          </div>
        </section>
      ) : null}

      <section className="admin-content-table-panel">
        <div className="admin-table-head">
          <span>Nội dung</span>
          <span>Loại</span>
          <span>Trạng thái</span>
          <span>Ngày</span>
          <span>Thao tác</span>
        </div>

        <div className="admin-content-rows">
          {filtered.map((item, index) => {
            const isDraft = item.status === "draft";
            const draft = isDraft ? drafts.find((entry) => entry.id === item.id) : undefined;
            return (
              <article className="admin-content-row" key={isDraft ? item.id : item.slug}>
                <div className="admin-content-title-cell">
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.category}{item.featured ? " · Nổi bật" : ""}</span>
                  </div>
                </div>
                <span>{typeLabel(item.type)}</span>
                <span className={`admin-status-pill ${isDraft ? "is-draft" : "is-published"}`}>
                  {isDraft ? "Nháp cục bộ" : "Đã xuất bản"}
                </span>
                <span>{isDraft && item.updatedAt ? `Sửa ${new Date(item.updatedAt).toLocaleDateString("vi-VN")}` : formatDate(item.publishedAt)}</span>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => draft ? editDraft(draft) : editPublished(item as ContentItem)}>Biên tập</button>
                  {!isDraft ? <Link href={`/tin-tuc/${item.slug}`}>Mở ↗</Link> : null}
                  {isDraft && item.id ? <button className="danger" type="button" onClick={() => removeDraft(item.id!)}>Xóa</button> : null}
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty-state">
            <span>0 kết quả</span>
            <strong>Không tìm thấy nội dung phù hợp.</strong>
            <p>Thử đổi từ khóa hoặc loại nội dung.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
