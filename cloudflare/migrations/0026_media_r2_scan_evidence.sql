-- 0026 — forward-only private scanner receipt ledger (source only; no publish).
-- Never edit migration 0025: its NULL-only attestation constraints remain.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS media_r2_scan_evidence (
  id TEXT PRIMARY KEY,
  source_upload_id TEXT NOT NULL UNIQUE REFERENCES media_r2_quarantine_uploads(id) ON DELETE CASCADE,
  scope_id TEXT NOT NULL CHECK (scope_id='cms-main'),
  source_revision INTEGER NOT NULL CHECK (source_revision > 0),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256)=64),
  derivative_key TEXT NOT NULL UNIQUE CHECK (derivative_key LIKE 'derivative/staged/v1/cms-main/%'),
  derivative_sha256 TEXT NOT NULL CHECK (length(derivative_sha256)=64),
  derivative_size INTEGER NOT NULL CHECK (derivative_size > 0 AND derivative_size <= 10485760),
  derivative_mime TEXT NOT NULL CHECK (derivative_mime='image/webp'),
  width INTEGER NOT NULL CHECK (width > 0 AND width <= 8192),
  height INTEGER NOT NULL CHECK (height > 0 AND height <= 8192),
  scanner_engine TEXT NOT NULL CHECK (scanner_engine='clamav'),
  attestation_sha256 TEXT NOT NULL UNIQUE CHECK (length(attestation_sha256)=64),
  signer_nonce TEXT NOT NULL UNIQUE CHECK (length(signer_nonce)=32),
  scanned_at_ms INTEGER NOT NULL CHECK (scanned_at_ms > 0),
  state TEXT NOT NULL CHECK (state='SCAN_PASSED_PRIVATE'),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_r2_scan_scope_time
  ON media_r2_scan_evidence(scope_id, created_at);

-- No scan certificate permits public GET, REVIEW_APPROVED or AVAILABLE.
-- Removal of a source tombstone cascades the private evidence record.
