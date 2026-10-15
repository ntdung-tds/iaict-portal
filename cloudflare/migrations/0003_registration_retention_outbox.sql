-- Hardening migration: atomic session capacity, privacy retention markers, durable notification outbox.
-- Safe for D1: no explicit BEGIN TRANSACTION / COMMIT wrappers.

ALTER TABLE course_sessions ADD COLUMN registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0);

ALTER TABLE leads ADD COLUMN retention_until TEXT;
ALTER TABLE leads ADD COLUMN deletion_requested_at TEXT;
ALTER TABLE leads ADD COLUMN legal_hold INTEGER NOT NULL DEFAULT 0 CHECK (legal_hold IN (0, 1));

ALTER TABLE course_registrations ADD COLUMN retention_until TEXT;
ALTER TABLE course_registrations ADD COLUMN deletion_requested_at TEXT;
ALTER TABLE course_registrations ADD COLUMN legal_hold INTEGER NOT NULL DEFAULT 0 CHECK (legal_hold IN (0, 1));

CREATE TABLE IF NOT EXISTS notification_outbox (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  template_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','queued','processing','sent','failed','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TEXT NOT NULL,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sent_at TEXT
);

-- Backfill when upgrading a development database that already contains registrations.
UPDATE course_sessions
SET registered_count = (
  SELECT COUNT(*) FROM course_registrations r
  WHERE r.session_id = course_sessions.id AND r.status <> 'cancelled'
);

CREATE TRIGGER IF NOT EXISTS trg_session_capacity_floor_before_update
BEFORE UPDATE OF capacity ON course_sessions
WHEN NEW.capacity IS NOT NULL AND NEW.capacity < OLD.registered_count
BEGIN
  SELECT RAISE(ABORT, 'CAPACITY_BELOW_REGISTERED');
END;

CREATE INDEX IF NOT EXISTS idx_outbox_status_available ON notification_outbox(status, available_at);
CREATE INDEX IF NOT EXISTS idx_outbox_entity ON notification_outbox(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_leads_retention ON leads(legal_hold, retention_until);
CREATE INDEX IF NOT EXISTS idx_registrations_retention ON course_registrations(legal_hold, retention_until);

-- Authoritative capacity guard. Parenthesized CASE is required for the D1 remote trigger splitter.
CREATE TRIGGER IF NOT EXISTS trg_registration_capacity_before_insert
BEFORE INSERT ON course_registrations
WHEN NEW.session_id IS NOT NULL AND NEW.status <> 'cancelled'
BEGIN
  SELECT (CASE
    WHEN NOT EXISTS (SELECT 1 FROM course_sessions WHERE id = NEW.session_id)
      THEN RAISE(ABORT, 'SESSION_NOT_FOUND')
    WHEN EXISTS (
      SELECT 1 FROM course_sessions
      WHERE id = NEW.session_id
        AND capacity IS NOT NULL
        AND registered_count >= capacity
    ) THEN RAISE(ABORT, 'SESSION_FULL')
  END);
END;

CREATE TRIGGER IF NOT EXISTS trg_registration_count_after_insert
AFTER INSERT ON course_registrations
WHEN NEW.session_id IS NOT NULL AND NEW.status <> 'cancelled'
BEGIN
  UPDATE course_sessions
  SET registered_count = registered_count + 1,
      updated_at = NEW.updated_at
  WHERE id = NEW.session_id;
END;

-- Guard transitions that consume a seat: cancelled -> active, or moving an active registration to another session.
CREATE TRIGGER IF NOT EXISTS trg_registration_capacity_before_update
BEFORE UPDATE OF session_id, status ON course_registrations
WHEN NEW.session_id IS NOT NULL
  AND NEW.status <> 'cancelled'
  AND (OLD.status = 'cancelled' OR OLD.session_id IS NOT NEW.session_id)
BEGIN
  SELECT (CASE
    WHEN NOT EXISTS (SELECT 1 FROM course_sessions WHERE id = NEW.session_id)
      THEN RAISE(ABORT, 'SESSION_NOT_FOUND')
    WHEN EXISTS (
      SELECT 1 FROM course_sessions
      WHERE id = NEW.session_id
        AND capacity IS NOT NULL
        AND registered_count >= capacity
    ) THEN RAISE(ABORT, 'SESSION_FULL')
  END);
END;

CREATE TRIGGER IF NOT EXISTS trg_registration_count_after_update
AFTER UPDATE OF session_id, status ON course_registrations
BEGIN
  UPDATE course_sessions
  SET registered_count = MAX(registered_count - 1, 0),
      updated_at = NEW.updated_at
  WHERE id = OLD.session_id
    AND OLD.session_id IS NOT NULL
    AND OLD.status <> 'cancelled'
    AND (NEW.status = 'cancelled' OR OLD.session_id IS NOT NEW.session_id);

  UPDATE course_sessions
  SET registered_count = registered_count + 1,
      updated_at = NEW.updated_at
  WHERE id = NEW.session_id
    AND NEW.session_id IS NOT NULL
    AND NEW.status <> 'cancelled'
    AND (OLD.status = 'cancelled' OR OLD.session_id IS NOT NEW.session_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_registration_count_after_delete
AFTER DELETE ON course_registrations
WHEN OLD.session_id IS NOT NULL AND OLD.status <> 'cancelled'
BEGIN
  UPDATE course_sessions
  SET registered_count = MAX(registered_count - 1, 0)
  WHERE id = OLD.session_id;
END;
