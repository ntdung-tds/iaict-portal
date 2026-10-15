PRAGMA foreign_keys = ON;

-- V16.5 scheduled newsroom ingestion.
-- One Cloudflare cron tick evaluates source-specific due times stored in D1.
ALTER TABLE news_sources ADD COLUMN schedule_enabled INTEGER NOT NULL DEFAULT 0
  CHECK (schedule_enabled IN (0,1));
ALTER TABLE news_sources ADD COLUMN schedule_interval_minutes INTEGER NOT NULL DEFAULT 60
  CHECK (schedule_interval_minutes BETWEEN 15 AND 1440);
ALTER TABLE news_sources ADD COLUMN schedule_retry_minutes INTEGER NOT NULL DEFAULT 15
  CHECK (schedule_retry_minutes BETWEEN 15 AND 360);
ALTER TABLE news_sources ADD COLUMN next_scheduled_at TEXT;
ALTER TABLE news_sources ADD COLUMN last_scheduled_at TEXT;

-- Stagger the two initial official sources so one failing origin cannot monopolize a tick.
UPDATE news_sources
SET schedule_enabled=1,
    schedule_interval_minutes=30,
    schedule_retry_minutes=15,
    next_scheduled_at=datetime(CURRENT_TIMESTAMP, '+5 minutes'),
    updated_at=CURRENT_TIMESTAMP
WHERE id='mst-gov-vn';

UPDATE news_sources
SET schedule_enabled=1,
    schedule_interval_minutes=60,
    schedule_retry_minutes=15,
    next_scheduled_at=datetime(CURRENT_TIMESTAMP, '+15 minutes'),
    updated_at=CURRENT_TIMESTAMP
WHERE id='chinhphu-vn';

CREATE INDEX IF NOT EXISTS idx_news_sources_schedule_due
ON news_sources(schedule_enabled, is_active, next_scheduled_at);

-- Source lease prevents two cron invocations from ingesting the same source concurrently.
CREATE TABLE news_scheduler_claims (
  source_id TEXT PRIMARY KEY,
  lease_token TEXT NOT NULL UNIQUE,
  claimed_at TEXT NOT NULL,
  lease_until TEXT NOT NULL,
  scheduler_run_id TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES news_sources(id) ON DELETE CASCADE
);
CREATE INDEX idx_news_scheduler_claims_expiry
ON news_scheduler_claims(lease_until);

-- One row per Cron delivery. scheduled_key is idempotent for the same cron/minute.
CREATE TABLE news_scheduler_runs (
  id TEXT PRIMARY KEY,
  scheduled_key TEXT NOT NULL UNIQUE,
  cron_expression TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('running','succeeded','partial','failed','skipped')),
  due_count INTEGER NOT NULL DEFAULT 0 CHECK(due_count >= 0),
  claimed_count INTEGER NOT NULL DEFAULT 0 CHECK(claimed_count >= 0),
  succeeded_count INTEGER NOT NULL DEFAULT 0 CHECK(succeeded_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK(failed_count >= 0),
  skipped_count INTEGER NOT NULL DEFAULT 0 CHECK(skipped_count >= 0),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  CHECK(json_valid(metadata_json))
);
CREATE INDEX idx_news_scheduler_runs_started
ON news_scheduler_runs(started_at DESC);
