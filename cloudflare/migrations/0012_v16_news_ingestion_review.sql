PRAGMA foreign_keys = ON;

-- V16 / Workstream 1: external news discovery -> editorial review -> publication.
-- External content is never published directly. Every discovered item must pass
-- through news_review_queue before it can be linked to a published article.

CREATE TABLE IF NOT EXISTS news_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'official_web'
    CHECK (source_type IN ('official_web', 'rss', 'api', 'manual')),
  homepage_url TEXT NOT NULL,
  entry_url TEXT NOT NULL,
  fetch_strategy TEXT NOT NULL DEFAULT 'html_discovery'
    CHECK (fetch_strategy IN ('html_discovery', 'rss', 'api', 'manual')),
  default_category_id TEXT,
  trust_level TEXT NOT NULL DEFAULT 'official'
    CHECK (trust_level IN ('official', 'verified', 'reference')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  requires_editorial_review INTEGER NOT NULL DEFAULT 1
    CHECK (requires_editorial_review = 1),
  attribution_mode TEXT NOT NULL DEFAULT 'source_link'
    CHECK (attribution_mode IN ('source_link', 'source_name_and_link', 'custom')),
  attribution_text TEXT,
  fetch_interval_minutes INTEGER NOT NULL DEFAULT 60
    CHECK (fetch_interval_minutes >= 15),
  config_json TEXT NOT NULL DEFAULT '{}',
  last_fetched_at TEXT,
  last_success_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (default_category_id) REFERENCES article_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS news_ingest_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'succeeded', 'partial', 'failed')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  fetched_count INTEGER NOT NULL DEFAULT 0 CHECK (fetched_count >= 0),
  new_count INTEGER NOT NULL DEFAULT 0 CHECK (new_count >= 0),
  duplicate_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
  queued_count INTEGER NOT NULL DEFAULT 0 CHECK (queued_count >= 0),
  error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  error_summary TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS news_ingest_items (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  ingest_run_id TEXT,
  external_id TEXT,
  canonical_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title_raw TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  summary_raw TEXT,
  content_raw TEXT,
  image_url TEXT,
  author_raw TEXT,
  source_published_at TEXT,
  fetched_at TEXT NOT NULL,
  content_hash TEXT,
  dedupe_key TEXT NOT NULL,
  ingest_status TEXT NOT NULL DEFAULT 'discovered'
    CHECK (ingest_status IN ('discovered', 'duplicate', 'queued', 'ignored', 'error', 'imported')),
  duplicate_of_item_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_id, dedupe_key),
  FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (ingest_run_id) REFERENCES news_ingest_runs(id) ON DELETE SET NULL,
  FOREIGN KEY (duplicate_of_item_id) REFERENCES news_ingest_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS news_review_queue (
  id TEXT PRIMARY KEY,
  ingest_item_id TEXT NOT NULL UNIQUE,
  workflow_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (workflow_status IN ('pending', 'editing', 'approved', 'rejected', 'published')),
  suggested_title TEXT NOT NULL,
  suggested_excerpt TEXT,
  suggested_category_id TEXT,
  edited_title TEXT,
  edited_excerpt TEXT,
  editor_notes TEXT,
  assigned_to TEXT,
  reviewed_by TEXT,
  review_reason TEXT,
  article_id TEXT UNIQUE,
  queued_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT,
  FOREIGN KEY (ingest_item_id) REFERENCES news_ingest_items(id) ON DELETE CASCADE,
  FOREIGN KEY (suggested_category_id) REFERENCES article_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES admin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS article_provenance (
  article_id TEXT PRIMARY KEY,
  ingest_item_id TEXT UNIQUE,
  source_id TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  source_published_at TEXT,
  fetched_at TEXT NOT NULL,
  attribution_text TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (ingest_item_id) REFERENCES news_ingest_items(id) ON DELETE SET NULL,
  FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_news_sources_active_fetch
  ON news_sources(is_active, last_fetched_at);
CREATE INDEX IF NOT EXISTS idx_news_ingest_runs_source_started
  ON news_ingest_runs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_ingest_items_source_status_fetched
  ON news_ingest_items(source_id, ingest_status, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_ingest_items_canonical_url
  ON news_ingest_items(canonical_url);
CREATE INDEX IF NOT EXISTS idx_news_ingest_items_normalized_title
  ON news_ingest_items(normalized_title);
CREATE INDEX IF NOT EXISTS idx_news_review_queue_status_queued
  ON news_review_queue(workflow_status, queued_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_review_queue_assignee_status
  ON news_review_queue(assigned_to, workflow_status);
CREATE INDEX IF NOT EXISTS idx_article_provenance_source
  ON article_provenance(source_id, created_at DESC);
