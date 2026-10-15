"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CmsRoleCode } from "@/lib/cms-roles";
import { getCmsModule, type CmsField } from "@/lib/cms-schema";
import styles from "./cms-collection-manager.module.css";

type CmsRecord = Record<string, unknown> & { id: string };

type CollectionResponse = {
  ok: true;
  items: CmsRecord[];
  total: number;
  actor?: { roles?: CmsRoleCode[] };
};

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

  function selectItem(item: CmsRecord) { setSelectedId(item.id); setDraft({ ...item }); setMessage(null); setError(null); }
  function startNew() { if (!canCreate) return; setSelectedId(null); setDraft(emptyDraft(moduleConfig.fields)); setMessage(null); setError(null); }
  function changeField(field: CmsField, value: unknown) { if (!canEdit) return; setDraft((current) => ({ ...current, [field.key]: value })); }

  async function save() {
    if (!canEdit) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/cms/collection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: moduleKey, id: selectedId, data: draft }) });
      const payload = await response.json() as { ok?: boolean; id?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
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
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setSelectedId(null); setMessage(`Đã xóa ${moduleConfig.singular}.`); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>IAICT CMS / {moduleKey}</span><h1>{moduleConfig.label}</h1><p>{moduleConfig.description}</p></div>
        <div className={styles.headerActions}><span className={styles.totalBadge}>{total} mục</span>{canCreate ? <button type="button" onClick={startNew}>+ Tạo mới</button> : null}</div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchBox}><span>Tìm kiếm</span><input value={q} onChange={(event) => setQ(event.target.value)} placeholder={`Tìm trong ${moduleConfig.label.toLowerCase()}…`} /></label>
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
          <div className={styles.panelHead}><div><span>{selected ? canEdit ? "Chỉnh sửa" : "Chi tiết" : canCreate ? "Tạo mới" : "Chi tiết"}</span><strong>{selected ? displayValue(selected[moduleConfig.titleColumn]) : moduleConfig.singular}</strong></div>{selected?.updated_at ? <small>Cập nhật {formatTime(selected.updated_at)}</small> : null}</div>
          <div className={styles.editorBody}>
            {moduleConfig.fields.map((field) => {
              const rawValue = draft[field.key];
              const common = { disabled: busy || !canEdit || Boolean(field.readonly) || Boolean(moduleConfig.readOnly), "aria-label": field.label };
              return <label className={field.type === "textarea" || field.type === "json" ? styles.fieldWide : styles.field} key={field.key}><span>{field.label}{field.required ? <b> *</b> : null}</span>{field.type === "textarea" || field.type === "json" ? <textarea {...common} rows={field.type === "json" ? 7 : 5} value={String(valueForInput(field, rawValue))} placeholder={field.placeholder} onChange={(event) => changeField(field, event.target.value)} spellCheck={field.type !== "json"} /> : field.type === "select" ? <select {...common} value={String(valueForInput(field, rawValue))} onChange={(event) => changeField(field, event.target.value)}>{(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "boolean" ? <span className={styles.toggleRow}><input {...common} type="checkbox" checked={Boolean(valueForInput(field, rawValue))} onChange={(event) => changeField(field, event.target.checked)} /><em>{Boolean(valueForInput(field, rawValue)) ? "Bật" : "Tắt"}</em></span> : <input {...common} type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"} value={String(valueForInput(field, rawValue))} placeholder={field.placeholder} onChange={(event) => changeField(field, event.target.value)} />}{field.help ? <small>{field.help}</small> : null}</label>;
            })}
          </div>

          {!moduleConfig.readOnly && canEdit ? <div className={styles.editorActions}><button type="button" className={styles.saveButton} onClick={() => void save()} disabled={busy}>{busy ? "Đang lưu…" : selectedId ? "Lưu thay đổi" : `Tạo ${moduleConfig.singular}`}</button>{canDelete ? <button type="button" className={styles.deleteButton} onClick={() => void remove()} disabled={busy}>Xóa</button> : null}{selectedId ? <button type="button" className={styles.cancelButton} onClick={() => selected && selectItem(selected)} disabled={busy}>Hoàn tác form</button> : null}</div> : <div className={styles.readOnlyNote}>{moduleConfig.readOnly ? "Module chỉ đọc. Dữ liệu này được dùng cho giám sát và truy vết." : "Vai trò hiện tại chỉ có quyền xem dữ liệu trong module này."}</div>}
        </section>
      </section>
    </main>
  );
}
