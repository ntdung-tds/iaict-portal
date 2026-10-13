"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PublicationMediaFields } from "@/components/admin/publication-media-fields";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type ContentType = "news" | "insight" | "notice" | "event";
type ContentStatus = "published" | "scheduled" | "review" | "draft";
type AdminRole = "editor" | "reviewer" | "superadmin";
type MutationAction = "save-draft" | "submit-review" | "return-draft" | "schedule" | "publish" | "unpublish" | "delete" | "comment";

export type AdminContentItem = {
  id: string;
  originSlug?: string;
  slug: string;
  title: string;
  category: string;
  type: ContentType;
  publishedAt: string;
  publishAt?: string;
  readingTime: string;
  excerpt: string;
  body: string;
  keywords: string[];
  featured: boolean;
  coverMediaId?: string;
  ogMediaId?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

type EditorState = {
  id?: string;
  sourceId?: string;
  status: ContentStatus;
  originSlug?: string;
  title: string;
  slug: string;
  category: string;
  type: ContentType;
  excerpt: string;
  body: string;
  keywords: string;
  featured: boolean;
  coverMediaId?: string;
  ogMediaId?: string;
  publishAt: string;
};

type MutationResponse = {
  revision?: number;
  updatedAt?: string;
  storageReady?: boolean;
  materialized?: boolean;
  items?: AdminContentItem[];
  error?: string;
  message?: string;
  suggestedTimes?: string[];
};

type HistoryInteraction = {
  id: string;
  at: string;
  actor: string;
  role: AdminRole;
  publicationId: string;
  kind: "action" | "comment";
  action: MutationAction;
  message: string;
  versionId?: string;
};

type HistoryVersion = {
  id: string;
  publicationId: string;
  number: number;
  at: string;
  actor: string;
  role: AdminRole;
  action: Exclude<MutationAction, "comment">;
  snapshot: AdminContentItem;
};

type HistoryState = {
  publicationId: string;
  interactions: HistoryInteraction[];
  versions: HistoryVersion[];
};

const EMPTY_EDITOR: EditorState = {
  status: "draft",
  title: "",
  slug: "",
  category: "Tin hoạt động Viện",
  type: "news",
  excerpt: "",
  body: "",
  keywords: "",
  featured: false,
  publishAt: "",
};

function typeLabel(type: ContentType) {
  if (type === "insight") return "Góc nhìn";
  if (type === "notice") return "Thông báo";
  if (type === "event") return "Sự kiện";
  return "Tin IAICT";
}

function statusLabel(status: ContentStatus) {
  if (status === "review") return "Chờ duyệt";
  if (status === "scheduled") return "Đã lên lịch";
  if (status === "published") return "Đã xuất bản";
  return "Bản nháp";
}

function roleLabel(role: AdminRole) {
  if (role === "editor") return "Biên tập viên";
  if (role === "reviewer") return "Người duyệt";
  return "Quản trị cấp cao";
}

function actionLabel(action: MutationAction) {
  if (action === "save-draft") return "Lưu nháp";
  if (action === "submit-review") return "Gửi duyệt";
  if (action === "return-draft") return "Trả lại";
  if (action === "schedule") return "Duyệt & lên lịch";
  if (action === "publish") return "Xuất bản";
  if (action === "unpublish") return "Gỡ xuất bản";
  if (action === "delete") return "Xóa";
  return "Phản hồi";
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa đặt lịch";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa đặt lịch";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function previewDocument(editor: EditorState) {
  const title = escapeHtml(editor.title || "Tiêu đề bài viết");
  const category = escapeHtml(editor.category || "Tin hoạt động Viện");
  const excerpt = escapeHtml(editor.excerpt || "Mô tả ngắn của bài viết sẽ xuất hiện tại đây.");
  const body = editor.body || "<p>Nội dung chi tiết sẽ xuất hiện tại đây.</p>";
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}body{margin:0;background:#f3f6fa;color:#18314d;font-family:Arial,sans-serif}main{max-width:980px;margin:0 auto;background:white;min-height:100vh}.hero{padding:64px 70px 52px;background:linear-gradient(135deg,#0d2f62,#153f96);color:white}.meta{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#b8d1ff}.hero h1{max-width:800px;margin:18px 0;font-size:46px;line-height:1.08}.hero p{max-width:760px;margin:0;color:#dce8ff;font-size:18px;line-height:1.65}.body{padding:52px 70px 80px;font-size:17px;line-height:1.75}.body h2{margin:42px 0 14px;font-size:28px;color:#102e55}.body h3{margin:32px 0 12px;font-size:22px}.body img{max-width:100%;height:auto}.body blockquote{margin:28px 0;padding:16px 22px;border-left:4px solid #2b65d9;background:#f5f8fe}.body table{width:100%;border-collapse:collapse}.body td,.body th{padding:10px;border:1px solid #dbe4ee}@media(max-width:700px){.hero,.body{padding-left:24px;padding-right:24px}.hero h1{font-size:34px}}
  </style></head><body><main><section class="hero"><div class="meta">IAICT · ${category}</div><h1>${title}</h1><p>${excerpt}</p></section><article class="body">${body}</article></main></body></html>`;
}

export function DashboardContentManager({
  initialItems,
  initialRevision,
  storageReady,
  materialized,
  currentUser,
}: {
  initialItems: AdminContentItem[];
  initialRevision: number;
  storageReady: boolean;
  materialized: boolean;
  currentUser: { username: string; role: AdminRole };
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContentType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ContentStatus>("all");
  const [items, setItems] = useState<AdminContentItem[]>(initialItems);
  const [revision, setRevision] = useState(initialRevision);
  const [isMaterialized, setIsMaterialized] = useState(materialized);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [previewState, setPreviewState] = useState<EditorState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState<HistoryState | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scheduleSuggestions, setScheduleSuggestions] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!normalized) return true;
      return [item.title, item.category, item.excerpt, item.slug, ...item.keywords]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalized);
    });
  }, [items, query, statusFilter, typeFilter]);

  const publishedCount = items.filter((item) => item.status === "published").length;
  const scheduledItems = items
    .filter((item) => item.status === "scheduled")
    .sort((a, b) => (a.publishAt ?? "").localeCompare(b.publishAt ?? ""));
  const reviewCount = items.filter((item) => item.status === "review").length;
  const draftCount = items.filter((item) => item.status === "draft").length;
  const previewHtml = useMemo(() => previewState ? previewDocument(previewState) : "", [previewState]);
  const isEditor = currentUser.role === "editor";
  const isReviewer = currentUser.role === "reviewer";
  const isSuperadmin = currentUser.role === "superadmin";

  async function loadHistory(publicationId: string) {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/admin/content?publicationId=${encodeURIComponent(publicationId)}`, { cache: "no-store" });
      const data = (await response.json()) as Partial<HistoryState> & { error?: string };
      if (response.ok && data.publicationId && Array.isArray(data.interactions) && Array.isArray(data.versions)) {
        setHistory({
          publicationId: data.publicationId,
          interactions: data.interactions,
          versions: data.versions,
        });
      } else {
        setHistory({ publicationId, interactions: [], versions: [] });
      }
    } catch {
      setHistory({ publicationId, interactions: [], versions: [] });
    } finally {
      setHistoryLoading(false);
    }
  }

  function startNew() {
    setEditor({ ...EMPTY_EDITOR });
    setPreviewState(null);
    setFeedback("");
    setHistory(null);
    setScheduleSuggestions([]);
    setNotice(null);
  }

  function editorFromItem(item: AdminContentItem, preservePublishedId = false): EditorState {
    return {
      id: item.status === "published" && !preservePublishedId ? undefined : item.id,
      sourceId: item.id,
      status: item.status === "published" && !preservePublishedId ? "draft" : item.status,
      originSlug: item.status === "published" && !preservePublishedId ? item.slug : item.originSlug,
      title: item.title,
      slug: item.slug,
      category: item.category,
      type: item.type,
      excerpt: item.excerpt,
      body: item.body,
      keywords: item.keywords.join(", "),
      featured: item.featured,
      coverMediaId: item.coverMediaId,
      ogMediaId: item.ogMediaId,
      publishAt: toDateTimeLocal(item.publishAt),
    };
  }

  function editItem(item: AdminContentItem) {
    setEditor(editorFromItem(item));
    setPreviewState(null);
    setFeedback("");
    setScheduleSuggestions([]);
    setNotice(null);
    void loadHistory(item.id);
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
      coverMediaId: current.coverMediaId ?? null,
      ogMediaId: current.ogMediaId ?? null,
      publishAt: current.publishAt ? new Date(current.publishAt).toISOString() : undefined,
    };
  }

  async function mutate(
    action: MutationAction,
    options: { editor?: EditorState; id?: string; feedback?: string } = {},
  ) {
    if (["save-draft", "submit-review", "schedule", "publish"].includes(action) && !options.editor?.title.trim()) {
      setNotice("Cần nhập tiêu đề trước khi lưu.");
      return;
    }
    if (action === "schedule" && !options.editor?.publishAt) {
      setNotice("Cần chọn ngày và giờ trước khi duyệt & lên lịch xuất bản.");
      return;
    }
    const actionFeedback = (options.feedback ?? feedback).trim();
    if (action === "return-draft" && !actionFeedback) {
      setNotice("Bắt buộc nhập lý do hoặc yêu cầu chỉnh sửa trước khi trả lại.");
      return;
    }
    if (action === "comment" && !actionFeedback) {
      setNotice("Hãy nhập nội dung phản hồi trước khi gửi.");
      return;
    }
    if (!storageReady) {
      setNotice("Kho lưu trữ CMS chưa sẵn sàng. Không có dữ liệu nào được ghi.");
      return;
    }

    setBusy(true);
    setNotice(null);
    setScheduleSuggestions([]);
    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          expectedRevision: revision,
          item: options.editor ? editorPayload(options.editor) : undefined,
          id: options.id,
          feedback: actionFeedback || undefined,
        }),
      });
      const data = (await response.json()) as MutationResponse;

      if (data.items && typeof data.revision === "number") {
        setItems(data.items);
        setRevision(data.revision);
        setIsMaterialized(Boolean(data.materialized ?? true));
      }

      if (!response.ok) {
        if (Array.isArray(data.suggestedTimes)) setScheduleSuggestions(data.suggestedTimes);
        setNotice(data.message ?? "Không thể ghi dữ liệu CMS. Vui lòng thử lại.");
        return;
      }

      setFeedback("");
      if (action === "save-draft") {
        const expectedSlug = options.editor?.slug || slugify(options.editor?.title ?? "");
        const saved = data.items?.find((item) => item.status === "draft" && item.slug === expectedSlug);
        if (saved) {
          setEditor(editorFromItem(saved, true));
          void loadHistory(saved.id);
        }
        setNotice("Đã lưu bản nháp và tạo một phiên bản lịch sử mới.");
      } else if (action === "submit-review") {
        setEditor(null);
        setHistory(null);
        setNotice("Đã gửi duyệt. Thời gian xuất bản đang là đề xuất và chỉ được kích hoạt sau khi người có quyền duyệt chấp thuận.");
      } else if (action === "schedule") {
        setEditor(null);
        setHistory(null);
        setNotice("Đã duyệt và lên lịch. Nội dung sẽ tự công khai khi tới thời điểm đã được chấp thuận.");
      } else if (action === "publish") {
        setEditor(null);
        setHistory(null);
        setNotice(isSuperadmin ? "Đã xuất bản trực tiếp bằng quyền quản trị cấp cao." : "Đã duyệt và xuất bản nội dung.");
      } else if (action === "unpublish") {
        setNotice("Đã gỡ xuất bản và chuyển nội dung về trạng thái nháp.");
      } else if (action === "return-draft") {
        setEditor(null);
        setHistory(null);
        setNotice("Đã trả nội dung về nháp cùng lý do/phản hồi. Biên tập viên có thể sửa và gửi duyệt lại.");
      } else if (action === "comment") {
        const historyId = options.id ?? editor?.id ?? editor?.sourceId;
        if (historyId) void loadHistory(historyId);
        setNotice("Đã lưu phản hồi vào lịch sử trao đổi.");
      } else {
        if (editor?.id === options.id) setEditor(null);
        setHistory(null);
        setNotice("Đã xóa nội dung chưa công khai khỏi kho CMS; audit và phiên bản cuối vẫn được lưu để truy vết.");
      }
    } catch {
      setNotice("Không thể kết nối API CMS.");
    } finally {
      setBusy(false);
    }
  }

  const activeHistoryId = editor?.id ?? editor?.sourceId;
  const canEditContent = !isReviewer || editor?.status === "review";
  const canSubmitReview = isEditor && editor?.status === "draft";
  const canApprove = (isReviewer || isSuperadmin) && (isSuperadmin || editor?.status === "review");
  const canReturn = (isReviewer || isSuperadmin) && (editor?.status === "review" || editor?.status === "scheduled");

  return (
    <div className="admin-content-manager">
      <section className="admin-role-banner">
        <div>
          <span>QUYỀN PHIÊN LÀM VIỆC</span>
          <strong>{roleLabel(currentUser.role)}</strong>
          <p>{currentUser.username}</p>
        </div>
        <p>
          {isEditor
            ? "Có thể viết, lưu nháp, đề xuất lịch và gửi duyệt. Không thể tự duyệt hoặc kích hoạt lịch xuất bản."
            : isReviewer
              ? "Có thể phản hồi, trả lại, duyệt & lên lịch hoặc duyệt & xuất bản nội dung đang chờ duyệt."
              : "Có toàn quyền. Có thể bỏ qua bước duyệt để lên lịch hoặc xuất bản trực tiếp; mọi thao tác vẫn được ghi lịch sử."}
        </p>
      </section>

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
        <select
          className="admin-status-filter"
          aria-label="Lọc theo trạng thái"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | ContentStatus)}
        >
          <option value="all">Mọi trạng thái</option>
          <option value="draft">Bản nháp</option>
          <option value="review">Chờ duyệt</option>
          <option value="scheduled">Đã lên lịch</option>
          <option value="published">Đã xuất bản</option>
        </select>
        {!isReviewer ? (
          <button className="admin-button admin-button-primary" type="button" onClick={startNew} disabled={busy}>
            + Tạo nội dung
          </button>
        ) : null}
      </section>

      <section className="admin-content-summary admin-content-summary-workflow">
        <div><span>Đã xuất bản</span><strong>{publishedCount}</strong></div>
        <div><span>Đã lên lịch</span><strong>{scheduledItems.length}</strong></div>
        <div><span>Chờ duyệt</span><strong>{reviewCount}</strong></div>
        <div><span>Bản nháp</span><strong>{draftCount}</strong></div>
        <p>
          {storageReady
            ? isMaterialized
              ? `Vercel Blob đang hoạt động · revision ${revision}.`
              : "Kho Blob đã sẵn sàng. Dữ liệu repository sẽ được materialize khi có thay đổi đầu tiên."
            : "Kho lưu trữ CMS chưa được cấu hình; các thao tác ghi bị khóa."}
        </p>
      </section>

      {scheduledItems.length ? (
        <section className="admin-schedule-panel" aria-label="Lịch xuất bản">
          <div className="admin-schedule-head">
            <div><span>Publishing calendar</span><h2>Lịch xuất bản đã duyệt</h2></div>
            <small>{scheduledItems.length} nội dung đã khóa lịch</small>
          </div>
          <div className="admin-schedule-list">
            {scheduledItems.map((item) => (
              <article key={item.id}>
                <time>{formatDateTime(item.publishAt)}</time>
                <div><strong>{item.title}</strong><span>{item.category} · {typeLabel(item.type)}</span></div>
                <button type="button" onClick={() => editItem(item)} disabled={busy}>Mở</button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {notice ? <div className="admin-inline-notice" role="status">{notice}</div> : null}

      {editor ? (
        <section className="admin-editor-panel" aria-label="Trình biên tập nội dung">
          <div className="admin-editor-head">
            <div>
              <span>{editor.id ? `CMS / ${statusLabel(editor.status).toUpperCase()}` : editor.originSlug ? "EDIT COPY" : "NEW CONTENT"}</span>
              <h2>{editor.originSlug && !editor.id ? "Biên tập từ nội dung đã xuất bản" : editor.id ? "Xử lý nội dung" : "Tạo nội dung mới"}</h2>
            </div>
            <button type="button" onClick={() => { setEditor(null); setPreviewState(null); setHistory(null); }} aria-label="Đóng trình biên tập">×</button>
          </div>

          <div className="admin-workflow-rail" aria-label="Luồng biên tập">
            <span><b>01</b> Nháp</span><i>→</i><span><b>02</b> Gửi duyệt</span><i>→</i><span><b>03</b> Duyệt lịch / xuất bản</span><i>→</i><span><b>04</b> Công khai</span>
          </div>

          <div className="admin-editor-grid">
            <label className="admin-field admin-field-wide">
              <span>Tiêu đề</span>
              <input
                disabled={!canEditContent}
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
              <select disabled={!canEditContent} value={editor.type} onChange={(event) => setEditor({ ...editor, type: event.target.value as ContentType })}>
                <option value="news">Tin IAICT</option>
                <option value="insight">Góc nhìn chuyên môn</option>
                <option value="notice">Thông báo</option>
                <option value="event">Sự kiện</option>
              </select>
            </label>

            <label className="admin-field">
              <span>Chuyên mục</span>
              <input disabled={!canEditContent} value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} />
            </label>

            <label className="admin-field admin-field-wide">
              <span>Slug</span>
              <input disabled={!canEditContent} value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: slugify(event.target.value) })} />
            </label>

            <label className="admin-field admin-field-wide">
              <span>Mô tả ngắn</span>
              <textarea disabled={!canEditContent} rows={4} value={editor.excerpt} onChange={(event) => setEditor({ ...editor, excerpt: event.target.value })} placeholder="Nội dung tóm tắt hiển thị ở danh sách và metadata" />
            </label>

            <div className="admin-field admin-field-wide">
              <PublicationMediaFields
                coverMediaId={editor.coverMediaId}
                ogMediaId={editor.ogMediaId}
                onChange={(media) => canEditContent && setEditor({ ...editor, ...media })}
              />
            </div>

            <div className="admin-field admin-field-wide admin-rich-field">
              <span>Nội dung chi tiết</span>
              {canEditContent ? (
                <RichTextEditor value={editor.body} onChange={(body) => setEditor({ ...editor, body })} />
              ) : (
                <div className="admin-review-readonly" dangerouslySetInnerHTML={{ __html: editor.body || "<p>Chưa có nội dung.</p>" }} />
              )}
              <small className="admin-field-help">{canEditContent ? "Soạn thảo trực quan hoặc HTML Code. Mọi lần lưu/gửi duyệt/duyệt đều tạo phiên bản lịch sử." : "Đang ở chế độ đọc để duyệt nội dung."}</small>
            </div>

            <label className="admin-field admin-field-wide">
              <span>Từ khóa</span>
              <input disabled={!canEditContent} value={editor.keywords} onChange={(event) => setEditor({ ...editor, keywords: event.target.value })} placeholder="AI, dữ liệu, IoT, đào tạo..." />
            </label>

            <label className="admin-field">
              <span>{isEditor ? "Thời gian đề xuất xuất bản" : "Ngày & giờ xuất bản"}</span>
              <input
                type="datetime-local"
                value={editor.publishAt}
                onChange={(event) => setEditor({ ...editor, publishAt: event.target.value })}
              />
              <small className="admin-field-help">
                {isEditor ? "Đây là lịch đề xuất. Chỉ trở thành lịch chính thức sau khi được duyệt." : "Hệ thống không cho duyệt hai bài vào cùng một phút xuất bản."}
              </small>
              {scheduleSuggestions.length ? (
                <div className="admin-schedule-suggestions">
                  <span>Khung giờ gợi ý:</span>
                  {scheduleSuggestions.map((value) => (
                    <button key={value} type="button" onClick={() => setEditor({ ...editor, publishAt: toDateTimeLocal(value) })}>
                      {formatDateTime(value)}
                    </button>
                  ))}
                </div>
              ) : null}
            </label>

            <label className="admin-check-field">
              <input disabled={!canEditContent} type="checkbox" checked={editor.featured} onChange={(event) => setEditor({ ...editor, featured: event.target.checked })} />
              <span>Đánh dấu nội dung nổi bật</span>
            </label>
          </div>

          <section className="admin-feedback-box">
            <div>
              <span>PHẢN HỒI NỘI BỘ</span>
              <strong>Trao đổi giữa biên tập và người duyệt</strong>
              <p>Lý do trả lại là bắt buộc. Các phản hồi khác được lưu cùng người gửi, vai trò, thời gian và phiên bản liên quan.</p>
            </div>
            <textarea
              rows={4}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder={canReturn ? "Nhập lý do trả lại / yêu cầu chỉnh sửa..." : "Ghi chú, phản hồi hoặc nội dung trao đổi..."}
            />
            {activeHistoryId ? (
              <button className="admin-button admin-button-secondary" type="button" disabled={busy || !feedback.trim()} onClick={() => mutate("comment", { id: activeHistoryId })}>
                Gửi phản hồi
              </button>
            ) : <small>Lưu nháp lần đầu để bắt đầu luồng trao đổi.</small>}
          </section>

          <div className="admin-editor-actions admin-editor-actions-workflow">
            <div className="admin-editor-secondary-actions">
              <button className="admin-button admin-button-secondary" type="button" disabled={busy} onClick={() => setPreviewState(editor)}>Xem trước</button>
              {(isEditor || isSuperadmin) && editor.status === "draft" ? (
                <button className="admin-button admin-button-secondary" type="button" disabled={busy} onClick={() => mutate("save-draft", { editor })}>{busy ? "Đang lưu..." : "Lưu nháp"}</button>
              ) : null}
              {canSubmitReview ? (
                <button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => mutate("submit-review", { editor })}>Gửi duyệt</button>
              ) : null}
              {canReturn ? (
                <button className="admin-button admin-button-return" type="button" disabled={busy || !feedback.trim()} onClick={() => mutate("return-draft", { id: editor.id ?? editor.sourceId })}>Trả lại kèm lý do</button>
              ) : null}
            </div>
            <div className="admin-editor-primary-actions">
              {canApprove ? (
                <>
                  <button className="admin-button admin-button-schedule" type="button" disabled={busy || !editor.publishAt} onClick={() => mutate("schedule", { editor })}>{isReviewer ? "Duyệt & lên lịch" : "Lên lịch"}</button>
                  <button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => mutate("publish", { editor })}>{busy ? "Đang xử lý..." : isReviewer ? "Duyệt & xuất bản ngay" : "Xuất bản ngay"}</button>
                </>
              ) : null}
            </div>
            <small>
              {isSuperadmin
                ? "Quản trị cấp cao có thể bỏ qua bước duyệt. Hệ thống vẫn ghi rõ người thực hiện và phiên bản đã xuất bản."
                : isEditor
                  ? "Biên tập viên chỉ đề xuất lịch; bài chỉ được lên lịch hoặc xuất bản sau khi người có quyền duyệt chấp thuận."
                  : "Người duyệt có thể giữ hoặc điều chỉnh lịch đề xuất trước khi duyệt."}
            </small>
          </div>

          <section className="admin-history-grid">
            <div className="admin-history-panel">
              <div className="admin-history-head"><div><span>Conversation</span><h3>Lịch sử trao đổi</h3></div><small>{history?.interactions.length ?? 0} mục</small></div>
              {historyLoading ? <p className="admin-history-empty">Đang tải lịch sử...</p> : history?.interactions.length ? (
                <div className="admin-interaction-list">
                  {history.interactions.slice(0, 20).map((entry) => (
                    <article key={entry.id} className={`is-${entry.kind}`}>
                      <div><strong>{entry.actor}</strong><span>{roleLabel(entry.role)} · {formatDateTime(entry.at)}</span></div>
                      <b>{actionLabel(entry.action)}</b>
                      <p>{entry.message}</p>
                    </article>
                  ))}
                </div>
              ) : <p className="admin-history-empty">Chưa có phản hồi hoặc thao tác lịch sử cho bản nội dung này.</p>}
            </div>

            <div className="admin-history-panel">
              <div className="admin-history-head"><div><span>Revisions</span><h3>Lịch sử phiên bản</h3></div><small>{history?.versions.length ?? 0} bản</small></div>
              {historyLoading ? <p className="admin-history-empty">Đang tải phiên bản...</p> : history?.versions.length ? (
                <div className="admin-version-list">
                  {history.versions.slice(0, 20).map((version) => (
                    <article key={version.id}>
                      <div><strong>v{version.number}</strong><span>{actionLabel(version.action)}</span></div>
                      <p>{version.actor} · {roleLabel(version.role)}</p>
                      <small>{formatDateTime(version.at)}</small>
                      <button type="button" onClick={() => setPreviewState(editorFromItem(version.snapshot, true))}>Xem bản v{version.number}</button>
                    </article>
                  ))}
                </div>
              ) : <p className="admin-history-empty">Phiên bản đầu tiên sẽ được tạo khi lưu hoặc thực hiện một hành động workflow.</p>}
            </div>
          </section>
        </section>
      ) : null}

      {previewState ? (
        <div className="admin-preview-overlay" role="dialog" aria-modal="true" aria-label="Xem trước bài viết">
          <div className="admin-preview-dialog">
            <div className="admin-preview-dialog-head">
              <div><span>PREVIEW / VERSION</span><strong>Xem trước nội dung</strong></div>
              <button type="button" onClick={() => setPreviewState(null)} aria-label="Đóng xem trước">×</button>
            </div>
            <iframe title="Xem trước bài viết" sandbox="" srcDoc={previewHtml} />
          </div>
        </div>
      ) : null}

      <section className="admin-content-table-panel">
        <div className="admin-table-head"><span>Nội dung</span><span>Loại</span><span>Trạng thái</span><span>Ngày</span><span>Thao tác</span></div>
        <div className="admin-content-rows">
          {filtered.map((item, index) => (
            <article className="admin-content-row" key={item.id}>
              <div className="admin-content-title-cell">
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div><strong>{item.title}</strong><span>{item.category}{item.featured ? " · Nổi bật" : ""}{item.coverMediaId ? " · Có ảnh" : ""}</span></div>
              </div>
              <span>{typeLabel(item.type)}</span>
              <span className={`admin-status-pill is-${item.status}`}>{statusLabel(item.status)}</span>
              <span>
                {item.status === "published"
                  ? formatDate(item.publishedAt)
                  : item.status === "scheduled"
                    ? formatDateTime(item.publishAt)
                    : item.status === "review"
                      ? item.publishAt ? `Đề xuất ${formatDateTime(item.publishAt)}` : "Đang chờ duyệt"
                      : `Sửa ${new Date(item.updatedAt).toLocaleDateString("vi-VN")}`}
              </span>
              <div className="admin-row-actions">
                <button type="button" disabled={busy} onClick={() => editItem(item)}>{item.status === "review" && !isEditor ? "Mở duyệt" : "Biên tập"}</button>
                {item.status === "published" ? <Link href={`/tin-tuc/${item.slug}`}>Mở ↗</Link> : null}
                {item.status === "published" && isSuperadmin ? (
                  <button type="button" disabled={busy} onClick={() => mutate("unpublish", { id: item.id, feedback: "Gỡ xuất bản bởi quản trị cấp cao." })}>Gỡ xuất bản</button>
                ) : null}
                {item.status === "draft" && (isEditor || isSuperadmin) ? (
                  <button className="danger" type="button" disabled={busy} onClick={() => mutate("delete", { id: item.id })}>Xóa</button>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty-state"><span>0 kết quả</span><strong>Không tìm thấy nội dung phù hợp.</strong><p>Thử đổi từ khóa, loại hoặc trạng thái nội dung.</p></div>
        ) : null}
      </section>
    </div>
  );
}
