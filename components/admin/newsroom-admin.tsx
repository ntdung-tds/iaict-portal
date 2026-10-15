"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
};

type Category = { id: string; name: string; slug: string };
type QueueCounts = Record<ReviewStatus, number>;

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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function NewsroomAdmin() {
  const [overview, setOverview] = useState<Overview | null>(null);
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

  const selected = useMemo(
    () => items.find((item) => item.queue_id === selectedId) ?? null,
    [items, selectedId],
  );

  const loadOverview = useCallback(async () => {
    const response = await fetch("/api/admin/news/settings", { cache: "no-store" });
    const payload = await readJson<{ ok: true } & Overview>(response);
    const next: Overview = {
      settings: payload.settings,
      sources: payload.sources,
      categories: payload.categories,
      queueCounts: payload.queueCounts,
    };
    setOverview(next);
    setSettingsDraft(next.settings);
  }, []);

  const loadQueue = useCallback(async (nextStatus: ReviewStatus) => {
    const response = await fetch(`/api/admin/news/review?status=${nextStatus}&limit=60`, {
      cache: "no-store",
    });
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
    void refresh().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    });
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
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      await task();
      setMessage(success);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(null);
    }
  }

  function changeStatus(next: ReviewStatus) {
    setStatus(next);
    setSelectedId(null);
  }

  if (!overview || !settingsDraft) {
    return (
      <main id="main-content" className={styles.loading}>
        <strong>IAICT Newsroom</strong>
        <span>{error ? `Không thể tải CMS: ${error}` : "Đang tải dữ liệu quản trị…"}</span>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>IAICT CMS / V16.4</span>
          <h1>Newsroom Control Center</h1>
          <p>Lấy tin, biên tập, duyệt và xuất bản trong một luồng có truy vết.</p>
        </div>
        <div className={styles.topActions}>
          <span className={settingsDraft.autoPublishEnabled ? styles.autoOn : styles.autoOff}>
            Auto publish {settingsDraft.autoPublishEnabled ? "ON" : "OFF"}
          </span>
          <button type="button" onClick={() => void refresh()} disabled={busy !== null}>Làm mới</button>
        </div>
      </header>

      {(message || error) && (
        <div className={error ? styles.alertError : styles.alertSuccess} role="status">
          {error ?? message}
        </div>
      )}

      <section className={styles.kpiGrid} aria-label="Tổng quan hàng chờ">
        {STATUS_ORDER.map((entry) => (
          <button
            type="button"
            key={entry}
            className={entry === status ? styles.kpiActive : styles.kpi}
            onClick={() => changeStatus(entry)}
          >
            <span>{STATUS_LABELS[entry]}</span>
            <strong>{overview.queueCounts[entry]}</strong>
          </button>
        ))}
      </section>

      <section className={styles.workspace}>
        <aside className={styles.sourcesPanel}>
          <div className={styles.panelHead}>
            <div><span>Nguồn tin</span><strong>{overview.sources.length} nguồn</strong></div>
          </div>
          <div className={styles.sourceList}>
            {overview.sources.map((source) => (
              <article className={styles.sourceCard} key={source.id}>
                <div className={styles.sourceTitleRow}>
                  <span className={source.isActive ? styles.healthGood : styles.healthMuted} aria-hidden="true" />
                  <div><strong>{source.name}</strong><small>{source.fetchStrategy.toUpperCase()} · {source.trustLevel}</small></div>
                </div>
                <dl>
                  <div><dt>Lần lấy gần nhất</dt><dd>{formatTime(source.lastFetchedAt)}</dd></div>
                  <div><dt>Chế độ</dt><dd>{source.publicationMode}</dd></div>
                </dl>
                {source.lastError && <p className={styles.sourceError}>{source.lastError}</p>}
                <div className={styles.sourceActions}>
                  <a href={source.homepageUrl} target="_blank" rel="noreferrer">Mở nguồn</a>
                  <button
                    type="button"
                    disabled={!source.isActive || busy !== null}
                    onClick={() => void runAction(
                      `ingest-${source.id}`,
                      async () => { await post("/api/admin/news/ingest", { sourceId: source.id }); },
                      `Đã hoàn tất lấy tin từ ${source.name}.`,
                    )}
                  >
                    {busy === `ingest-${source.id}` ? "Đang lấy…" : "Lấy tin ngay"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className={styles.queuePanel} aria-label="Hàng chờ biên tập">
          <div className={styles.panelHead}>
            <div><span>{STATUS_LABELS[status]}</span><strong>{items.length} mục đang hiển thị</strong></div>
          </div>
          <div className={styles.queueList}>
            {items.length === 0 && <div className={styles.empty}>Không có nội dung ở trạng thái này.</div>}
            {items.map((item) => (
              <button
                type="button"
                key={item.queue_id}
                className={item.queue_id === selectedId ? styles.queueItemActive : styles.queueItem}
                onClick={() => setSelectedId(item.queue_id)}
              >
                <span className={styles.queueMeta}>{item.source_name} · {formatTime(item.queued_at)}</span>
                <strong>{item.edited_title ?? item.suggested_title}</strong>
                <small>{item.approval_mode === "auto" ? "Policy approval" : STATUS_LABELS[item.workflow_status]}</small>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.editorPanel} aria-label="Trình biên tập">
          <div className={styles.panelHead}>
            <div><span>Biên tập & duyệt</span><strong>{selected ? selected.source_name : "Chưa chọn nội dung"}</strong></div>
          </div>
          {!selected ? (
            <div className={styles.empty}>Chọn một mục trong hàng chờ để xem và xử lý.</div>
          ) : (
            <div className={styles.editorBody}>
              <div className={styles.sourceStrip}>
                <span>{STATUS_LABELS[selected.workflow_status]}</span>
                <a href={selected.canonical_url} target="_blank" rel="noreferrer">Xem bài gốc ↗</a>
              </div>

              <label>
                <span>Tiêu đề</span>
                <textarea value={editTitle} onChange={(event) => setEditTitle(event.target.value)} rows={3} />
              </label>
              <label>
                <span>Tóm tắt</span>
                <textarea value={editExcerpt} onChange={(event) => setEditExcerpt(event.target.value)} rows={5} />
              </label>
              <label>
                <span>Chuyên mục</span>
                <select value={editCategory} onChange={(event) => setEditCategory(event.target.value)}>
                  <option value="">Chọn chuyên mục</option>
                  {overview.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Ghi chú nội bộ / lý do từ chối</span>
                <textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} rows={3} />
              </label>

              <div className={styles.provenanceBox}>
                <div><span>Nguồn</span><strong>{selected.source_name}</strong></div>
                <div><span>Ngày nguồn</span><strong>{formatTime(selected.source_published_at)}</strong></div>
                <div><span>Thu thập</span><strong>{formatTime(selected.fetched_at)}</strong></div>
              </div>

              <div className={styles.editorActions}>
                {(["pending", "editing", "approved"] as ReviewStatus[]).includes(selected.workflow_status) && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void runAction(
                      `edit-${selected.queue_id}`,
                      async () => {
                        await post("/api/admin/news/review/action", {
                          action: "edit",
                          queueId: selected.queue_id,
                          title: editTitle,
                          excerpt: editExcerpt || null,
                          categoryId: editCategory || null,
                          notes: editNotes || null,
                        });
                      },
                      "Đã lưu bản biên tập.",
                    )}
                  >Lưu biên tập</button>
                )}
                {(["pending", "editing"] as ReviewStatus[]).includes(selected.workflow_status) && (
                  <button
                    type="button"
                    className={styles.approveButton}
                    disabled={busy !== null}
                    onClick={() => void runAction(
                      `approve-${selected.queue_id}`,
                      async () => {
                        await post("/api/admin/news/review/action", {
                          action: "approve",
                          queueId: selected.queue_id,
                          reason: editNotes || null,
                        });
                      },
                      "Nội dung đã được duyệt.",
                    )}
                  >Duyệt</button>
                )}
                {(["pending", "editing", "approved"] as ReviewStatus[]).includes(selected.workflow_status) && (
                  <button
                    type="button"
                    className={styles.rejectButton}
                    disabled={busy !== null}
                    onClick={() => void runAction(
                      `reject-${selected.queue_id}`,
                      async () => {
                        await post("/api/admin/news/review/action", {
                          action: "reject",
                          queueId: selected.queue_id,
                          reason: editNotes || "Từ chối từ Newsroom CMS",
                        });
                      },
                      "Nội dung đã được chuyển sang Từ chối.",
                    )}
                  >Từ chối</button>
                )}
                {selected.workflow_status === "approved" && (
                  <button
                    type="button"
                    className={styles.publishButton}
                    disabled={busy !== null}
                    onClick={() => void runAction(
                      `publish-${selected.queue_id}`,
                      async () => {
                        await post("/api/admin/news/review/action", {
                          action: "publish",
                          queueId: selected.queue_id,
                        });
                      },
                      "Đã xuất bản và lưu provenance/audit.",
                    )}
                  >Xuất bản</button>
                )}
              </div>
            </div>
          )}
        </section>
      </section>

      <section className={styles.settingsSection} aria-labelledby="newsroom-settings-title">
        <div className={styles.settingsIntro}>
          <span className={styles.eyebrow}>Settings / Newsroom</span>
          <h2 id="newsroom-settings-title">Tự động hóa có kiểm soát</h2>
          <p>Auto publish mặc định tắt. Khi bật, hệ thống vẫn áp dụng dedupe, trust, attribution, category và publication claim trước khi xuất bản.</p>
        </div>
        <div className={styles.settingsCard}>
          <label className={styles.switchRow}>
            <div><strong>Auto publish</strong><span>Master switch toàn newsroom</span></div>
            <input
              type="checkbox"
              checked={settingsDraft.autoPublishEnabled}
              onChange={(event) => setSettingsDraft({ ...settingsDraft, autoPublishEnabled: event.target.checked })}
            />
          </label>
          <div className={styles.settingsGrid}>
            <label><span>Trust tối thiểu</span><select value={settingsDraft.autoPublishMinTrust} onChange={(event) => setSettingsDraft({ ...settingsDraft, autoPublishMinTrust: event.target.value as TrustLevel })}><option value="official">Official</option><option value="verified">Verified</option><option value="reference">Reference</option></select></label>
            <label><span>Tối đa / lượt</span><input type="number" min={1} max={100} value={settingsDraft.autoPublishMaxPerRun} onChange={(event) => setSettingsDraft({ ...settingsDraft, autoPublishMaxPerRun: Number(event.target.value) })} /></label>
            <label className={styles.checkRow}><input type="checkbox" checked={settingsDraft.requireAttribution} onChange={(event) => setSettingsDraft({ ...settingsDraft, requireAttribution: event.target.checked })} /><span>Bắt buộc ghi nguồn</span></label>
            <label className={styles.checkRow}><input type="checkbox" checked={settingsDraft.requireSourcePublishedAt} onChange={(event) => setSettingsDraft({ ...settingsDraft, requireSourcePublishedAt: event.target.checked })} /><span>Bắt buộc có ngày nguồn</span></label>
          </div>
          <button
            type="button"
            className={styles.saveSettings}
            disabled={busy !== null}
            onClick={() => void runAction(
              "save-settings",
              async () => { await post("/api/admin/news/settings", { action: "update-settings", settings: settingsDraft }); },
              "Đã lưu cài đặt Newsroom.",
            )}
          >Lưu cài đặt chung</button>

          <div className={styles.sourceSettings}>
            {overview.sources.map((source) => (
              <div key={source.id} className={styles.sourceSettingRow}>
                <div><strong>{source.name}</strong><span>{source.isActive ? "Đang hoạt động" : "Đang tắt"}</span></div>
                <select
                  aria-label={`Chế độ xuất bản ${source.name}`}
                  value={source.publicationMode}
                  onChange={(event) => {
                    const mode = event.target.value as PublicationMode;
                    void runAction(
                      `source-mode-${source.id}`,
                      async () => { await post("/api/admin/news/settings", { action: "update-source", sourceId: source.id, publicationMode: mode, isActive: source.isActive }); },
                      `Đã đổi chế độ ${source.name} sang ${mode}.`,
                    );
                  }}
                >
                  <option value="inherit">Theo cài đặt chung</option>
                  <option value="manual">Luôn duyệt thủ công</option>
                  <option value="auto">Cho phép tự đăng</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
