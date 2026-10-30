import type { D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import {
  DEFAULT_NEWS_WORKFLOW_SETTINGS,
  buildNewsReviewDraft,
  canTransitionNewsReviewStatus,
  resolveNewsPublicationDecision,
  type NewsPublicationMode,
  type NewsReviewStatus,
  type NewsSourceDefinition,
  type NewsTrustLevel,
  type NewsWorkflowSettings,
} from "./news-workflow";
import { fetchNewsSourceCandidates } from "./news-source-adapters";
import type { NewsroomActor } from "./newsroom-auth";

type NewsSourceRow = {
  id: string;
  name: string;
  homepage_url: string;
  entry_url: string;
  fetch_strategy: "html_discovery" | "rss" | "api" | "manual";
  trust_level: NewsTrustLevel;
  publication_mode: NewsPublicationMode;
  attribution_mode: "source_link" | "source_name_and_link" | "custom";
  attribution_text: string | null;
  default_category_id: string | null;
  is_active: number;
};

type SettingsRow = {
  auto_publish_enabled: number;
  auto_publish_min_trust: NewsTrustLevel;
  auto_publish_max_per_run: number;
  require_attribution: number;
  require_source_published_at: number;
};

type DuplicateRow = { id: string };

type ReviewPublicationRow = {
  queue_id: string;
  ingest_item_id: string;
  workflow_status: NewsReviewStatus;
  updated_at: string;
  suggested_title: string;
  suggested_excerpt: string | null;
  suggested_category_id: string | null;
  edited_title: string | null;
  edited_excerpt: string | null;
  source_id: string;
  source_name: string;
  source_url: string;
  canonical_url: string;
  source_published_at: string | null;
  fetched_at: string;
  attribution_text: string | null;
  attribution_mode: string;
  default_category_id: string | null;
};

export type ReviewQueueItem = ReviewPublicationRow & {
  approval_mode: "manual" | "auto";
  editor_notes: string | null;
  assigned_to: string | null;
  reviewed_by: string | null;
  review_reason: string | null;
  queued_at: string;
  updated_at: string;
  reviewed_at: string | null;
  published_at: string | null;
  article_id: string | null;
};

export type IngestSummary = {
  runId: string;
  sourceId: string;
  fetched: number;
  created: number;
  duplicates: number;
  queued: number;
  autoPublished: number;
  errors: number;
};

function nowIso() {
  return new Date().toISOString();
}

function nextReviewUpdatedAt(previous: string): string {
  const last = Date.parse(previous);
  return new Date(Number.isFinite(last) ? Math.max(Date.now(), last + 1) : Date.now()).toISOString();
}

function assertReviewUpdatedAt(expected: string, current: string) {
  if (!expected || expected !== current) throw new Error("NEWS_REVIEW_VERSION_CONFLICT");
}

function assertReviewBatchChanged(results: Awaited<ReturnType<D1DatabaseLike["batch"]>>) {
  if (results[0]?.meta?.changes === 0) throw new Error("NEWS_REVIEW_VERSION_CONFLICT");
}


function sourceRowToDefinition(row: NewsSourceRow): NewsSourceDefinition {
  return {
    id: row.id,
    name: row.name,
    homepageUrl: row.homepage_url,
    entryUrl: row.entry_url,
    fetchStrategy: row.fetch_strategy,
    trustLevel: row.trust_level,
    publicationMode: row.publication_mode,
    requiresEditorialWorkflow: true,
    attributionMode: row.attribution_mode,
    attributionText: row.attribution_text ?? undefined,
    enabledByDefault: row.is_active === 1,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugifyVietnamese(value: string) {
  const ascii = value
    .replace(/[đĐ]/g, (letter) => (letter === "đ" ? "d" : "D"))
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return ascii || "tin-tuc";
}

function buildExternalArticleBody(row: ReviewPublicationRow, excerpt: string | null) {
  const sourceLabel = row.attribution_text?.trim() || `Nguồn: ${row.source_name}`;
  const safeUrl = escapeHtml(row.canonical_url);
  const intro = excerpt?.trim()
    ? `<p>${escapeHtml(excerpt.trim())}</p>`
    : "<p>Bản tin được tổng hợp từ nguồn thông tin chính thức. Vui lòng xem bài gốc để đọc đầy đủ nội dung.</p>";

  return `${intro}<p><strong>${escapeHtml(sourceLabel)}</strong> · <a href="${safeUrl}" rel="noopener noreferrer">Xem nội dung gốc</a></p>`;
}

export async function getNewsSource(db: D1DatabaseLike, sourceId: string) {
  return db
    .prepare(`
      SELECT id, name, homepage_url, entry_url, fetch_strategy, trust_level,
        publication_mode, attribution_mode, attribution_text,
        default_category_id, is_active
      FROM news_sources
      WHERE id = ?
      LIMIT 1
    `)
    .bind(sourceId)
    .first<NewsSourceRow>();
}

export async function getNewsWorkflowSettings(db: D1DatabaseLike): Promise<NewsWorkflowSettings> {
  const row = await db
    .prepare(`
      SELECT auto_publish_enabled, auto_publish_min_trust, auto_publish_max_per_run,
        require_attribution, require_source_published_at
      FROM news_workflow_settings
      WHERE id = 'default'
      LIMIT 1
    `)
    .first<SettingsRow>();

  if (!row) return DEFAULT_NEWS_WORKFLOW_SETTINGS;
  return {
    autoPublishEnabled: row.auto_publish_enabled === 1,
    autoPublishMinTrust: row.auto_publish_min_trust,
    autoPublishMaxPerRun: row.auto_publish_max_per_run,
    requireAttribution: row.require_attribution === 1,
    requireSourcePublishedAt: row.require_source_published_at === 1,
  };
}

export async function countReviewQueue(db:D1DatabaseLike,status:NewsReviewStatus):Promise<number>{
  const row=await db.prepare(`SELECT COUNT(*) AS total FROM news_review_queue q
    JOIN news_ingest_items i ON i.id=q.ingest_item_id
    JOIN news_sources s ON s.id=i.source_id WHERE q.workflow_status=?`).bind(status).first<{total:number}>();
  return row?.total??0;
}

export async function listReviewQueue(
  db: D1DatabaseLike,
  input: { status?: NewsReviewStatus; limit?: number; offset?: number } = {},
): Promise<ReviewQueueItem[]> {
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);
  const status = input.status ?? "pending";
  const offset = Math.max(0, Math.floor(input.offset ?? 0));
  const { results } = await db
    .prepare(`
      SELECT
        q.id AS queue_id,
        q.ingest_item_id,
        q.workflow_status,
        q.suggested_title,
        q.suggested_excerpt,
        q.suggested_category_id,
        q.edited_title,
        q.edited_excerpt,
        q.approval_mode,
        q.editor_notes,
        q.assigned_to,
        q.reviewed_by,
        q.review_reason,
        q.queued_at,
        q.updated_at,
        q.reviewed_at,
        q.published_at,
        q.article_id,
        i.source_id,
        i.source_url,
        i.canonical_url,
        i.source_published_at,
        i.fetched_at,
        s.name AS source_name,
        s.attribution_text,
        s.attribution_mode,
        s.default_category_id
      FROM news_review_queue q
      JOIN news_ingest_items i ON i.id = q.ingest_item_id
      JOIN news_sources s ON s.id = i.source_id
      WHERE q.workflow_status = ?
      ORDER BY q.queued_at DESC, q.id DESC
      LIMIT ? OFFSET ?
    `)
    .bind(status, limit, offset)
    .all<ReviewQueueItem>();
  return results;
}

async function getReviewPublicationRow(db: D1DatabaseLike, queueId: string) {
  return db
    .prepare(`
      SELECT
        q.id AS queue_id,
        q.ingest_item_id,
        q.workflow_status,
        q.updated_at,
        q.suggested_title,
        q.suggested_excerpt,
        q.suggested_category_id,
        q.edited_title,
        q.edited_excerpt,
        i.source_id,
        i.source_url,
        i.canonical_url,
        i.source_published_at,
        i.fetched_at,
        s.name AS source_name,
        s.attribution_text,
        s.attribution_mode,
        s.default_category_id
      FROM news_review_queue q
      JOIN news_ingest_items i ON i.id = q.ingest_item_id
      JOIN news_sources s ON s.id = i.source_id
      WHERE q.id = ?
      LIMIT 1
    `)
    .bind(queueId)
    .first<ReviewPublicationRow>();
}

async function createAudit(
  db: D1DatabaseLike,
  input: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await db
    .prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      crypto.randomUUID(),
      input.actorId,
      input.action,
      input.entityType,
      input.entityId,
      JSON.stringify(input.metadata ?? {}),
      nowIso(),
    )
    .run();
}

export async function updateReviewDraft(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  input: {
    queueId: string;
    expectedUpdatedAt: string;
    title?: string;
    excerpt?: string | null;
    categoryId?: string | null;
    notes?: string | null;
  },
) {
  const current = await getReviewPublicationRow(db, input.queueId);
  if (!current) throw new Error("REVIEW_ITEM_NOT_FOUND");
  assertReviewUpdatedAt(input.expectedUpdatedAt, current.updated_at);
  if (!["pending", "editing", "approved"].includes(current.workflow_status)) {
    throw new Error("REVIEW_ITEM_NOT_EDITABLE");
  }

  const title = input.title?.trim();
  if (title !== undefined && title.length < 8) throw new Error("REVIEW_TITLE_TOO_SHORT");
  if(input.categoryId){const category=await db.prepare("SELECT id FROM article_categories WHERE id=?").bind(input.categoryId).first();if(!category)throw new Error("INVALID_REVIEW_CATEGORY");}
  const nextStatus: NewsReviewStatus = "editing";
  if (current.workflow_status !== nextStatus && !canTransitionNewsReviewStatus(current.workflow_status, nextStatus)) {
    throw new Error("INVALID_REVIEW_TRANSITION");
  }

  const timestamp = nextReviewUpdatedAt(current.updated_at);
  const outcomes = await db.batch([
    db.prepare(`
      UPDATE news_review_queue
      SET edited_title = COALESCE(?, edited_title),
          edited_excerpt = ?,
          suggested_category_id = CASE WHEN ?=1 THEN ? ELSE suggested_category_id END,
          editor_notes = CASE WHEN ?=1 THEN ? ELSE editor_notes END,
          assigned_to = COALESCE(assigned_to, ?),
          workflow_status = CASE
            WHEN workflow_status IN ('pending','editing','approved') AND updated_at = ? THEN 'editing'
            ELSE NULL
          END,
          updated_at = ?,
          reviewed_at = NULL,
          reviewed_by = NULL,
          review_reason = NULL,
          approval_mode = 'manual',
          policy_snapshot_json = '{}',
          auto_publish_reason = NULL
      WHERE id = ?
    `).bind(
      title ?? null,
      input.excerpt === undefined ? current.edited_excerpt : input.excerpt ?? "",
      input.categoryId === undefined ? 0 : 1,
      input.categoryId ?? null,
      input.notes === undefined ? 0 : 1,
      input.notes ?? null,
      actor.id,
      input.expectedUpdatedAt,
      timestamp,
      input.queueId,
    ),
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      SELECT ?, ?, 'news.review.edit', 'news_review_queue', ?, ?, ?
      FROM news_review_queue WHERE id = ? AND updated_at = ? AND workflow_status = 'editing'
    `).bind(
      crypto.randomUUID(),
      actor.id,
      input.queueId,
      JSON.stringify({ categoryId: input.categoryId ?? null }),
      timestamp,
      input.queueId,
      timestamp,
    ),
  ]);
  assertReviewBatchChanged(outcomes);
}

export async function setReviewDecision(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  input: { queueId: string; expectedUpdatedAt: string; decision: "approved" | "rejected"; reason?: string | null },
) {
  const current = await getReviewPublicationRow(db, input.queueId);
  if (!current) throw new Error("REVIEW_ITEM_NOT_FOUND");
  assertReviewUpdatedAt(input.expectedUpdatedAt, current.updated_at);
  if (!canTransitionNewsReviewStatus(current.workflow_status, input.decision)) {
    throw new Error("INVALID_REVIEW_TRANSITION");
  }

  const timestamp = nextReviewUpdatedAt(current.updated_at);
  const outcomes = await db.batch([
    db.prepare(`
      UPDATE news_review_queue
      SET workflow_status = CASE WHEN workflow_status = ? AND updated_at = ? THEN ? ELSE NULL END,
          approval_mode = 'manual', reviewed_by = ?,
          review_reason = ?, reviewed_at = ?, updated_at = ?,
          policy_snapshot_json = '{}', auto_publish_reason = NULL
      WHERE id = ?
    `).bind(
      current.workflow_status,
      input.expectedUpdatedAt,
      input.decision,
      actor.id,
      input.reason ?? null,
      timestamp,
      timestamp,
      input.queueId,
    ),
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      SELECT ?, ?, ?, 'news_review_queue', ?, ?, ?
      FROM news_review_queue WHERE id = ? AND updated_at = ? AND workflow_status = ?
    `).bind(
      crypto.randomUUID(),
      actor.id,
      `news.review.${input.decision}`,
      input.queueId,
      JSON.stringify({ from: current.workflow_status, reason: input.reason ?? null }),
      timestamp,
      input.queueId,
      timestamp,
      input.decision,
    ),
  ]);
  assertReviewBatchChanged(outcomes);
}

async function publishReviewRow(
  db: D1DatabaseLike,
  row: ReviewPublicationRow,
  input: {
    mode: "manual" | "auto";
    actorId: string | null;
    expectedUpdatedAt?: string;
    policySnapshot?: Record<string, unknown>;
    autoReason?: string | null;
    autoGuard?: {
      settings: NewsWorkflowSettings;
      source: NewsSourceRow;
      ordinal: number;
    };
  },
) {
  const expectedStatus: NewsReviewStatus = input.mode === "auto" ? "pending" : "approved";
  if (row.workflow_status !== expectedStatus) throw new Error("NEWS_PUBLICATION_STATE_CONFLICT");
  if (input.mode === "manual") assertReviewUpdatedAt(input.expectedUpdatedAt ?? "", row.updated_at);

  const categoryId = row.suggested_category_id ?? row.default_category_id;
  if (!categoryId) throw new Error("NEWS_PUBLICATION_CATEGORY_REQUIRED");

  const title = (row.edited_title ?? row.suggested_title).trim();
  if (title.length < 8) throw new Error("NEWS_PUBLICATION_TITLE_INVALID");

  const excerpt = row.edited_excerpt ?? row.suggested_excerpt;
  const timestamp = nowIso();
  const articleId = crypto.randomUUID();
  const claimId = crypto.randomUUID();
  const slug = `${slugifyVietnamese(title)}-${articleId.slice(0, 8)}`;
  const body = buildExternalArticleBody(row, excerpt);
  const policyJson = JSON.stringify(input.policySnapshot ?? {});
  const auditMetadata = JSON.stringify({
    mode: input.mode,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    policy: input.policySnapshot ?? null,
  });

  // A manual publisher must claim the exact review revision they saw.
  // NULL on a stale revision violates queue_id NOT NULL inside the same D1 batch,
  // aborting article, provenance and audit writes together.
  if (input.mode === "auto" && !input.autoGuard) {
    throw new Error("NEWS_AUTO_PUBLISH_GUARD_REQUIRED");
  }
  const claim = input.mode === "manual"
    ? db.prepare(`
        INSERT INTO news_publication_claims (id, queue_id, expected_status, approval_mode, created_at)
        VALUES (?, CASE WHEN EXISTS (
          SELECT 1 FROM news_review_queue
          WHERE id=? AND updated_at=? AND workflow_status='approved' AND article_id IS NULL
        ) THEN ? ELSE NULL END, ?, ?, ?)
      `).bind(claimId, row.queue_id, input.expectedUpdatedAt!, row.queue_id, expectedStatus, input.mode, timestamp)
    : db.prepare(`
        INSERT INTO news_publication_claims (id, queue_id, expected_status, approval_mode, created_at)
        VALUES (?, CASE WHEN EXISTS (
          SELECT 1 FROM news_workflow_settings w
          JOIN news_sources s ON s.id=?
          WHERE w.id='default' AND w.auto_publish_enabled=1
            AND w.auto_publish_min_trust=?
            AND w.auto_publish_max_per_run=?
            AND w.auto_publish_max_per_run>=?
            AND w.require_attribution=?
            AND w.require_source_published_at=?
            AND s.is_active=1 AND s.publication_mode IN ('inherit', 'auto')
            AND s.publication_mode=? AND s.trust_level=?
            AND s.default_category_id=?
            AND s.attribution_mode=?
            AND COALESCE(s.attribution_text,'')=COALESCE(?,'')
        ) THEN ? ELSE NULL END, ?, ?, ?)
      `).bind(
        claimId,
        row.source_id,
        input.autoGuard!.settings.autoPublishMinTrust,
        input.autoGuard!.settings.autoPublishMaxPerRun,
        input.autoGuard!.ordinal,
        input.autoGuard!.settings.requireAttribution ? 1 : 0,
        input.autoGuard!.settings.requireSourcePublishedAt ? 1 : 0,
        input.autoGuard!.source.publication_mode,
        input.autoGuard!.source.trust_level,
        input.autoGuard!.source.default_category_id,
        input.autoGuard!.source.attribution_mode,
        input.autoGuard!.source.attribution_text,
        row.queue_id, expectedStatus, input.mode, timestamp,
      );
  const statements: D1PreparedStatementLike[] = [claim];

  if (input.mode === "auto") {
    statements.push(
      db.prepare(`
        UPDATE news_review_queue
        SET workflow_status = 'approved', approval_mode = 'auto', reviewed_by = NULL,
            reviewed_at = ?, updated_at = ?, policy_snapshot_json = ?, auto_publish_reason = ?
        WHERE id = ? AND workflow_status = 'pending' AND article_id IS NULL
      `).bind(
        timestamp,
        timestamp,
        policyJson,
        input.autoReason ?? "policy-eligible",
        row.queue_id,
      ),
    );
  }

  statements.push(
    db.prepare(`
      INSERT INTO articles (
        id, title, slug, category_id, status, body, excerpt, tags_json,
        author_user_id, hero_media_id, published_at, attachments_json, seo_json,
        featured, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'published', ?, ?, '[]', ?, NULL, ?, '[]', ?, 0, ?, ?)
    `).bind(
      articleId,
      title,
      slug,
      categoryId,
      body,
      excerpt,
      input.actorId,
      timestamp,
      JSON.stringify({ externalSource: row.source_name, canonicalSourceUrl: row.canonical_url }),
      timestamp,
      timestamp,
    ),
    db.prepare(`
      INSERT INTO article_provenance (
        article_id, ingest_item_id, source_id, source_name, source_url,
        canonical_url, source_published_at, fetched_at, attribution_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      articleId,
      row.ingest_item_id,
      row.source_id,
      row.source_name,
      row.source_url,
      row.canonical_url,
      row.source_published_at,
      row.fetched_at,
      row.attribution_text ?? `Nguồn: ${row.source_name}`,
      timestamp,
    ),
    db.prepare(`
      UPDATE news_review_queue
      SET workflow_status = 'published', article_id = ?, published_at = ?, updated_at = ?,
          approval_mode = ?, reviewed_by = COALESCE(reviewed_by, ?),
          policy_snapshot_json = CASE WHEN ? = 'auto' THEN ? ELSE policy_snapshot_json END
      WHERE id = ? AND workflow_status = 'approved' AND article_id IS NULL
    `).bind(
      articleId,
      timestamp,
      timestamp,
      input.mode,
      input.actorId,
      input.mode,
      policyJson,
      row.queue_id,
    ),
    db.prepare(`
      UPDATE news_ingest_items
      SET ingest_status = 'imported', updated_at = ?
      WHERE id = ?
    `).bind(timestamp, row.ingest_item_id),
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      VALUES (?, ?, ?, 'articles', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      input.actorId,
      input.mode === "auto" ? "news.publish.auto" : "news.publish.manual",
      articleId,
      auditMetadata,
      timestamp,
    ),
    db.prepare("DELETE FROM news_publication_claims WHERE id = ?").bind(claimId),
  );

  await db.batch(statements);
  return { articleId, slug };
}

export async function publishApprovedReviewItem(
  db: D1DatabaseLike,
  actor: NewsroomActor,
  queueId: string,
  expectedUpdatedAt: string,
) {
  const row = await getReviewPublicationRow(db, queueId);
  if (!row) throw new Error("REVIEW_ITEM_NOT_FOUND");
  return publishReviewRow(db, row, { mode: "manual", actorId: actor.id, expectedUpdatedAt });
}

async function findExistingDuplicate(db: D1DatabaseLike, canonicalUrl: string, normalizedTitle: string) {
  return db
    .prepare(`
      SELECT id
      FROM news_ingest_items
      WHERE canonical_url = ? OR normalized_title = ?
      ORDER BY created_at ASC
      LIMIT 1
    `)
    .bind(canonicalUrl, normalizedTitle)
    .first<DuplicateRow>();
}

async function markIngestFailure(db: D1DatabaseLike, runId: string, sourceId: string, message: string) {
  const timestamp = nowIso();
  await db.batch([
    db.prepare(`
      UPDATE news_ingest_runs
      SET status = 'failed', finished_at = ?, error_count = error_count + 1, error_summary = ?
      WHERE id = ?
    `).bind(timestamp, message.slice(0, 1000), runId),
    db.prepare(`
      UPDATE news_sources
      SET last_fetched_at = ?, last_error = ?, updated_at = ?
      WHERE id = ?
    `).bind(timestamp, message.slice(0, 1000), timestamp, sourceId),
  ]);
}

export async function ingestNewsSource(
  db: D1DatabaseLike,
  sourceId: string,
  options: { actorId?: string | null; fetchImpl?: typeof fetch } = {},
): Promise<IngestSummary> {
  const sourceRow = await getNewsSource(db, sourceId);
  if (!sourceRow || sourceRow.is_active !== 1) throw new Error("NEWS_SOURCE_NOT_ACTIVE");

  const source = sourceRowToDefinition(sourceRow);
  const settings = await getNewsWorkflowSettings(db);
  const runId = crypto.randomUUID();
  const startedAt = nowIso();

  await db
    .prepare(`
      INSERT INTO news_ingest_runs (id, source_id, status, started_at, metadata_json)
      VALUES (?, ?, 'running', ?, ?)
    `)
    .bind(runId, sourceId, startedAt, JSON.stringify({ trigger: options.actorId ? "manual" : "system" }))
    .run();

  let fetchResult;
  try {
    fetchResult = await fetchNewsSourceCandidates(source, options.fetchImpl ?? fetch);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markIngestFailure(db, runId, sourceId, message);
    throw error;
  }

  let created = 0;
  let duplicates = 0;
  let queued = 0;
  let autoPublished = 0;
  let errors = 0;

  for (const candidate of fetchResult.candidates) {
    try {
      const draft = buildNewsReviewDraft(candidate);
      const duplicate = await findExistingDuplicate(db, draft.canonicalUrl, draft.normalizedTitle);
      const itemId = crypto.randomUUID();
      const timestamp = nowIso();

      if (duplicate) {
        await db
          .prepare(`
            INSERT OR IGNORE INTO news_ingest_items (
              id, source_id, ingest_run_id, canonical_url, source_url, title_raw,
              normalized_title, summary_raw, source_published_at, fetched_at,
              dedupe_key, ingest_status, duplicate_of_item_id, metadata_json,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'duplicate', ?, '{}', ?, ?)
          `)
          .bind(
            itemId,
            sourceId,
            runId,
            draft.canonicalUrl,
            candidate.sourceUrl,
            candidate.title,
            draft.normalizedTitle,
            candidate.excerpt ?? null,
            candidate.sourcePublishedAt ?? null,
            fetchResult.fetchedAt,
            draft.dedupeKey,
            duplicate.id,
            timestamp,
            timestamp,
          )
          .run();
        duplicates += 1;
        continue;
      }

      const queueId = crypto.randomUUID();
      await db.batch([
        db.prepare(`
          INSERT INTO news_ingest_items (
            id, source_id, ingest_run_id, canonical_url, source_url, title_raw,
            normalized_title, summary_raw, source_published_at, fetched_at,
            dedupe_key, ingest_status, metadata_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', '{}', ?, ?)
        `).bind(
          itemId,
          sourceId,
          runId,
          draft.canonicalUrl,
          candidate.sourceUrl,
          candidate.title,
          draft.normalizedTitle,
          candidate.excerpt ?? null,
          candidate.sourcePublishedAt ?? null,
          fetchResult.fetchedAt,
          draft.dedupeKey,
          timestamp,
          timestamp,
        ),
        db.prepare(`
          INSERT INTO news_review_queue (
            id, ingest_item_id, workflow_status, suggested_title, suggested_excerpt,
            suggested_category_id, approval_mode, policy_snapshot_json,
            queued_at, updated_at
          ) VALUES (?, ?, 'pending', ?, ?, ?, 'manual', '{}', ?, ?)
        `).bind(
          queueId,
          itemId,
          draft.suggestedTitle,
          draft.suggestedExcerpt,
          sourceRow.default_category_id,
          timestamp,
          timestamp,
        ),
      ]);
      created += 1;
      queued += 1;

      if (autoPublished < settings.autoPublishMaxPerRun && sourceRow.default_category_id) {
        const decision = resolveNewsPublicationDecision(source, settings, {
          isDuplicate: false,
          hasAttribution: Boolean(sourceRow.attribution_text || sourceRow.attribution_mode),
          hasValidTitle: draft.suggestedTitle.length >= 8,
          hasValidCanonicalUrl: draft.canonicalUrl.startsWith("https://"),
          hasSourcePublishedAt: Boolean(candidate.sourcePublishedAt),
        });

        if (decision.eligible) {
          const row = await getReviewPublicationRow(db, queueId);
          if (row) {
            try {
              // This claim revalidates the policy INSIDE the D1 publication batch.
              // A setting/source change while fetching keeps the candidate in review.
              await publishReviewRow(db, row, {
                mode: "auto",
                actorId: null,
                policySnapshot: {
                  settings,
                  sourceId,
                  publicationMode: source.publicationMode,
                  trustLevel: source.trustLevel,
                },
                autoGuard: { settings, source: sourceRow, ordinal: autoPublished + 1 },
                autoReason: "policy-eligible-after-ingest",
              });
              autoPublished += 1;
              queued -= 1;
            } catch (error) {
              // NULL queue_id fails the guard inside the atomic D1 batch.
              // The item was already saved as a pending manual-review candidate.
              // Do not misclassify a policy revocation as an ingestion failure.
              if (!(error instanceof Error &&
                /NOT NULL constraint failed: news_publication_claims\.queue_id/i.test(error.message))) {
                throw error;
              }
            }
          }
        }
      }
    } catch {
      errors += 1;
    }
  }

  const finishedAt = nowIso();
  const status = errors > 0 ? "partial" : "succeeded";
  await db.batch([
    db.prepare(`
      UPDATE news_ingest_runs
      SET status = ?, finished_at = ?, fetched_count = ?, new_count = ?,
          duplicate_count = ?, queued_count = ?, error_count = ?, metadata_json = ?
      WHERE id = ?
    `).bind(
      status,
      finishedAt,
      fetchResult.candidates.length,
      created,
      duplicates,
      queued,
      errors,
      JSON.stringify({ autoPublished, strategy: fetchResult.strategy, entryUrl: fetchResult.entryUrl }),
      runId,
    ),
    db.prepare(`
      UPDATE news_sources
      SET last_fetched_at = ?, last_success_at = ?, last_error = NULL, updated_at = ?
      WHERE id = ?
    `).bind(finishedAt, finishedAt, finishedAt, sourceId),
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      VALUES (?, ?, 'news.ingest.complete', 'news_ingest_runs', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      options.actorId ?? null,
      runId,
      JSON.stringify({ sourceId, created, duplicates, queued, autoPublished, errors }),
      finishedAt,
    ),
  ]);

  return {
    runId,
    sourceId,
    fetched: fetchResult.candidates.length,
    created,
    duplicates,
    queued,
    autoPublished,
    errors,
  };
}
