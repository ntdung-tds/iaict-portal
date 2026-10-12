-- v3.2: media scanning metadata.
ALTER TABLE media ADD COLUMN scan_status TEXT NOT NULL DEFAULT 'not_required'
  CHECK (scan_status IN ('not_required','pending','clean','blocked','failed'));
ALTER TABLE media ADD COLUMN content_sha256 TEXT;
CREATE INDEX IF NOT EXISTS idx_media_scan_status ON media(scan_status, created_at);
