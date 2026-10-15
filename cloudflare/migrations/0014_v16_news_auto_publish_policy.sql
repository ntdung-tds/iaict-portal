PRAGMA foreign_keys = ON;

-- V16 / Workstream 1 policy extension: configurable auto-publish.
-- Auto-publish is OFF by default and remains gated by a global master switch,
-- per-source publication mode, trust level and validation checks.
-- Even in auto mode, items still pass through news_review_queue so approval
-- provenance and audit history remain observable.

CREATE TABLE IF NOT EXISTS news_workflow_settings (
  id TEXT PRIMARY KEY,
  auto_publish_enabled INTEGER NOT NULL DEFAULT 0
    CHECK (auto_publish_enabled IN (0, 1)),
  auto_publish_min_trust TEXT NOT NULL DEFAULT 'official'
    CHECK (auto_publish_min_trust IN ('official', 'verified', 'reference')),
  auto_publish_max_per_run INTEGER NOT NULL DEFAULT 10
    CHECK (auto_publish_max_per_run BETWEEN 1 AND 100),
  require_attribution INTEGER NOT NULL DEFAULT 1
    CHECK (require_attribution IN (0, 1)),
  require_source_published_at INTEGER NOT NULL DEFAULT 0
    CHECK (require_source_published_at IN (0, 1)),
  settings_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO news_workflow_settings (
  id,
  auto_publish_enabled,
  auto_publish_min_trust,
  auto_publish_max_per_run,
  require_attribution,
  require_source_published_at,
  settings_json,
  updated_at
) VALUES (
  'default',
  0,
  'official',
  10,
  1,
  0,
  '{"policy":"manual-by-default","cms_configurable":true}',
  CURRENT_TIMESTAMP
);

ALTER TABLE news_sources
  ADD COLUMN publication_mode TEXT NOT NULL DEFAULT 'inherit'
    CHECK (publication_mode IN ('inherit', 'manual', 'auto'));

ALTER TABLE news_review_queue
  ADD COLUMN approval_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (approval_mode IN ('manual', 'auto'));

ALTER TABLE news_review_queue
  ADD COLUMN policy_snapshot_json TEXT NOT NULL DEFAULT '{}';

ALTER TABLE news_review_queue
  ADD COLUMN auto_publish_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_news_sources_publication_mode
  ON news_sources(is_active, publication_mode, trust_level);

CREATE INDEX IF NOT EXISTS idx_news_review_queue_approval_mode_status
  ON news_review_queue(approval_mode, workflow_status, queued_at DESC);
