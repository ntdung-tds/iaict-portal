import type { D1DatabaseLike } from "./cloudflare-db";
import { ingestNewsSource, type IngestSummary } from "./news-repository";

export type ScheduledNewsSource = {
  id: string;
  name: string;
  schedule_interval_minutes: number;
  schedule_retry_minutes: number;
  next_scheduled_at: string | null;
  last_scheduled_at: string | null;
};

export type NewsSchedulerResult = {
  runId: string;
  scheduledKey: string;
  status: "succeeded" | "partial" | "failed" | "skipped";
  due: number;
  claimed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  sources: Array<{
    sourceId: string;
    status: "succeeded" | "failed" | "skipped";
    summary?: IngestSummary;
    error?: string;
  }>;
};

const LEASE_MINUTES = 10;
const MAX_SOURCES_PER_TICK = 20;

function iso(value: Date | number | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_SCHEDULER_TIME");
  return date.toISOString();
}

export function buildNewsSchedulerKey(cronExpression: string, scheduledTime: number) {
  const date = new Date(scheduledTime);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_SCHEDULED_TIME");
  date.setUTCSeconds(0, 0);
  return `${cronExpression}:${date.toISOString()}`;
}

export function computeNextNewsSchedule(
  from: Date | number | string,
  minutes: number,
) {
  if (!Number.isInteger(minutes) || minutes < 1) throw new Error("INVALID_SCHEDULE_INTERVAL");
  const base = from instanceof Date ? new Date(from) : new Date(from);
  if (Number.isNaN(base.getTime())) throw new Error("INVALID_SCHEDULER_TIME");
  base.setUTCMinutes(base.getUTCMinutes() + minutes);
  return base.toISOString();
}

async function listDueSources(db: D1DatabaseLike, now: string) {
  const { results } = await db.prepare(`
    SELECT id, name, schedule_interval_minutes, schedule_retry_minutes,
      next_scheduled_at, last_scheduled_at
    FROM news_sources
    WHERE is_active=1
      AND schedule_enabled=1
      AND (next_scheduled_at IS NULL OR julianday(next_scheduled_at) <= julianday(?))
    ORDER BY COALESCE(next_scheduled_at, '1970-01-01T00:00:00.000Z') ASC, id ASC
    LIMIT ?
  `).bind(now, MAX_SOURCES_PER_TICK).all<ScheduledNewsSource>();
  return results;
}

async function tryClaimSource(
  db: D1DatabaseLike,
  sourceId: string,
  schedulerRunId: string,
  now: string,
) {
  const token = crypto.randomUUID();
  const leaseUntil = computeNextNewsSchedule(now, LEASE_MINUTES);

  await db.prepare(`
    INSERT INTO news_scheduler_claims (source_id, lease_token, claimed_at, lease_until, scheduler_run_id)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(source_id) DO UPDATE SET
      lease_token=excluded.lease_token,
      claimed_at=excluded.claimed_at,
      lease_until=excluded.lease_until,
      scheduler_run_id=excluded.scheduler_run_id
    WHERE julianday(news_scheduler_claims.lease_until) <= julianday(excluded.claimed_at)
  `).bind(sourceId, token, now, leaseUntil, schedulerRunId).run();

  const claim = await db.prepare(`
    SELECT lease_token FROM news_scheduler_claims WHERE source_id=? LIMIT 1
  `).bind(sourceId).first<{ lease_token: string }>();

  return claim?.lease_token === token ? token : null;
}

async function releaseSourceClaim(db: D1DatabaseLike, sourceId: string, token: string) {
  await db.prepare(`
    DELETE FROM news_scheduler_claims WHERE source_id=? AND lease_token=?
  `).bind(sourceId, token).run();
}

async function setNextSourceRun(
  db: D1DatabaseLike,
  source: ScheduledNewsSource,
  now: string,
  succeeded: boolean,
  leaseToken: string,
) {
  const delay = succeeded
    ? source.schedule_interval_minutes
    : source.schedule_retry_minutes;
  const next = computeNextNewsSchedule(now, delay);
  const result = await db.prepare(`
    UPDATE news_sources
    SET last_scheduled_at=?, next_scheduled_at=?, updated_at=?
    WHERE id=? AND EXISTS (
      SELECT 1 FROM news_scheduler_claims claim
      WHERE claim.source_id=news_sources.id AND claim.lease_token=?
        AND julianday(claim.lease_until) > julianday(?)
    )
  `).bind(now, next, now, source.id, leaseToken, iso()).run();
  // A runner can finish ingestion after another runner takes its expired lease.
  // Such a run must not be reported as successfully scheduled.
  return result.meta?.changes === 1;
}

export async function runScheduledNewsIngestion(
  db: D1DatabaseLike,
  input: { cronExpression: string; scheduledTime: number },
): Promise<NewsSchedulerResult> {
  const scheduledAt = iso(input.scheduledTime);
  const scheduledKey = buildNewsSchedulerKey(input.cronExpression, input.scheduledTime);
  const runId = crypto.randomUUID();
  const startedAt = iso();

  await db.prepare(`
    INSERT OR IGNORE INTO news_scheduler_runs (
      id, scheduled_key, cron_expression, status, started_at, metadata_json
    ) VALUES (?, ?, ?, 'running', ?, ?)
  `).bind(
    runId,
    scheduledKey,
    input.cronExpression,
    startedAt,
    JSON.stringify({ scheduledAt }),
  ).run();

  const owner = await db.prepare(`
    SELECT id, status FROM news_scheduler_runs WHERE scheduled_key=? LIMIT 1
  `).bind(scheduledKey).first<{ id: string; status: string }>();

  if (!owner || owner.id !== runId) {
    return {
      runId: owner?.id ?? runId,
      scheduledKey,
      status: "skipped",
      due: 0,
      claimed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 1,
      sources: [],
    };
  }

  const dueSources = await listDueSources(db, scheduledAt);
  let claimed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const sourceResults: NewsSchedulerResult["sources"] = [];

  for (const source of dueSources) {
    const token = await tryClaimSource(db, source.id, runId, iso());
    if (!token) {
      skipped += 1;
      sourceResults.push({ sourceId: source.id, status: "skipped" });
      continue;
    }

    claimed += 1;
    try {
      const summary = await ingestNewsSource(db, source.id);
      const stillOwnsLease = await setNextSourceRun(db, source, scheduledAt, true, token);
      if (stillOwnsLease) {
        succeeded += 1;
        sourceResults.push({ sourceId: source.id, status: "succeeded", summary });
      } else {
        skipped += 1;
        sourceResults.push({ sourceId: source.id, status: "skipped", summary,
          error: "NEWS_SCHEDULER_LEASE_LOST" });
      }
    } catch (error) {
      const stillOwnsLease = await setNextSourceRun(db, source, scheduledAt, false, token);
      if (stillOwnsLease) {
        failed += 1;
        sourceResults.push({
          sourceId: source.id,
          status: "failed",
          error: (error instanceof Error ? error.message : String(error)).slice(0, 500),
        });
      } else {
        skipped += 1;
        sourceResults.push({ sourceId: source.id, status: "skipped",
          error: "NEWS_SCHEDULER_LEASE_LOST" });
      }
    } finally {
      await releaseSourceClaim(db, source.id, token);
    }
  }

  const finishedAt = iso();
  const status: NewsSchedulerResult["status"] = dueSources.length === 0 || claimed === 0 || (succeeded === 0 && failed === 0)
    ? "skipped"
    : failed === 0
      ? "succeeded"
      : succeeded > 0
        ? "partial"
        : "failed";

  await db.batch([
    db.prepare(`
      UPDATE news_scheduler_runs
      SET status=?, due_count=?, claimed_count=?, succeeded_count=?, failed_count=?,
          skipped_count=?, finished_at=?, metadata_json=?
      WHERE id=? AND status='running'
    `).bind(
      status,
      dueSources.length,
      claimed,
      succeeded,
      failed,
      skipped,
      finishedAt,
      JSON.stringify({ scheduledAt, sources: sourceResults }),
      runId,
    ),
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      VALUES (?, NULL, 'news.scheduler.complete', 'news_scheduler_runs', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      runId,
      JSON.stringify({ scheduledKey, status, due: dueSources.length, claimed, succeeded, failed, skipped }),
      finishedAt,
    ),
  ]);

  return {
    runId,
    scheduledKey,
    status,
    due: dueSources.length,
    claimed,
    succeeded,
    failed,
    skipped,
    sources: sourceResults,
  };
}
