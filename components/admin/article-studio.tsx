"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CmsRoleCode } from "@/lib/cms-roles";
import styles from "./article-studio.module.css";

type Category = { id: string; name: string; slug: string; sort_order: number };
type Article = {
  id: string; title: string; slug: string; category_id: string; category_name: string; status: string;
  body: string; excerpt: string | null; tags_json: string; hero_media_id: string | null; seo_json: string;
  featured: number; updated_at: string; published_at: string | null;
};
type Payload = { articles: Article[]; categories: Category[]; actor: { roles: CmsRoleCode[] } };

const emptyArticle = { title: "", slug: "", category_id: "", status: "draft", body: "", excerpt: "", tags_json: "[]", hero_media_id: "", seo_json: "{}", featured: false };

export function ArticleStudio() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<CmsRoleCode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>(emptyArticle);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState<"articles" | "categories">("articles");
  const [categoryDraft, setCategoryDraft] = useState({ id: "", name: "", slug: "", sort_order: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selected = useMemo(() => articles.find((item) => item.id === selectedId) ?? null, [articles, selectedId]);
  const canEdit = roles.includes("admin") || roles.includes("editor");
  const canDelete = roles.includes("admin");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    const response = await fetch(`/api/admin/cms/articles?${params}`, { cache: "no-store" });
    const payload = await response.json() as Payload & { error?: string };
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    setRoles(payload.actor.roles ?? []);
    setArticles(payload.articles);
    setCategories(payload.categories);
    setSelectedId((current) => {
      const item = current ? payload.articles.find((article) => article.id === current) : payload.articles[0];
      if (item) setDraft({ ...item, featured: item.featured === 1 });
      else setDraft({ ...emptyArticle, category_id: payload.categories[0]?.id ?? "" });
      return item?.id ?? null;
    });
  }, [q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause))), q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, q]);

  function selectArticle(item: Article) { setSelectedId(item.id); setDraft({ ...item, featured: item.featured === 1 }); setError(null); setMessage(null); }
  function startNew() { if (!canEdit) return; setSelectedId(null); setDraft({ ...emptyArticle, category_id: categories[0]?.id ?? "" }); }

  async function saveArticle() {
    if (!canEdit) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/cms/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save-article", id: selectedId, data: draft }) });
      const payload = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setSelectedId(payload.id ?? selectedId); setMessage(selectedId ? "Đã lưu bài viết." : "Đã tạo bài viết."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  async function deleteArticle() {
    if (!canDelete || !selectedId || !window.confirm("Xóa bài viết này? Revision trước khi xóa sẽ được lưu.")) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/cms/articles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "article", id: selectedId }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setSelectedId(null); setMessage("Đã xóa bài viết."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  async function saveCategory() {
    if (!canEdit) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/cms/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save-category", id: categoryDraft.id || null, data: categoryDraft }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setCategoryDraft({ id: "", name: "", slug: "", sort_order: 0 }); setMessage("Đã lưu chuyên mục."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  async function deleteCategory(id: string) {
    if (!canDelete || !window.confirm("Xóa chuyên mục này? Chuyên mục đang có bài viết sẽ không thể xóa.")) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/cms/articles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "category", id }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setMessage("Đã xóa chuyên mục."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  const disabled = busy || !canEdit;

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><span>IAICT CMS / EDITORIAL</span><h1>Bài viết & Chuyên mục</h1><p>Soạn bài viết trực tiếp hoặc tiếp tục dùng Newsroom cho nguồn tin tự động. Bài viết ở trạng thái Published xuất hiện trên trang Tin tức.</p></div>
        <div className={styles.tabs}><button className={mode === "articles" ? styles.activeTab : ""} onClick={() => setMode("articles")}>Bài viết</button><button className={mode === "categories" ? styles.activeTab : ""} onClick={() => setMode("categories")}>Chuyên mục</button></div>
      </header>
      {!canEdit && roles.length ? <div className={styles.success}>Chế độ chỉ đọc theo vai trò hiện tại.</div> : null}
      {(error || message) ? <div className={error ? styles.error : styles.success}>{error ?? message}</div> : null}

      {mode === "articles" ? <>
        <div className={styles.toolbar}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tiêu đề, slug, tóm tắt…" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Đã xuất bản</option><option value="archived">Lưu trữ</option></select>
          {canEdit ? <button onClick={startNew}>+ Bài viết mới</button> : null}
        </div>
        <section className={styles.workspace}>
          <aside className={styles.list}>{articles.map((item) => <button key={item.id} className={item.id === selectedId ? styles.itemActive : styles.item} onClick={() => selectArticle(item)}><small>{item.category_name} · {item.status}</small><strong>{item.title}</strong><span>{item.slug}</span></button>)}{articles.length === 0 ? <div className={styles.empty}>Chưa có bài viết phù hợp.</div> : null}</aside>
          <section className={styles.editor}>
            <div className={styles.grid}>
              <label><span>Tiêu đề *</span><input disabled={disabled} value={String(draft.title ?? "")} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
              <label><span>Slug</span><input disabled={disabled} value={String(draft.slug ?? "")} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="Tự tạo nếu để trống" /></label>
              <label><span>Chuyên mục *</span><select disabled={disabled} value={String(draft.category_id ?? "")} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
              <label><span>Trạng thái</span><select disabled={disabled} value={String(draft.status ?? "draft")} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Đã xuất bản</option><option value="archived">Lưu trữ</option></select></label>
              <label className={styles.wide}><span>Tóm tắt</span><textarea disabled={disabled} rows={3} value={String(draft.excerpt ?? "")} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></label>
              <label className={styles.wide}><span>Nội dung *</span><textarea disabled={disabled} rows={16} value={String(draft.body ?? "")} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
              <label><span>Tags JSON</span><textarea disabled={disabled} rows={5} value={String(draft.tags_json ?? "[]")} onChange={(e) => setDraft({ ...draft, tags_json: e.target.value })} spellCheck={false} /></label>
              <label><span>SEO JSON</span><textarea disabled={disabled} rows={5} value={String(draft.seo_json ?? "{}")} onChange={(e) => setDraft({ ...draft, seo_json: e.target.value })} spellCheck={false} /></label>
              <label><span>Hero Media ID</span><input disabled={disabled} value={String(draft.hero_media_id ?? "")} onChange={(e) => setDraft({ ...draft, hero_media_id: e.target.value })} /></label>
              <label className={styles.check}><input disabled={disabled} type="checkbox" checked={Boolean(draft.featured)} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} /><span>Bài viết nổi bật</span></label>
            </div>
            {canEdit ? <div className={styles.actions}><button disabled={busy} onClick={() => void saveArticle()}>{busy ? "Đang lưu…" : selectedId ? "Lưu thay đổi" : "Tạo bài viết"}</button>{selected && canDelete ? <button className={styles.delete} disabled={busy} onClick={() => void deleteArticle()}>Xóa</button> : null}</div> : null}
          </section>
        </section>
      </> : <section className={styles.categories}>
        <div className={styles.categoryForm}><h2>{categoryDraft.id ? "Sửa chuyên mục" : "Thêm chuyên mục"}</h2><label><span>Tên chuyên mục *</span><input disabled={disabled} value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /></label><label><span>Slug</span><input disabled={disabled} value={categoryDraft.slug} onChange={(e) => setCategoryDraft({ ...categoryDraft, slug: e.target.value })} placeholder="Tự tạo nếu để trống" /></label><label><span>Thứ tự</span><input disabled={disabled} type="number" value={categoryDraft.sort_order} onChange={(e) => setCategoryDraft({ ...categoryDraft, sort_order: Number(e.target.value) })} /></label>{canEdit ? <button disabled={busy} onClick={() => void saveCategory()}>Lưu chuyên mục</button> : null}</div>
        <div className={styles.categoryList}>{categories.map((cat) => <article key={cat.id}><div><strong>{cat.name}</strong><span>{cat.slug}</span></div><small>#{cat.sort_order}</small>{canEdit ? <button onClick={() => setCategoryDraft(cat)}>Sửa</button> : null}{canDelete ? <button className={styles.deleteText} onClick={() => void deleteCategory(cat.id)}>Xóa</button> : null}</article>)}</div>
      </section>}
    </main>
  );
}
