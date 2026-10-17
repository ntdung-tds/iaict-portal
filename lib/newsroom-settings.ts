import type { D1DatabaseLike } from "./cloudflare-db";
import type { NewsroomActor } from "./newsroom-auth";
import type { NewsPublicationMode, NewsTrustLevel, NewsWorkflowSettings } from "./news-workflow";

export type NewsroomSourceSummary = {
  id: string;
  name: string;
  homepageUrl: string;
  entryUrl: string;
  fetchStrategy: string;
  trustLevel: NewsTrustLevel;
  publicationMode: NewsPublicationMode;
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

export type NewsroomCategory = { id: string; name: string; slug: string };
export type NewsroomQueueCounts = Record<"pending" | "editing" | "approved" | "rejected" | "published", number>;
export type NewsroomSchedulerRun = {
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

function nowIso() {
  return new Date().toISOString();
}

export async function getNewsroomOverview(db: D1DatabaseLike) {
  const settingsRow = await db.prepare(`
    SELECT auto_publish_enabled, auto_publish_min_trust, auto_publish_max_per_run,
      require_attribution, require_source_published_at
    FROM news_workflow_settings WHERE id='default' LIMIT 1
  `).first<{
    auto_publish_enabled: number;
    auto_publish_min_trust: NewsTrustLevel;
    auto_publish_max_per_run: number;
    require_attribution: number;
    require_source_published_at: number;
  }>();

  const settings: NewsWorkflowSettings = {
    autoPublishEnabled: settingsRow?.auto_publish_enabled === 1,
    autoPublishMinTrust: settingsRow?.auto_publish_min_trust ?? "official",
    autoPublishMaxPerRun: settingsRow?.auto_publish_max_per_run ?? 10,
    requireAttribution: settingsRow?.require_attribution !== 0,
    requireSourcePublishedAt: settingsRow?.require_source_published_at === 1,
  };

  const { results: sourceRows } = await db.prepare(`
    SELECT id, name, homepage_url, entry_url, fetch_strategy, trust_level,
      publication_mode, is_active, attribution_mode, default_category_id,
      last_fetched_at, last_success_at, last_error,
      schedule_enabled, schedule_interval_minutes, schedule_retry_minutes,
      next_scheduled_at, last_scheduled_at
    FROM news_sources
    ORDER BY name ASC
  `).all<{
    id: string;
    name: string;
    homepage_url: string;
    entry_url: string;
    fetch_strategy: string;
    trust_level: NewsTrustLevel;
    publication_mode: NewsPublicationMode;
    is_active: number;
    attribution_mode: string;
    default_category_id: string | null;
    last_fetched_at: string | null;
    last_success_at: string | null;
    last_error: string | null;
    schedule_enabled: number;
    schedule_interval_minutes: number;
    schedule_retry_minutes: number;
    next_scheduled_at: string | null;
    last_scheduled_at: string | null;
  }>();

  const sources: NewsroomSourceSummary[] = sourceRows.map((row) => ({
    id: row.id,
    name: row.name,
    homepageUrl: row.homepage_url,
    entryUrl: row.entry_url,
    fetchStrategy: row.fetch_strategy,
    trustLevel: row.trust_level,
    publicationMode: row.publication_mode,
    isActive: row.is_active === 1,
    attributionMode: row.attribution_mode,
    defaultCategoryId: row.default_category_id,
    lastFetchedAt: row.last_fetched_at,
    lastSuccessAt: row.last_success_at,
    lastError: row.last_error,
    scheduleEnabled: row.schedule_enabled === 1,
    scheduleIntervalMinutes: row.schedule_interval_minutes,
    scheduleRetryMinutes: row.schedule_retry_minutes,
    nextScheduledAt: row.next_scheduled_at,
    lastScheduledAt: row.last_scheduled_at,
  }));

  const { results: categoryRows } = await db.prepare(`
    SELECT id, name, slug FROM article_categories ORDER BY sort_order ASC, name ASC
  `).all<NewsroomCategory>();

  const { results: countRows } = await db.prepare(`
    SELECT workflow_status AS status, COUNT(*) AS total
    FROM news_review_queue
    GROUP BY workflow_status
  `).all<{ status: keyof NewsroomQueueCounts; total: number }>();

  const queueCounts: NewsroomQueueCounts = {
    pending: 0,
    editing: 0,
    approved: 0,
    rejected: 0,
    published: 0,
  };
  for (const row of countRows) {
    if (row.status in queueCounts) queueCounts[row.status] = Number(row.total) || 0;
  }

  const { results: schedulerRuns } = await db.prepare(`
    SELECT id, scheduled_key, cron_expression, status, due_count, claimed_count,
      succeeded_count, failed_count, skipped_count, started_at, finished_at
    FROM news_scheduler_runs
    ORDER BY started_at DESC
    LIMIT 10
  `).all<NewsroomSchedulerRun>();

  return { settings, sources, categories: categoryRows, queueCounts, schedulerRuns };
}

export function validateNewsroomSettings(input: Partial<NewsWorkflowSettings>): NewsWorkflowSettings {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_NEWSROOM_SETTINGS");
  const fields = ["autoPublishEnabled", "autoPublishMinTrust", "autoPublishMaxPerRun", "requireAttribution", "requireSourcePublishedAt"];
  if (Object.keys(input).some(key=>!fields.includes(key))) throw new Error("INVALID_NEWSROOM_SETTINGS");
  for (const field of ["autoPublishEnabled", "requireAttribution", "requireSourcePublishedAt"] as const) {
    if (input[field] !== undefined && typeof input[field] !== "boolean") throw new Error("INVALID_NEWSROOM_BOOLEAN");
  }
  if (input.autoPublishMinTrust !== undefined && typeof input.autoPublishMinTrust !== "string") throw new Error("INVALID_AUTO_PUBLISH_TRUST_LEVEL");
  if (input.autoPublishMaxPerRun !== undefined && typeof input.autoPublishMaxPerRun !== "number") throw new Error("INVALID_AUTO_PUBLISH_CAP");
  const trust = input.autoPublishMinTrust ?? "official";
  if (!["official", "verified", "reference"].includes(trust)) {
    throw new Error("INVALID_AUTO_PUBLISH_TRUST_LEVEL");
  }
  const cap = input.autoPublishMaxPerRun ?? 10;
  if (!Number.isInteger(cap) || cap < 1 || cap > 100) {
    throw new Error("INVALID_AUTO_PUBLISH_CAP");
  }
  return {
    autoPublishEnabled: Boolean(input.autoPublishEnabled),
    autoPublishMinTrust: trust,
    autoPublishMaxPerRun: cap,
    requireAttribution: input.requireAttribution !== false,
    requireSourcePublishedAt: Boolean(input.requireSourcePublishedAt),
  };
}

export function validateNewsSourceSchedule(input: {
  scheduleEnabled?: boolean;
  scheduleIntervalMinutes?: number;
  scheduleRetryMinutes?: number;
}) {
  const interval = input.scheduleIntervalMinutes;
  if (interval !== undefined && (!Number.isInteger(interval) || interval < 15 || interval > 1440)) {
    throw new Error("INVALID_SOURCE_SCHEDULE_INTERVAL");
  }
  const retry = input.scheduleRetryMinutes;
  if (retry !== undefined && (!Number.isInteger(retry) || retry < 15 || retry > 360)) {
    throw new Error("INVALID_SOURCE_SCHEDULE_RETRY");
  }
  return {
    scheduleEnabled: input.scheduleEnabled,
    scheduleIntervalMinutes: interval,
    scheduleRetryMinutes: retry,
  };
}

export async function updateNewsroomSettings(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  input: Partial<NewsWorkflowSettings>,
) {
  validateNewsroomSettings(input);
  const current = await db.prepare(`SELECT auto_publish_enabled, auto_publish_min_trust, auto_publish_max_per_run,
    require_attribution, require_source_published_at FROM news_workflow_settings WHERE id='default'`).first<{
      auto_publish_enabled:number;auto_publish_min_trust:NewsTrustLevel;auto_publish_max_per_run:number;require_attribution:number;require_source_published_at:number;
    }>();
  if (!current) throw new Error("NEWSROOM_SETTINGS_NOT_FOUND");
  const provided=Object.fromEntries(Object.entries(input).filter(([,value])=>value!==undefined));
  const settings = validateNewsroomSettings({
    autoPublishEnabled:current.auto_publish_enabled===1,autoPublishMinTrust:current.auto_publish_min_trust,
    autoPublishMaxPerRun:current.auto_publish_max_per_run,requireAttribution:current.require_attribution===1,
    requireSourcePublishedAt:current.require_source_published_at===1,...provided,
  });
  const timestamp = nowIso();
  await db.batch([
    db.prepare(`
      UPDATE news_workflow_settings
      SET auto_publish_enabled=?, auto_publish_min_trust=?, auto_publish_max_per_run=?,
          require_attribution=?, require_source_published_at=?, updated_by=?, updated_at=?
      WHERE id='default'
    `).bind(
      settings.autoPublishEnabled ? 1 : 0,
      settings.autoPublishMinTrust,
      settings.autoPublishMaxPerRun,
      settings.requireAttribution ? 1 : 0,
      settings.requireSourcePublishedAt ? 1 : 0,
      actor.id,
      timestamp,
    ),
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      VALUES (?, ?, 'news.settings.update', 'news_workflow_settings', 'default', ?, ?)
    `).bind(crypto.randomUUID(), actor.id, JSON.stringify(settings), timestamp),
  ]);
  return settings;
}

export async function updateNewsSourceSettings(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  input: {
    sourceId: string;
    publicationMode: NewsPublicationMode;
    isActive?: boolean;
    scheduleEnabled?: boolean;
    scheduleIntervalMinutes?: number;
    scheduleRetryMinutes?: number;
  },
) {
  if (!["inherit", "manual", "auto"].includes(input.publicationMode)) {
    throw new Error("INVALID_SOURCE_PUBLICATION_MODE");
  }
  const existing = await db.prepare("SELECT id FROM news_sources WHERE id=?").bind(input.sourceId).first<{id:string}>();
  if (!existing) throw new Error("INVALID_SOURCE_NOT_FOUND");
  const schedule = validateNewsSourceSchedule(input);
  const timestamp = nowIso();
  const activeValue = input.isActive === undefined ? null : input.isActive ? 1 : 0;
  const scheduleEnabledValue = schedule.scheduleEnabled === undefined
    ? null
    : schedule.scheduleEnabled ? 1 : 0;

  await db.batch([
    db.prepare(`
      UPDATE news_sources
      SET publication_mode=?,
          is_active=COALESCE(?, is_active),
          schedule_enabled=COALESCE(?, schedule_enabled),
          schedule_interval_minutes=COALESCE(?, schedule_interval_minutes),
          schedule_retry_minutes=COALESCE(?, schedule_retry_minutes),
          next_scheduled_at=CASE
            WHEN COALESCE(?, schedule_enabled)=1 AND next_scheduled_at IS NULL THEN ?
            ELSE next_scheduled_at
          END,
          updated_at=?
      WHERE id=?
    `).bind(
      input.publicationMode,
      activeValue,
      scheduleEnabledValue,
      schedule.scheduleIntervalMinutes ?? null,
      schedule.scheduleRetryMinutes ?? null,
      scheduleEnabledValue,
      timestamp,
      timestamp,
      input.sourceId,
    ),
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      VALUES (?, ?, 'news.source.settings.update', 'news_sources', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      actor.id,
      input.sourceId,
      JSON.stringify({
        publicationMode: input.publicationMode,
        isActive: input.isActive ?? null,
        scheduleEnabled: schedule.scheduleEnabled ?? null,
        scheduleIntervalMinutes: schedule.scheduleIntervalMinutes ?? null,
        scheduleRetryMinutes: schedule.scheduleRetryMinutes ?? null,
      }),
      timestamp,
    ),
  ]);
}
