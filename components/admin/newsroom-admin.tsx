"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NewsSourceSettings } from "./news-source-settings";
import { auditTime } from "@/lib/cms-audit-display";
import type { CmsRoleCode } from "@/lib/cms-roles";
import styles from "./newsroom-admin.module.css";

type ReviewStatus = "pending" | "editing" | "approved" | "rejected" | "published";
type PublicationMode = "inherit" | "manual" | "auto";
type TrustLevel = "official" | "verified" | "reference";

type WorkflowSettings = {
  autoPublishEnabled: boolean;
  autoPublishMinTrust: TrustLevel;
  autoPublishMaxPerRun: number;
  requireAttribution: boolean;
  requireSourcePublishedAt: boolean;
};

type Source = {
  id: string;
  name: string;
  homepageUrl: string;
  entryUrl: string;
  fetchStrategy: string;
  trustLevel: TrustLevel;
  publicationMode: PublicationMode;
  isActive: boolean;
  attributionMode: string;
  defaultCategoryId: string | null;
  lastFetchedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number;
  scheduleRetryMinutes: number;
  nextScheduledAt: string | null;
  lastScheduledAt: string | null;
};

type Category = { id: string; name: string; slug: string };
type QueueCounts = Record<ReviewStatus, number>;
type Actor = { id: string; email: string; displayName: string | null; roles: CmsRoleCode[] };

type SchedulerRun = {
  id: string;
  scheduled_key: string;
  cron_expression: string;
  status: "running" | "succeeded" | "partial" | "failed" | "skipped";
  due_count: number;
  claimed_count: number;
  succeeded_count: number;
  failed_count: number;
  skipped_count: number;
  started_at: string;
  finished_at: string | null;
};

type ReviewItem = {
  queue_id: string;
  ingest_item_id: string;
  workflow_status: ReviewStatus;
  suggested_title: string;
  suggested_excerpt: string | null;
  suggested_category_id: string | null;
  edited_title: string | null;
  edited_excerpt: string | null;
  approval_mode: "manual" | "auto";
  editor_notes: string | null;
  source_id: string;
  source_name: string;
  source_url: string;
  canonical_url: string;
  source_published_at: string | null;
  fetched_at: string;
  queued_at: string;
  reviewed_at: string | null;
  published_at: string | null;
  article_id: string | null;
};

type Overview = {
  settings: WorkflowSettings;
  sources: Source[];
  categories: Category[];
  queueCounts: QueueCounts;
  schedulerRuns: SchedulerRun[];
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Chờ duyệt",
  editing: "Đang biên tập",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  published: "Đã xuất bản",
};

const STATUS_ORDER: ReviewStatus[] = ["pending", "editing", "approved", "rejected", "published"];

function formatTime(value: string | null) {
  if (!value) return "Chưa có";
  return auditTime(value);
}

function schedulerStatusClass(status: SchedulerRun["status"]) {
  if (status === "succeeded") return styles.schedulerHealthy;
  if (status === "failed") return styles.schedulerFailed;
  return styles.schedulerWarning;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function NewsroomAdmin() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [actor, setActor] = useState<Actor | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<WorkflowSettings | null>(null);
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => items.find((item) => item.queue_id === selectedId) ?? null, [items, selectedId]);
  const roles = actor?.roles ?? [];
  const canAdmin = roles.includes("admin") || roles.includes("news_admin");
  const canEdit = roles.some((role) => ["admin", "editor", "news_admin", "news_editor"].includes(role));
  const canReview = roles.some((role) => ["admin", "reviewer", "news_admin", "news_reviewer"].includes(role));
  const canWriteNotes = canEdit || canReview;

  const loadOverview = useCallback(async () => {
    const response = await fetch("/api/admin/news/settings", { cache: "no-store" });
    const payload = await readJson<{ ok: true; actor: Actor } & Overview>(response);
    const next: Overview = {
      settings: payload.settings,
      sources: payload.sources,
      categories: payload.categories,
      queueCounts: payload.queueCounts,
      schedulerRuns: payload.schedulerRuns ?? [],
    };
    setActor(payload.actor);
    setOverview(next);
    setSettingsDraft(current => current ?? next.settings);
  }, []);

  const loadQueue = useCallback(async (nextStatus: ReviewStatus) => {
    const response = await fetch(`/api/admin/news/review?status=${nextStatus}&limit=60`, { cache: "no-store" });
    const payload = await readJson<{ ok: true; items: ReviewItem[] }>(response);
    setItems(payload.items);
    setSelectedId((current) => {
      if (current && payload.items.some((item) => item.queue_id === current)) return current;
      return payload.items[0]?.queue_id ?? null;
    });
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    await Promise.all([loadOverview(), loadQueue(status)]);
  }, [loadOverview, loadQueue, status]);

  useEffect(() => {
    void refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause)));
  }, [refresh]);

  useEffect(() => {
    if (!selected) return;
    setEditTitle(selected.edited_title ?? selected.suggested_title);
    setEditExcerpt(selected.edited_excerpt ?? selected.suggested_excerpt ?? "");
    setEditCategory(selected.suggested_category_id ?? "");
    setEditNotes(selected.editor_notes ?? "");
  }, [selected]);

  async function post(path: string, body: unknown) {
    return readJson<{ ok: true; [key: string]: unknown }>(await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
  }

  async function runAction(key: string, task: () => Promise<void>, success: string) {
    setBusy(key); setError(null); setMessage(null);
    try { await task(); setMessage(success); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(null); }
  }

  function changeStatus(next: ReviewStatus) { setStatus(next); setSelectedId(null); }

  if (!overview || !settingsDraft) {
    return <main id="main-content" className={styles.loading}><strong>IAICT Newsroom</strong><span>{error ? `Không thể tải CMS: ${error}` : "Đang tải dữ liệu quản trị…"}</span></main>;
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.topbar}>
        <div><span className={styles.eyebrow}>IAICT CMS / V16.5</span><h1>Newsroom Control Center</h1><p>Lấy tin, biên tập, duyệt, xuất bản và theo dõi tự động hóa trong một luồng có truy vết.</p></div>
        <div className={styles.topActions}>
          <span className={settingsDraft.autoPublishEnabled ? styles.autoOn : styles.autoOff}>Auto publish {settingsDraft.autoPublishEnabled ? "ON" : "OFF"}</span>
          <button type="button" onClick={() => void refresh().catch(cause=>setError(cause instanceof Error?cause.message:String(cause)))} disabled={busy !== null}>Làm mới</button>
        </div>
      </header>

      {actor ? <div className={styles.alertSuccess} role="status">Quyền hiện tại: {actor.roles.join(" · ")} · {canAdmin ? "Quản trị Newsroom" : canReview && canEdit ? "Biên tập + duyệt" : canReview ? "Duyệt/xuất bản" : canEdit ? "Biên tập" : "Chỉ xem"}</div> : null}
      {(message || error) && <div className={error ? styles.alertError : styles.alertSuccess} role="status">{error ?? message}</div>}

      <section className={styles.kpiGrid} aria-label="Tổng quan hàng chờ">
        {STATUS_ORDER.map((entry) => <button type="button" key={entry} className={entry === status ? styles.kpiActive : styles.kpi} onClick={() => changeStatus(entry)}><span>{STATUS_LABELS[entry]}</span><strong>{overview.queueCounts[entry]}</strong></button>)}
      </section>

      <section className={styles.workspace}>
        <aside className={styles.sourcesPanel}>
          <div className={styles.panelHead}><div><span>Nguồn tin</span><strong>{overview.sources.length} nguồn</strong></div></div>
          <div className={styles.sourceList}>
            {overview.sources.map((source) => (
              <article className={styles.sourceCard} key={source.id}>
                <div className={styles.sourceTitleRow}><span className={source.isActive ? styles.healthGood : styles.healthMuted} aria-hidden="true" /><div><strong>{source.name}</strong><small>{source.fetchStrategy.toUpperCase()} · {({official:"Chính thống",verified:"Đã xác minh",reference:"Tham khảo"} as const)[source.trustLevel]}</small></div></div>
                <dl>
                  <div><dt>Lần lấy gần nhất</dt><dd>{formatTime(source.lastFetchedAt)}</dd></div>
                  <div><dt>Chế độ</dt><dd>{{inherit:"Theo cài đặt chung",manual:"Duyệt thủ công",auto:"Cho phép tự đăng"}[source.publicationMode]}</dd></div>
                  <div><dt>Lịch tự động</dt><dd>{source.scheduleEnabled ? `${source.scheduleIntervalMinutes} phút` : "Tắt"}</dd></div>
                  <div><dt>Lần kế tiếp</dt><dd>{source.scheduleEnabled ? formatTime(source.nextScheduledAt) : "—"}</dd></div>
                </dl>
                {source.lastError && <p className={styles.sourceError}>{source.lastError}</p>}
                <div className={styles.sourceActions}>
                  <a href={source.homepageUrl} target="_blank" rel="noreferrer">Mở nguồn</a>
                  {canAdmin ? <button type="button" disabled={!source.isActive || busy !== null} onClick={() => void runAction(`ingest-${source.id}`, async () => { await post("/api/admin/news/ingest", { sourceId: source.id }); }, `Đã hoàn tất lấy tin từ ${source.name}.`)}>{busy === `ingest-${source.id}` ? "Đang lấy…" : "Lấy tin ngay"}</button> : null}
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className={styles.queuePanel} aria-label="Hàng chờ biên tập">
          <div className={styles.panelHead}><div><span>{STATUS_LABELS[status]}</span><strong>{items.length} mục đang hiển thị</strong></div></div>
          <div className={styles.queueList}>
            {items.length === 0 && <div className={styles.empty}>Không có nội dung ở trạng thái này.</div>}
            {items.map((item) => <button type="button" key={item.queue_id} className={item.queue_id === selectedId ? styles.queueItemActive : styles.queueItem} onClick={() => setSelectedId(item.queue_id)}><span className={styles.queueMeta}>{item.source_name} · {formatTime(item.queued_at)}</span><strong>{item.edited_title ?? item.suggested_title}</strong><small>{item.approval_mode === "auto" ? "Policy approval" : STATUS_LABELS[item.workflow_status]}</small></button>)}
          </div>
        </section>

        <section className={styles.editorPanel} aria-label="Trình biên tập">
          <div className={styles.panelHead}><div><span>Biên tập & duyệt</span><strong>{selected ? selected.source_name : "Chưa chọn nội dung"}</strong></div></div>
          {!selected ? <div className={styles.empty}>Chọn một mục trong hàng chờ để xem và xử lý.</div> : (
            <div className={styles.editorBody}>
              <div className={styles.sourceStrip}><span>{STATUS_LABELS[selected.workflow_status]}</span><a href={selected.canonical_url} target="_blank" rel="noreferrer">Xem bài gốc ↗</a></div>
              <label><span>Tiêu đề</span><textarea disabled={!canEdit} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} rows={3} /></label>
              <label><span>Tóm tắt</span><textarea disabled={!canEdit} value={editExcerpt} onChange={(event) => setEditExcerpt(event.target.value)} rows={5} /></label>
              <label><span>Chuyên mục</span><select disabled={!canEdit} value={editCategory} onChange={(event) => setEditCategory(event.target.value)}><option value="">Chọn chuyên mục</option>{overview.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label><span>Ghi chú nội bộ / lý do từ chối</span><textarea disabled={!canWriteNotes} value={editNotes} onChange={(event) => setEditNotes(event.target.value)} rows={3} /></label>

              <div className={styles.provenanceBox}><div><span>Nguồn</span><strong>{selected.source_name}</strong></div><div><span>Ngày nguồn</span><strong>{formatTime(selected.source_published_at)}</strong></div><div><span>Thu thập</span><strong>{formatTime(selected.fetched_at)}</strong></div></div>

              <div className={styles.editorActions}>
                {canEdit && (["pending", "editing", "approved"] as ReviewStatus[]).includes(selected.workflow_status) && <button type="button" disabled={busy !== null} onClick={() => void runAction(`edit-${selected.queue_id}`, async () => { await post("/api/admin/news/review/action", { action: "edit", queueId: selected.queue_id, title: editTitle, excerpt: editExcerpt || null, categoryId: editCategory || null, notes: editNotes || null }); }, "Đã lưu bản biên tập.")}>Lưu biên tập</button>}
                {canReview && (["pending", "editing"] as ReviewStatus[]).includes(selected.workflow_status) && <button type="button" className={styles.approveButton} disabled={busy !== null} onClick={() => void runAction(`approve-${selected.queue_id}`, async () => { await post("/api/admin/news/review/action", { action: "approve", queueId: selected.queue_id, reason: editNotes || null }); }, "Nội dung đã được duyệt.")}>Duyệt</button>}
                {canReview && (["pending", "editing", "approved"] as ReviewStatus[]).includes(selected.workflow_status) && <button type="button" className={styles.rejectButton} disabled={busy !== null} onClick={() => void runAction(`reject-${selected.queue_id}`, async () => { await post("/api/admin/news/review/action", { action: "reject", queueId: selected.queue_id, reason: editNotes || "Từ chối từ Newsroom CMS" }); }, "Nội dung đã được chuyển sang Từ chối.")}>Từ chối</button>}
                {canReview && selected.workflow_status === "approved" && <button type="button" className={styles.publishButton} disabled={busy !== null} onClick={() => void runAction(`publish-${selected.queue_id}`, async () => { await post("/api/admin/news/review/action", { action: "publish", queueId: selected.queue_id }); }, "Đã xuất bản và lưu provenance/audit.")}>Xuất bản</button>}
                {!canEdit && !canReview ? <span>Vai trò hiện tại chỉ có quyền xem Newsroom.</span> : null}
              </div>
            </div>
          )}
        </section>
      </section>

      <section className={styles.settingsSection} aria-labelledby="newsroom-settings-title">
        <div className={styles.settingsIntro}><span className={styles.eyebrow}>Settings / Newsroom</span><h2 id="newsroom-settings-title">Tự động hóa có kiểm soát</h2><p>Cron kiểm tra mỗi 15 phút nhưng chỉ chạy các nguồn đến hạn theo lịch riêng trong D1. Thay đổi chính sách tự động hóa chỉ dành cho Quản trị viên Newsroom.</p></div>
        <div className={styles.settingsCard}>
          {!canAdmin ? <div className={styles.empty}>Chế độ chỉ đọc. Bạn có thể theo dõi cấu hình và lịch chạy nhưng không thể thay đổi.</div> : null}
          <label className={styles.switchRow}><div><strong>Auto publish</strong><span>Master switch toàn newsroom</span></div><input disabled={!canAdmin} type="checkbox" checked={settingsDraft.autoPublishEnabled} onChange={(event) => setSettingsDraft({ ...settingsDraft, autoPublishEnabled: event.target.checked })} /></label>
          <div className={styles.settingsGrid}>
            <label><span>Trust tối thiểu</span><select disabled={!canAdmin} value={settingsDraft.autoPublishMinTrust} onChange={(event) => setSettingsDraft({ ...settingsDraft, autoPublishMinTrust: event.target.value as TrustLevel })}><option value="official">Official</option><option value="verified">Verified</option><option value="reference">Reference</option></select></label>
            <label><span>Tối đa / lượt</span><input disabled={!canAdmin} type="number" min={1} max={100} value={settingsDraft.autoPublishMaxPerRun} onChange={(event) => setSettingsDraft({ ...settingsDraft, autoPublishMaxPerRun: Number(event.target.value) })} /></label>
            <label className={styles.checkRow}><input disabled={!canAdmin} type="checkbox" checked={settingsDraft.requireAttribution} onChange={(event) => setSettingsDraft({ ...settingsDraft, requireAttribution: event.target.checked })} /><span>Bắt buộc ghi nguồn</span></label>
            <label className={styles.checkRow}><input disabled={!canAdmin} type="checkbox" checked={settingsDraft.requireSourcePublishedAt} onChange={(event) => setSettingsDraft({ ...settingsDraft, requireSourcePublishedAt: event.target.checked })} /><span>Bắt buộc có ngày nguồn</span></label>
          </div>
          {canAdmin ? <button type="button" className={styles.saveSettings} disabled={busy !== null} onClick={() => void runAction("save-settings", async () => { await post("/api/admin/news/settings", { action: "update-settings", settings: settingsDraft }); }, "Đã lưu cài đặt Newsroom.")}>Lưu cài đặt chung</button> : null}

          <div className={styles.sourceSettings}>
            {overview.sources.map(source=><NewsSourceSettings key={source.id} source={source} canAdmin={canAdmin} locked={busy!==null} onBusy={saving=>setBusy(saving?`source-${source.id}`:null)} onSaved={value=>setOverview(current=>current?{...current,sources:current.sources.map(item=>item.id===source.id?{...item,...value}:item)}:current)}/>)}
          </div>

          <div className={styles.schedulerSummary}><h3>Hoạt động tự động gần nhất</h3>{overview.schedulerRuns.length === 0 ? <div className={styles.empty}>Chưa có Cron run nào được ghi nhận.</div> : overview.schedulerRuns.slice(0, 5).map((run) => <div className={styles.schedulerRun} key={run.id}><strong>{formatTime(run.started_at)}</strong><span className={schedulerStatusClass(run.status)}>{run.status}</span><span>Đến hạn {run.due_count}</span><span>OK {run.succeeded_count}</span><span>Lỗi {run.failed_count}</span></div>)}</div>
        </div>
      </section>
    </main>
  );
}
