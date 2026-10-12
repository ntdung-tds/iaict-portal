-- v3.4.1 PATCH: race-safe editorial publication claim metadata.
-- D1-compatible: no explicit BEGIN/COMMIT wrappers.

ALTER TABLE media ADD COLUMN publish_attempt_id TEXT;
ALTER TABLE media ADD COLUMN publish_started_at TEXT;
ALTER TABLE media ADD COLUMN published_at TEXT;

CREATE INDEX IF NOT EXISTS idx_media_publish_attempt
ON media(publication_state, publish_attempt_id, publish_started_at);

-- Published rows must never retain an in-flight attempt marker.
CREATE TRIGGER IF NOT EXISTS trg_media_published_no_attempt_insert
BEFORE INSERT ON media
WHEN NEW.publication_state='published' AND NEW.publish_attempt_id IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'PUBLISHED_MEDIA_HAS_ATTEMPT'); END;

CREATE TRIGGER IF NOT EXISTS trg_media_published_no_attempt_update
BEFORE UPDATE OF publication_state,publish_attempt_id ON media
WHEN NEW.publication_state='published' AND NEW.publish_attempt_id IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'PUBLISHED_MEDIA_HAS_ATTEMPT'); END;
