PRAGMA foreign_keys = ON;

-- Race-safe publication claim. The claim is created and removed inside the
-- same D1 batch transaction as article/provenance publication. A stale or
-- concurrent writer fails before any publication side effect is committed.
CREATE TABLE IF NOT EXISTS news_publication_claims (
  id TEXT PRIMARY KEY,
  queue_id TEXT NOT NULL UNIQUE,
  expected_status TEXT NOT NULL
    CHECK (expected_status IN ('pending', 'approved')),
  approval_mode TEXT NOT NULL
    CHECK (approval_mode IN ('manual', 'auto')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (queue_id) REFERENCES news_review_queue(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS trg_news_publication_claim_guard
BEFORE INSERT ON news_publication_claims
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM news_review_queue q
      WHERE q.id = NEW.queue_id
        AND q.workflow_status = NEW.expected_status
        AND q.article_id IS NULL
    ) THEN RAISE(ABORT, 'NEWS_PUBLICATION_STATE_CONFLICT')
  END;
END;

CREATE INDEX IF NOT EXISTS idx_news_publication_claim_created
  ON news_publication_claims(created_at);
