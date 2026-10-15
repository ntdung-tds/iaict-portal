"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CmsRoleCode } from "@/lib/cms-roles";
import { getCmsModule, type CmsField, type CmsModuleConfig } from "@/lib/cms-schema";
import styles from "./cms-collection-manager.module.css";

type CmsRecord = Record<string, unknown> & { id: string };

type CollectionResponse = {
  ok: true;
  items: CmsRecord[];
  total: number;
  actor?: { roles?: CmsRoleCode[] };
};

type FieldPresentation = {
  label: string;
  help?: string;
  placeholder?: string;
  required: boolean;
  readonly: boolean;
  hiddenWhenNew?: boolean;
};

const MEDIA_FIELD_PRESENTATION: Record<string, Partial<FieldPresentation>> = {
  type: {
    label: "Loại tệp",
    help: "Chọn loại nội dung để CMS xử lý và hiển thị đúng ngữ cảnh: ảnh, tài liệu, video hoặc loại khác.",
  },
  public_url: {
    label: "URL công khai",
    required: true,
    placeholder: "https://...",
    help: "Bắt buộc ở thời điểm hiện tại. Dán đường dẫn HTTPS có thể mở trực tiếp tới ảnh, tài liệu hoặc video.",
  },
  visibility: {
    label: "Phạm vi sử dụng",
    help: "Công khai: có thể dùng trên website. Riêng tư: chỉ dùng nội bộ CMS. Lưu ý: lựa chọn này không thể biến một URL bên ngoài vốn công khai thành URL riêng tư.",
  },
  filename: {
    label: "Tên tệp",
    placeholder: "Ví dụ: tram-rung-iot.jpg",
    help: "Có thể để trống; CMS sẽ thử lấy tên tệp từ URL khi tạo mới.",
  },
  mime_type: {
    label: "Định dạng MIME",
    placeholder: "Ví dụ: image/jpeg",
    help: "Không bắt buộc. CMS sẽ tự suy đoán với các định dạng phổ biến nếu tên tệp có phần mở rộng rõ ràng.",
  },
  size_bytes: {
    label: "Dung lượng (byte)",
    placeholder: "Ví dụ: 245760",
    help: "Không bắt buộc. Chỉ dùng khi cần theo dõi dung lượng tệp; nhập số nguyên không âm tính theo byte, không nhập KB/MB.",
  },
  alt: {
    label: "Mô tả thay thế (Alt)",
    placeholder: "Mô tả ngắn nội dung hình ảnh",
    help: "Rất nên nhập cho ảnh để hỗ trợ khả năng truy cập và SEO. Không cần lặp lại caption nếu caption đã mô tả đầy đủ.",
  },
  caption: {
    label: "Chú thích (Caption)",
    placeholder: "Chú thích hiển thị bên dưới ảnh/tài liệu khi cần",
    help: "Không bắt buộc. Dùng cho chú thích biên tập có thể hiển thị công khai.",
  },
  metadata_json: {
    label: "Metadata nâng cao (JSON)",
    placeholder: "{}",
    help: "Trường nâng cao dành cho dữ liệu kỹ thuật bổ sung. Nếu không cần, hãy giữ nguyên {}.",
  },
  storage_key: {
    label: "Khóa lưu trữ nội bộ",
    required: false,
    readonly: true,
    hiddenWhenNew: true,
    help: "Do hệ thống tự sinh. Người dùng CMS không cần nhập hoặc thay đổi giá trị này.",
  },
};

function fieldPresentation(moduleKey: string, field: CmsField): FieldPresentation {
  const special = moduleKey === "media" ? MEDIA_FIELD_PRESENTATION[field.key] : undefined;
  return {
    label: special?.label ?? field.label,
    help: special?.help ?? field.help,
    placeholder: special?.placeholder ?? field.placeholder,
    required: special?.required ?? Boolean(field.required),
    readonly: special?.readonly ?? Boolean(field.readonly),
    hiddenWhenNew: special?.hiddenWhenNew,
  };
}

function jsonDefault(field: CmsField) {
  return ["seo_json", "layout_json", "metadata_json", "public_contacts_json"].includes(field.key) ? "{}" : "[]";
}

function emptyDraft(fields: CmsField[]) {
  const draft: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.readonly) continue;
    if (field.type === "boolean") draft[field.key] = false;
    else if (field.type === "json") draft[field.key] = jsonDefault(field);
    else if (field.type === "select") draft[field.key] = field.options?.[0]?.value ?? "";
    else draft[field.key] = "";
  }
  return draft;
}

function valueForInput(field: CmsField, value: unknown) {
  if (field.type === "boolean") return Boolean(value === true || value === 1 || value === "1");
  if (value === null || value === undefined) return "";
  if (field.type === "datetime") {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 16);
  }
  if (field.type === "json" && typeof value !== "string") return JSON.stringify(value, null, 2);
  if (field.type === "json" && typeof value === "string") {
    try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
  }
  return String(value);
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (value === 1 || value === true) return "Có";
  if (value === 0 || value === false) return "Không";
  return String(value);
}

function formatTime(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function inferMediaType(draft: Record<string, unknown>) {
  const mime = String(draft.mime_type ?? "").trim().toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("application/") || mime.startsWith("text/")) return "document";

  const source = String(draft.filename || draft.public_url || "").split(/[?#]/)[0].toLowerCase();
  const extension = source.split(".").pop();
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension ?? "")) return "image";
  if (["mp4", "webm"].includes(extension ?? "")) return "video";
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(extension ?? "")) return "document";
  return null;
}

function validateDraft(moduleKey: string, config: CmsModuleConfig, draft: Record<string, unknown>) {
  for (const field of config.fields) {
    const view = fieldPresentation(moduleKey, field);
    if (view.readonly) continue;
    const value = draft[field.key];
    const slugCanAutofill = field.key === config.slugColumn && !isEmpty(draft[config.titleColumn]);
    if (view.required && !slugCanAutofill && isEmpty(value)) return `Vui lòng nhập ${view.label.toLowerCase()}.`;

    if (!isEmpty(value) && field.type === "url") {
      try {
        const url = new URL(String(value));
        if (!["http:", "https:"].includes(url.protocol)) return `${view.label} phải bắt đầu bằng http:// hoặc https://.`;
        if (moduleKey === "media" && field.key === "public_url" && url.protocol !== "https:") return "URL Media phải sử dụng HTTPS để có thể nhúng an toàn trên website.";
      } catch { return `${view.label} chưa đúng định dạng URL.`; }
    }
    if (!isEmpty(value) && field.type === "number") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return `${view.label} phải là một số hợp lệ.`;
      if (moduleKey === "media" && field.key === "size_bytes" && (!Number.isSafeInteger(parsed) || parsed < 0)) return "Dung lượng Media phải là số nguyên không âm tính theo byte.";
    }
    if (!isEmpty(value) && field.type === "json" && typeof value === "string") {
      try { JSON.parse(value); }
      catch { return `Dữ liệu JSON ở trường ${view.label} chưa hợp lệ.`; }
    }
  }

  if (moduleKey === "media") {
    const selectedType = String(draft.type ?? "");
    const inferredType = inferMediaType(draft);
    if (selectedType && selectedType !== "other" && inferredType && selectedType !== inferredType) return "Loại tệp đã chọn không phù hợp với URL, tên tệp hoặc MIME. Vui lòng kiểm tra lại loại Media.";
  }

  return null;
}

export function CmsCollectionManager({ moduleKey }: { moduleKey: string }) {
  const config = getCmsModule(moduleKey);
  const [items, setItems] = useState<CmsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<CmsRoleCode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const statusField = useMemo(() => config?.fields.find((field) => field.key === config.statusColumn), [config]);
  const canEdit = roles.includes("admin") || roles.includes("editor");
  const canAdmin = roles.includes("admin");

  const load = useCallback(async () => {
    const activeConfig = config;
    if (!activeConfig) return;
    setError(null);
    const params = new URLSearchParams({ module: moduleKey, limit: "120" });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    const response = await fetch(`/api/admin/cms/collection?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json() as CollectionResponse & { error?: string };
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    setRoles(payload.actor?.roles ?? []);
    setItems(payload.items);
    setTotal(payload.total);
    setSelectedId((current) => {
      const next = current && payload.items.some((item) => item.id === current)
        ? payload.items.find((item) => item.id === current) ?? null
        : payload.items[0] ?? null;
      setDraft(next ? { ...next } : emptyDraft(activeConfig.fields));
      return next?.id ?? null;
    });
  }, [config, moduleKey, q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause))); }, q ? 260 : 0);
    return () => window.clearTimeout(timer);
  }, [load, q]);

  if (!config) return <main className={styles.page}><div className={styles.error}>Module CMS không tồn tại.</div></main>;
  const moduleConfig = config;

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;
  const canCreate = canEdit && moduleConfig.allowCreate !== false && !moduleConfig.readOnly;
  const canDelete = canAdmin && moduleConfig.allowDelete !== false && !moduleConfig.readOnly && Boolean(selectedId);
  const validationMessage = canEdit && !moduleConfig.readOnly ? validateDraft(moduleKey, moduleConfig, draft) : null;
  const isMedia = moduleKey === "media";
  const mediaUrl = isMedia && typeof draft.public_url === "string" ? draft.public_url.trim() : "";
  const mediaType = isMedia && typeof draft.type === "string" ? draft.type : "";

  function selectItem(item: CmsRecord) { setSelectedId(item.id); setDraft({ ...item }); setMessage(null); setError(null); }
  function startNew() { if (!canCreate) return; setSelectedId(null); setDraft(emptyDraft(moduleConfig.fields)); setMessage(null); setError(null); }
  function changeField(field: CmsField, value: unknown) { if (!canEdit) return; setDraft((current) => ({ ...current, [field.key]: value })); setMessage(null); }

  async function save() {
    if (!canEdit) return;
    const clientError = validateDraft(moduleKey, moduleConfig, draft);
    if (clientError) { setError(clientError); setMessage(null); return; }
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/cms/collection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: moduleKey, id: selectedId, data: draft }) });
      const payload = await response.json() as { ok?: boolean; id?: string; error?: string; code?: string };
      if (!response.ok) throw new Error(payload.error || "Không thể lưu dữ liệu. Vui lòng thử lại.");
      setSelectedId(payload.id ?? selectedId); setMessage(selectedId ? `Đã lưu ${moduleConfig.singular}.` : `Đã tạo ${moduleConfig.singular}.`); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  async function remove() {
    if (!canDelete || !selectedId) return;
    if (!window.confirm(`Xóa ${moduleConfig.singular} đang chọn? Bản trước khi xóa vẫn được ghi vào revision log.`)) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/cms/collection", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: moduleKey, id: selectedId }) });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error || "Không thể xóa dữ liệu. Vui lòng thử lại.");
      setSelectedId(null); setMessage(`Đã xóa ${moduleConfig.singular}.`); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>IAICT CMS / {moduleKey}</span><h1>{isMedia ? "Thư viện Media" : moduleConfig.label}</h1><p>{isMedia ? "Quản lý ảnh, tài liệu và video dùng trên website cùng mô tả, chú thích và thông tin truy cập." : moduleConfig.description}</p></div>
        <div className={styles.headerActions}><span className={styles.totalBadge}>{total} mục</span>{canCreate ? <button type="button" onClick={startNew}>+ Tạo mới</button> : null}</div>
      </header>

      {isMedia ? <section className={styles.moduleNotice} aria-label="Hướng dẫn Media"><div><strong>Hiện tại: thêm Media bằng URL công khai</strong><p>Cloudflare R2 chưa được cấu hình cho môi trường này nên CMS chưa tải tệp trực tiếp từ thiết bị. Hãy dán URL HTTPS công khai của tệp; hệ thống sẽ tự tạo khóa lưu trữ nội bộ. Khi R2 được bật, khu vực này sẽ có chức năng tải tệp lên.</p></div><span>Upload trực tiếp: chưa bật</span></section> : null}

      <div className={styles.toolbar}>
        <label className={styles.searchBox}><span>Tìm kiếm</span><input value={q} onChange={(event) => setQ(event.target.value)} placeholder={`Tìm trong ${(isMedia ? "thư viện Media" : moduleConfig.label).toLowerCase()}…`} /></label>
        {statusField?.options ? <label className={styles.filterBox}><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả</option>{statusField.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : null}
        <button className={styles.refreshButton} type="button" onClick={() => void load()} disabled={busy}>Làm mới</button>
      </div>

      {!canEdit && roles.length && !moduleConfig.readOnly ? <div className={styles.success} role="status">Chế độ chỉ đọc theo vai trò hiện tại.</div> : null}
      {(error || message) ? <div className={error ? styles.error : styles.success} role="status">{error ?? message}</div> : null}

      <section className={styles.workspace}>
        <aside className={styles.listPanel}>
          <div className={styles.panelHead}><div><span>Danh sách</span><strong>{items.length} / {total}</strong></div></div>
          <div className={styles.list}>{items.length === 0 ? <div className={styles.empty}>Không có dữ liệu phù hợp.</div> : null}{items.map((item) => <button type="button" key={item.id} onClick={() => selectItem(item)} className={item.id === selectedId ? styles.itemActive : styles.item}><span className={styles.itemMeta}>{moduleConfig.statusColumn ? displayValue(item[moduleConfig.statusColumn]) : formatTime(item.updated_at ?? item.created_at)}</span><strong>{displayValue(item[moduleConfig.titleColumn])}</strong>{moduleConfig.subtitleColumn ? <small>{displayValue(item[moduleConfig.subtitleColumn])}</small> : null}</button>)}</div>
        </aside>

        <section className={styles.editorPanel}>
          <div className={styles.panelHead}><div><span>{selected ? canEdit ? "Chỉnh sửa" : "Chi tiết" : canCreate ? "Tạo mới" : "Chi tiết"}</span><strong>{selected ? displayValue(selected[moduleConfig.titleColumn]) : isMedia ? "media mới" : moduleConfig.singular}</strong></div>{selected?.updated_at ? <small>Cập nhật {formatTime(selected.updated_at)}</small> : null}</div>

          {isMedia ? <div className={styles.mediaPreview}>
            <div><span>Xem trước</span><strong>{mediaUrl ? "Nguồn Media đã nhập" : "Chưa có URL để xem trước"}</strong><small>{mediaUrl ? "Kiểm tra tệp trước khi lưu để tránh liên kết hỏng hoặc sai nội dung." : "Dán URL HTTPS công khai ở biểu mẫu bên dưới."}</small></div>
            {mediaUrl && mediaType === "image" ? <a href={mediaUrl} target="_blank" rel="noreferrer" className={styles.imagePreviewLink}><img src={mediaUrl} alt={typeof draft.alt === "string" ? draft.alt : "Xem trước Media"} /></a> : mediaUrl ? <a className={styles.openMediaButton} href={mediaUrl} target="_blank" rel="noreferrer">Mở tệp ↗</a> : null}
          </div> : null}

          <div className={styles.editorBody}>
            {moduleConfig.fields.map((field) => {
              const view = fieldPresentation(moduleKey, field);
              if (!selectedId && view.hiddenWhenNew) return null;
              const rawValue = draft[field.key];
              const common = { disabled: busy || !canEdit || view.readonly || Boolean(moduleConfig.readOnly), "aria-label": view.label };
              return <label className={field.type === "textarea" || field.type === "json" ? styles.fieldWide : styles.field} key={field.key}><span>{view.label}{view.required ? <b> *</b> : null}</span>{field.type === "textarea" || field.type === "json" ? <textarea {...common} rows={field.type === "json" ? 7 : 5} value={String(valueForInput(field, rawValue))} placeholder={view.placeholder} onChange={(event) => changeField(field, event.target.value)} spellCheck={field.type !== "json"} /> : field.type === "select" ? <select {...common} value={String(valueForInput(field, rawValue))} onChange={(event) => changeField(field, event.target.value)}>{(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "boolean" ? <span className={styles.toggleRow}><input {...common} type="checkbox" checked={Boolean(valueForInput(field, rawValue))} onChange={(event) => changeField(field, event.target.checked)} /><em>{Boolean(valueForInput(field, rawValue)) ? "Bật" : "Tắt"}</em></span> : <input {...common} type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"} value={String(valueForInput(field, rawValue))} placeholder={view.placeholder} onChange={(event) => changeField(field, event.target.value)} />}{view.help ? <small>{view.help}</small> : null}</label>;
            })}
          </div>

          {!moduleConfig.readOnly && canEdit ? <div className={styles.editorActions}>{validationMessage ? <span className={styles.validationHint}>{validationMessage}</span> : null}<button type="button" className={styles.saveButton} onClick={() => void save()} disabled={busy || Boolean(validationMessage)}>{busy ? "Đang lưu…" : selectedId ? "Lưu thay đổi" : `Tạo ${isMedia ? "media" : moduleConfig.singular}`}</button>{canDelete ? <button type="button" className={styles.deleteButton} onClick={() => void remove()} disabled={busy}>Xóa</button> : null}{selectedId ? <button type="button" className={styles.cancelButton} onClick={() => selected && selectItem(selected)} disabled={busy}>Hoàn tác form</button> : null}</div> : <div className={styles.readOnlyNote}>{moduleConfig.readOnly ? "Module chỉ đọc. Dữ liệu này được dùng cho giám sát và truy vết." : "Vai trò hiện tại chỉ có quyền xem dữ liệu trong module này."}</div>}
        </section>
      </section>
    </main>
  );
}
