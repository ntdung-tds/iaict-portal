-- 0025 — Dedicated Media R2 private quarantine ledger (STAGING SOURCE, forward-only).
-- Does NOT change legacy media public references or enable scanning/public reads.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS media_r2_quarantine_uploads (
  id TEXT PRIMARY KEY,
  scope_id TEXT NOT NULL CHECK (length(scope_id) BETWEEN 1 AND 128),
  actor_user_id TEXT NOT NULL REFERENCES admin_users(id),
  idempotency_key TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
  display_filename TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length > 0 AND byte_length <= 10485760),
  content_sha256 TEXT,
  state TEXT NOT NULL DEFAULT 'RESERVED'
    CHECK (state IN ('RESERVED','QUARANTINED','FAILED','ORPHAN_PENDING_PURGE','REVOKED')),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  scanner_attestation TEXT,
  derivative_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(scope_id, actor_user_id, idempotency_key),
  CHECK (
    (state = 'RESERVED' AND content_sha256 IS NULL)
    OR (state <> 'RESERVED')
  ),
  CHECK (scanner_attestation IS NULL),
  CHECK (derivative_key IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_media_r2_quarantine_actor_hour
  ON media_r2_quarantine_uploads(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_media_r2_quarantine_scope_day
  ON media_r2_quarantine_uploads(scope_id, created_at);
CREATE INDEX IF NOT EXISTS idx_media_r2_quarantine_state_time
  ON media_r2_quarantine_uploads(state, created_at);

-- Scanner integration is deliberately absent in this migration:
-- no transition to AVAILABLE, no public URLs or public R2 object keys.
