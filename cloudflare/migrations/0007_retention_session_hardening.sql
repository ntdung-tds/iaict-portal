-- v3.3: enforce retention presence and preserve historical registration/session linkage.
-- D1-compatible: no explicit BEGIN/COMMIT wrappers.

-- Backfill legacy NULL values before enabling the guards. These values are defaults;
-- application policy may later extend retention with an audited business event.
UPDATE leads
SET retention_until = COALESCE(retention_until, datetime(created_at, '+730 days'))
WHERE retention_until IS NULL OR trim(retention_until) = '';

UPDATE course_registrations
SET retention_until = COALESCE(retention_until, datetime(created_at, '+730 days'))
WHERE retention_until IS NULL OR trim(retention_until) = '';

CREATE TRIGGER IF NOT EXISTS trg_lead_retention_required_insert
BEFORE INSERT ON leads
WHEN NEW.retention_until IS NULL OR trim(NEW.retention_until) = ''
BEGIN
  SELECT RAISE(ABORT, 'RETENTION_UNTIL_REQUIRED');
END;

CREATE TRIGGER IF NOT EXISTS trg_lead_retention_required_update
BEFORE UPDATE OF retention_until ON leads
WHEN NEW.retention_until IS NULL OR trim(NEW.retention_until) = ''
BEGIN
  SELECT RAISE(ABORT, 'RETENTION_UNTIL_REQUIRED');
END;

CREATE TRIGGER IF NOT EXISTS trg_registration_retention_required_insert
BEFORE INSERT ON course_registrations
WHEN NEW.retention_until IS NULL OR trim(NEW.retention_until) = ''
BEGIN
  SELECT RAISE(ABORT, 'RETENTION_UNTIL_REQUIRED');
END;

CREATE TRIGGER IF NOT EXISTS trg_registration_retention_required_update
BEFORE UPDATE OF retention_until ON course_registrations
WHEN NEW.retention_until IS NULL OR trim(NEW.retention_until) = ''
BEGIN
  SELECT RAISE(ABORT, 'RETENTION_UNTIL_REQUIRED');
END;

-- A course session is a historical/audit referent once any registration points to it.
-- Archive/close it instead of deleting it. This intentionally blocks course-delete cascades too.
CREATE TRIGGER IF NOT EXISTS trg_session_delete_guard
BEFORE DELETE ON course_sessions
WHEN EXISTS (SELECT 1 FROM course_registrations WHERE session_id = OLD.id)
BEGIN
  SELECT RAISE(ABORT, 'SESSION_HAS_REGISTRATIONS');
END;
