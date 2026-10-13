"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PublicationMediaFields } from "@/components/admin/publication-media-fields";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type ContentType = "news" | "insight" | "notice" | "event";
type ContentStatus = "published" | "scheduled" | "review" | "draft";
type AdminRole = "editor" | "reviewer" | "superadmin";
type MutationAction = "save-draft" | "submit-review" | "return-draft" | "schedule" | "publish" | "unpublish" | "delete" | "comment";

type ReviewTarget = {
  id: string;
  username: string;
  displayName: string;
  role: "reviewer" | "superadmin";
};

export type AdminContentItem = {
  id: string;
  originSlug?: string;
  slug: string;
  title: string;
  category: string;
  type: ContentType;
  publishedAt: string;
  publishAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  submittedBy?: string;
  submittedAt?: string;
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
  reviewerId?: string;
  reviewerName?: string;
  submittedBy?: string;
  submittedAt?: string;
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

type RevisionChange = {
  label: string;
  before: string;
  after: string;
  changed: boolean;
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

function plainTextFromHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string, max = 150) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "—";
  return normalized.length > max ? `${normalized.slice(0, max).trim()}…` : normalized;
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
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
  reviewTargets,
}: {
  initialItems: AdminContentItem[];
  initialRevision: number;
  storageReady: boolean;
  materialized: boolean;
  currentUser: { userId: string; username: string; displayName: string; role: AdminRole };
  reviewTargets: ReviewTarget[];
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

  const isEditor = currentUser.role === "editor";
  const isReviewer = currentUser.role === "reviewer";
  const isSuperadmin = currentUser.role === "superadmin";
  const availableReviewTargets = useMemo(
    () => reviewTargets.filter((target) => target.id !== currentUser.userId),
    [currentUser.userId, reviewTargets],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return items.filter((item) => {
      if (isReviewer && (item.status === "review" || item.status === "scheduled") && item.reviewerId !== currentUser.userId) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!normalized) return true;
      return [item.title, item.category, item.excerpt, item.slug, item.reviewerName ?? "", ...item.keywords]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalized);
    });
  }, [currentUser.userId, isReviewer, items, query, statusFilter, typeFilter]);

  const publishedCount = items.filter((item) => item.status === "published").length;
  const scheduledItems = items
    .filter((item) => item.status === "scheduled" && (!isReviewer || item.reviewerId === currentUser.userId))
    .sort((a, b) => (a.publishAt ?? "").localeCompare(b.publishAt ?? ""));
  const reviewCount = items.filter((item) => item.status === "review" && (!isReviewer || item.reviewerId === currentUser.userId)).length;
  const draftCount = items.filter((item) => item.status === "draft").length;
  const previewHtml = useMemo(() => previewState ? previewDocument(previewState) : "", [previewState]);
  const revisionBase = useMemo(
    () => editor?.originSlug ? items.find((item) => item.status === "published" && item.slug === editor.originSlug) : undefined,
    [editor?.originSlug, items],
  );
  const revisionChanges = useMemo<RevisionChange[]>(() => {
    if (!editor || !revisionBase) return [];
    const beforeBody = plainTextFromHtml(revisionBase.body);
    const afterBody = plainTextFromHtml(editor.body);
    const beforeKeywords = revisionBase.keywords.join(", ");
    const afterKeywords = editor.keywords.split(",").map((value) => value.trim()).filter(Boolean).join(", ");
    return [
      { label: "Tiêu đề", before: revisionBase.title, after: editor.title, changed: revisionBase.title.trim() !== editor.title.trim() },
      { label: "Chuyên mục", before: revisionBase.category, after: editor.category, changed: revisionBase.category.trim() !== editor.category.trim() },
      { label: "Loại nội dung", before: typeLabel(revisionBase.type), after: typeLabel(editor.type), changed: revisionBase.type !== editor.type },
      { label: "Slug", before: revisionBase.slug, after: editor.slug, changed: revisionBase.slug !== editor.slug },
      { label: "Mô tả ngắn", before: compactText(revisionBase.excerpt), after: compactText(editor.excerpt), changed: revisionBase.excerpt.trim() !== editor.excerpt.trim() },
      { label: "Nội dung", before: `${wordCount(beforeBody)} từ · ${compactText(beforeBody, 110)}`, after: `${wordCount(afterBody)} từ · ${compactText(afterBody, 110)}`, changed: beforeBody !== afterBody },
      { label: "Ảnh đại diện", before: revisionBase.coverMediaId ? "Có ảnh" : "Không có ảnh", after: editor.coverMediaId ? "Có ảnh" : "Không có ảnh", changed: revisionBase.coverMediaId !== editor.coverMediaId },
      { label: "Ảnh OpenGraph", before: revisionBase.ogMediaId ? "Có ảnh riêng" : "Dùng mặc định / ảnh đại diện", after: editor.ogMediaId ? "Có ảnh riêng" : "Dùng mặc định / ảnh đại diện", changed: revisionBase.ogMediaId !== editor.ogMediaId },
      { label: "Từ khóa", before: compactText(beforeKeywords), after: compactText(afterKeywords), changed: beforeKeywords !== afterKeywords },
      { label: "Nổi bật", before: revisionBase.featured ? "Có" : "Không", after: editor.featured ? "Có" : "Không", changed: revisionBase.featured !== editor.featured },
    ];
  }, [editor, revisionBase]);
  const revisionChangedCount = revisionChanges.filter((change) => change.changed).length;

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

  function activeRevisionFor(item: AdminContentItem) {
    if (item.status !== "published") return undefined;
    return items.find((candidate) => candidate.status !== "published" && candidate.originSlug === item.slug);
  }

  function startNew() {
    const defaultReviewer = availableReviewTargets.length === 1 ? availableReviewTargets[0] : undefined;
    setEditor({ ...EMPTY_EDITOR, reviewerId: defaultReviewer?.id, reviewerName: defaultReviewer?.displayName });
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
      reviewerId: item.reviewerId,
      reviewerName: item.reviewerName,
      submittedBy: item.submittedBy,
      submittedAt: item.submittedAt,
    };
  }

  function editItem(item: AdminContentItem) {
    if (item.status === "published" && !isReviewer) {
      const activeRevision = activeRevisionFor(item);
      if (activeRevision) {
        setEditor(editorFromItem(activeRevision, true));
        setPreviewState(null);
        setFeedback("");
        setScheduleSuggestions([]);
        setNotice(`Bài đang công khai đã có một bản chỉnh sửa ở trạng thái “${statusLabel(activeRevision.status)}”. Hệ thống đã mở đúng bản sửa đó.`);
        void loadHistory(activeRevision.id);
        return;
      }
    }
    setEditor(editorFromItem(item));
    setPreviewState(null);
    setFeedback("");
    setScheduleSuggestions([]);
    setNotice(item.status === "published" && !isReviewer ? "Đang tạo bản chỉnh sửa. Bài hiện tại vẫn tiếp tục công khai cho tới khi bản sửa được duyệt." : null);
    if (item.status !== "published" || isReviewer) void loadHistory(item.id);
    else setHistory(null);
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
    if (action === "submit-review" && !options.editor?.reviewerId) {
      setNotice("Hãy chọn người nhận duyệt trước khi gửi.");
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
          reviewerId: action === "submit-review" ? options.editor?.reviewerId : undefined,
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
        const saved = data.items?.find((item) => item.status === "draft" && item.slug === expectedSlug && item.originSlug === options.editor?.originSlug)
          ?? data.items?.find((item) => item.status === "draft" && item.slug === expectedSlug);
        if (saved) {
          setEditor(editorFromItem(saved, true));
          void loadHistory(saved.id);
        }
        setNotice(options.editor?.originSlug
          ? "Đã lưu bản chỉnh sửa. Bản đang công khai vẫn giữ nguyên cho tới khi bản sửa được duyệt."
          : "Đã lưu bản nháp và tạo một phiên bản lịch sử mới.");
      } else if (action === "submit-review") {
        const target = availableReviewTargets.find((candidate) => candidate.id === options.editor?.reviewerId);
        setEditor(null);
        setHistory(null);
        setNotice(options.editor?.originSlug
          ? `Đã gửi bản chỉnh sửa${target ? ` cho ${target.displayName}` : ""} duyệt. Bản cũ tiếp tục công khai trong thời gian chờ duyệt.`
          : `Đã gửi duyệt${target ? ` cho ${target.displayName}` : ""}. Lịch xuất bản vẫn chỉ là đề xuất cho tới khi được duyệt.`);
      } else if (action === "schedule") {
        setEditor(null);
        setHistory(null);
        setNotice(options.editor?.originSlug
          ? "Đã duyệt bản sửa và lên lịch cập nhật. Bản hiện tại tiếp tục công khai cho tới đúng thời điểm thay thế."
          : "Đã duyệt và lên lịch. Nội dung sẽ tự công khai khi tới thời điểm đã được chấp thuận.");
      } else if (action === "publish") {
        setEditor(null);
        setHistory(null);
        setNotice(options.editor?.originSlug
          ? "Đã duyệt và thay thế bản công khai bằng bản chỉnh sửa mới."
          : isSuperadmin ? "Đã xuất bản trực tiếp bằng quyền quản trị cấp cao." : "Đã duyệt và xuất bản nội dung.");
      } else if (action === "unpublish") {
        setNotice("Đã gỡ xuất bản và chuyển nội dung về trạng thái nháp.");
      } else if (action === "return-draft") {
        setEditor(null);
        setHistory(null);
        setNotice("Đã trả nội dung về nháp cùng lý do/phản hồi. Nếu đây là bản sửa, bài cũ vẫn tiếp tục công khai.");
      } else if (action === "comment") {
        const historyId = options.id ?? editor?.id;
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

  const activeHistoryId = editor?.id;
  const assignedToCurrentReviewer = !isReviewer || editor?.reviewerId === currentUser.userId;
  const canEditContent = isSuperadmin || (isEditor && editor?.status === "draft");
  const canSubmitReview = (isEditor || isSuperadmin) && editor?.status === "draft";
  const canApprove = isSuperadmin || (isReviewer && editor?.status === "review" && assignedToCurrentReviewer);
  const canReturn = isSuperadmin
    ? editor?.status === "review" || editor?.status === "scheduled"
    : isReviewer && assignedToCurrentReviewer && (editor?.status === "review" || editor?.status === "scheduled");

  return (
    <div className="admin-content-manager">
      <section className="admin-role-banner">
        <div>
          <span>QUYỀN PHIÊN LÀM VIỆC</span>
          <strong>{roleLabel(currentUser.role)}</strong>
          <p>{currentUser.displayName} · @{currentUser.username}</p>
        </div>
        <p>
          {isEditor
            ? "Có thể viết, tạo bản chỉnh sửa từ bài đã công khai, đề xuất lịch và gửi bài tới một người duyệt cụ thể. Bản sửa không bao giờ thay bài cũ trước khi được duyệt."
            : isReviewer
              ? "Chỉ nhận và duyệt các bài được giao trực tiếp cho tài khoản này; với bản chỉnh sửa có thể so sánh trước/sau rồi duyệt, trả lại hoặc lên lịch thay thế."
              : "Có toàn quyền. Có thể gửi xin duyệt cho người khác hoặc bỏ qua bước duyệt để lên lịch/xuất bản trực tiếp; mọi thao tác đều được ghi lịch sử."}
        </p>
      </section>

      <section className="admin-content-toolbar">
        <div className="admin-search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Tìm nội dung"
            placeholder="Tìm theo tiêu đề, chuyên mục, người duyệt, từ khóa..."
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
        <div><span>{isReviewer ? "Chờ tôi duyệt" : "Chờ duyệt"}</span><strong>{reviewCount}</strong></div>
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
                <div><strong>{item.title}</strong><span>{item.category} · {typeLabel(item.type)}{item.originSlug ? " · Bản cập nhật" : ""}{item.reviewerName ? ` · Duyệt: ${item.reviewerName}` : ""}</span></div>
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
              <span>{editor.originSlug ? `REVISION / ${statusLabel(editor.status).toUpperCase()}` : editor.id ? `CMS / ${statusLabel(editor.status).toUpperCase()}` : "NEW CONTENT"}</span>
              <h2>{editor.originSlug ? "Bản chỉnh sửa của nội dung đã xuất bản" : editor.id ? "Xử lý nội dung" : "Tạo nội dung mới"}</h2>
              {editor.reviewerName ? <small className="admin-assignment-line">Người duyệt: {editor.reviewerName}{editor.submittedBy ? ` · Gửi bởi ${editor.submittedBy}` : ""}</small> : null}
            </div>
            <button type="button" onClick={() => { setEditor(null); setPreviewState(null); setHistory(null); }} aria-label="Đóng trình biên tập">×</button>
          </div>

          <div className="admin-workflow-rail" aria-label="Luồng biên tập">
            <span><b>01</b> {editor.originSlug ? "Bản sửa" : "Nháp"}</span><i>→</i><span><b>02</b> Giao người duyệt</span><i>→</i><span><b>03</b> Duyệt lịch / xuất bản</span><i>→</i><span><b>04</b> {editor.originSlug ? "Thay bản cũ" : "Công khai"}</span>
          </div>

          {revisionBase ? (
            <section className="admin-revision-compare" aria-label="So sánh bản chỉnh sửa với bản đang công khai">
              <div className="admin-revision-compare-head">
                <div>
                  <span>REVISION CONTROL</span>
                  <h3>So sánh với bản đang công khai</h3>
                  <p>Bản cũ vẫn phục vụ người đọc cho tới khi bản chỉnh sửa này được duyệt và thay thế. Mỗi bài chỉ được có một bản sửa đang hoạt động.</p>
                </div>
                <div>
                  <strong>{revisionChangedCount} mục thay đổi</strong>
                  <Link href={`/tin-tuc/${revisionBase.slug}`} target="_blank">Mở bản đang công khai ↗</Link>
                </div>
              </div>
              <div className="admin-revision-diff-list">
                {revisionChanges.map((change) => (
                  <article key={change.label} className={change.changed ? "is-changed" : "is-same"}>
                    <div><span>{change.label}</span><b>{change.changed ? "Đã thay đổi" : "Không đổi"}</b></div>
                    <section><small>Bản đang công khai</small><p>{change.before}</p></section>
                    <section><small>Bản đề nghị cập nhật</small><p>{change.after}</p></section>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

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
              <small className="admin-field-help">{canEditContent ? "Soạn thảo trực quan hoặc HTML Code. Mọi lần lưu/gửi duyệt/duyệt đều tạo phiên bản lịch sử." : "Người duyệt xem nội dung ở chế độ đọc; nếu cần sửa nội dung, hãy trả lại kèm lý do."}</small>
            </div>

            <label className="admin-field admin-field-wide">
              <span>Từ khóa</span>
              <input disabled={!canEditContent} value={editor.keywords} onChange={(event) => setEditor({ ...editor, keywords: event.target.value })} placeholder="AI, dữ liệu, IoT, đào tạo..." />
            </label>

            {(isEditor || isSuperadmin) && editor.status === "draft" ? (
              <label className="admin-field">
                <span>Gửi duyệt cho</span>
                <select
                  value={editor.reviewerId ?? ""}
                  onChange={(event) => {
                    const reviewerId = event.target.value || undefined;
                    const target = availableReviewTargets.find((candidate) => candidate.id === reviewerId);
                    setEditor({ ...editor, reviewerId, reviewerName: target?.displayName });
                  }}
                >
                  <option value="">— Chọn người nhận duyệt —</option>
                  {availableReviewTargets.map((target) => (
                    <option key={target.id} value={target.id}>{target.displayName} · {roleLabel(target.role)}</option>
                  ))}
                </select>
                <small className="admin-field-help">Bài Chờ duyệt chỉ xuất hiện trong hộp duyệt của người được chọn. Quản trị cấp cao vẫn có quyền can thiệp khi cần.</small>
              </label>
            ) : null}

            <label className="admin-field">
              <span>{isEditor ? "Thời gian đề xuất xuất bản" : editor.originSlug ? "Ngày & giờ thay bản cũ" : "Ngày & giờ xuất bản"}</span>
              <input
                type="datetime-local"
                value={editor.publishAt}
                onChange={(event) => setEditor({ ...editor, publishAt: event.target.value })}
              />
              <small className="admin-field-help">
                {isEditor
                  ? editor.originSlug ? "Đây là thời điểm đề xuất cập nhật bản đang công khai. Chỉ có hiệu lực sau khi được duyệt." : "Đây là lịch đề xuất. Chỉ trở thành lịch chính thức sau khi được duyệt."
                  : "Hệ thống không cho duyệt hai bài vào cùng một phút xuất bản."}
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
            ) : <small>{editor.originSlug ? "Lưu bản chỉnh sửa lần đầu để bắt đầu luồng trao đổi." : "Lưu nháp lần đầu để bắt đầu luồng trao đổi."}</small>}
          </section>

          <div className="admin-editor-actions admin-editor-actions-workflow">
            <div className="admin-editor-secondary-actions">
              <button className="admin-button admin-button-secondary" type="button" disabled={busy} onClick={() => setPreviewState(editor)}>Xem trước</button>
              {(isEditor || isSuperadmin) && editor.status === "draft" ? (
                <button className="admin-button admin-button-secondary" type="button" disabled={busy} onClick={() => mutate("save-draft", { editor })}>{busy ? "Đang lưu..." : editor.originSlug ? "Lưu bản chỉnh sửa" : "Lưu nháp"}</button>
              ) : null}
              {canSubmitReview ? (
                <button className="admin-button admin-button-primary" type="button" disabled={busy || !editor.reviewerId} onClick={() => mutate("submit-review", { editor })}>{editor.originSlug ? "Gửi duyệt bản sửa" : "Gửi duyệt"}{editor.reviewerName ? ` → ${editor.reviewerName}` : ""}</button>
              ) : null}
              {canReturn ? (
                <button className="admin-button admin-button-return" type="button" disabled={busy || !feedback.trim()} onClick={() => mutate("return-draft", { id: editor.id ?? editor.sourceId })}>Trả lại kèm lý do</button>
              ) : null}
            </div>
            <div className="admin-editor-primary-actions">
              {canApprove ? (
                <>
                  <button className="admin-button admin-button-schedule" type="button" disabled={busy || !editor.publishAt} onClick={() => mutate("schedule", { editor })}>{editor.originSlug ? "Duyệt & lên lịch cập nhật" : isReviewer ? "Duyệt & lên lịch" : "Lên lịch"}</button>
                  <button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => mutate("publish", { editor })}>{busy ? "Đang xử lý..." : editor.originSlug ? "Duyệt & cập nhật ngay" : isReviewer ? "Duyệt & xuất bản ngay" : "Xuất bản ngay"}</button>
                </>
              ) : null}
            </div>
            <small>
              {editor.originSlug
                ? isSuperadmin
                  ? "Đây là bản chỉnh sửa. Quản trị cấp cao có thể duyệt trực tiếp hoặc gửi cho người khác duyệt; bản cũ chỉ bị thay khi bản sửa được chấp thuận."
                  : isEditor
                    ? "Không cần xin phép trước để bắt đầu sửa, nhưng mọi thay đổi phải được duyệt lại trước khi thay thế bản đang công khai."
                    : "Hãy đối chiếu bảng thay đổi. Nếu cần chỉnh nội dung, trả lại kèm lý do; bản đang công khai không bị ảnh hưởng."
                : isSuperadmin
                  ? "Quản trị cấp cao có thể gửi bài cho người khác duyệt hoặc bỏ qua bước duyệt. Hệ thống vẫn ghi rõ người thực hiện và phiên bản đã xuất bản."
                  : isEditor
                    ? "Biên tập viên chọn người nhận duyệt và chỉ đề xuất lịch; bài chỉ lên lịch/xuất bản sau khi được chấp thuận."
                    : "Người duyệt chỉ xử lý các bài được giao cho mình và có thể giữ hoặc điều chỉnh lịch đề xuất trước khi duyệt."}
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
          {filtered.map((item, index) => {
            const activeRevision = activeRevisionFor(item);
            return (
              <article className="admin-content-row" key={item.id}>
                <div className="admin-content-title-cell">
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <div><strong>{item.title}</strong><span>{item.category}{item.featured ? " · Nổi bật" : ""}{item.coverMediaId ? " · Có ảnh" : ""}{item.originSlug ? " · Bản chỉnh sửa" : ""}{activeRevision ? ` · Có bản sửa: ${statusLabel(activeRevision.status)}` : ""}{item.reviewerName && item.status === "review" ? ` · → ${item.reviewerName}` : ""}</span></div>
                </div>
                <span>{typeLabel(item.type)}</span>
                <span className={`admin-status-pill is-${item.status}`}>{statusLabel(item.status)}</span>
                <span>
                  {item.status === "published"
                    ? formatDate(item.publishedAt)
                    : item.status === "scheduled"
                      ? formatDateTime(item.publishAt)
                      : item.status === "review"
                        ? item.publishAt ? `Đề xuất ${formatDateTime(item.publishAt)}` : `Chờ ${item.reviewerName ?? "duyệt"}`
                        : `Sửa ${new Date(item.updatedAt).toLocaleDateString("vi-VN")}`}
                </span>
                <div className="admin-row-actions">
                  <button type="button" disabled={busy} onClick={() => editItem(item)}>
                    {item.status === "published"
                      ? isReviewer ? "Xem" : activeRevision ? "Mở bản sửa" : "Tạo bản chỉnh sửa"
                      : item.status === "review" && !isEditor ? "Mở duyệt" : "Biên tập"}
                  </button>
                  {item.status === "published" ? <Link href={`/tin-tuc/${item.slug}`}>Mở ↗</Link> : null}
                  {item.status === "published" && isSuperadmin ? (
                    <button type="button" disabled={busy} onClick={() => mutate("unpublish", { id: item.id, feedback: "Gỡ xuất bản bởi quản trị cấp cao." })}>Gỡ xuất bản</button>
                  ) : null}
                  {item.status === "draft" && (isEditor || isSuperadmin) ? (
                    <button className="danger" type="button" disabled={busy} onClick={() => mutate("delete", { id: item.id })}>Xóa</button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty-state"><span>0 kết quả</span><strong>{isReviewer ? "Không có bài nào đang chờ tài khoản này duyệt." : "Không tìm thấy nội dung phù hợp."}</strong><p>Thử đổi từ khóa, loại hoặc trạng thái nội dung.</p></div>
        ) : null}
      </section>
    </div>
  );
}
