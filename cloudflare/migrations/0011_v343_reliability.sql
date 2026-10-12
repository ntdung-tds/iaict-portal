-- Forward-only patch. Historical migrations 0001-0010 remain byte-for-byte unchanged.
-- Preflight failure stops upgrade rather than inventing a retention date.
CREATE TABLE _v343_retention_check(value INTEGER NOT NULL CHECK(value=1));
INSERT INTO _v343_retention_check
SELECT CASE WHEN EXISTS(SELECT 1 FROM leads WHERE strftime('%Y-%m-%dT%H:%M:%fZ',
  CASE WHEN trim(coalesce(retention_until,''))='' THEN datetime(created_at,'+730 days') ELSE retention_until END) IS NULL)
OR EXISTS(SELECT 1 FROM course_registrations WHERE strftime('%Y-%m-%dT%H:%M:%fZ',
  CASE WHEN trim(coalesce(retention_until,''))='' THEN datetime(created_at,'+730 days') ELSE retention_until END) IS NULL)
THEN 0 ELSE 1 END;
UPDATE leads SET retention_until=strftime('%Y-%m-%dT%H:%M:%fZ',
 CASE WHEN trim(coalesce(retention_until,''))='' THEN datetime(created_at,'+730 days') ELSE retention_until END);
UPDATE course_registrations SET retention_until=strftime('%Y-%m-%dT%H:%M:%fZ',
 CASE WHEN trim(coalesce(retention_until,''))='' THEN datetime(created_at,'+730 days') ELSE retention_until END);
DROP TABLE _v343_retention_check;

-- status is editorial; enrollment_status is the independent business state.
ALTER TABLE courses ADD COLUMN enrollment_status TEXT NOT NULL DEFAULT 'on_request'
 CHECK(enrollment_status IN ('open','upcoming','on_request','closed'));
ALTER TABLE courses ADD COLUMN version INTEGER NOT NULL DEFAULT 0 CHECK(version>=0);
ALTER TABLE courses ADD COLUMN duration_hours REAL CHECK(duration_hours IS NULL OR duration_hours>0);
UPDATE courses SET enrollment_status=status WHERE status IN ('open','upcoming','on_request','closed');
-- Legacy business states do not prove editorial approval. Fail private until re-approved.
UPDATE courses SET status='draft' WHERE status IN ('open','upcoming','on_request','closed');
CREATE TRIGGER trg_course_editorial_insert BEFORE INSERT ON courses
 WHEN NEW.status NOT IN ('draft','in_review','approved','published','archived')
 BEGIN SELECT RAISE(ABORT,'INVALID_COURSE_PUBLICATION_STATUS'); END;
CREATE TRIGGER trg_course_editorial_update BEFORE UPDATE OF status ON courses
 WHEN NEW.status NOT IN ('draft','in_review','approved','published','archived')
 BEGIN SELECT RAISE(ABORT,'INVALID_COURSE_PUBLICATION_STATUS'); END;
ALTER TABLE solutions ADD COLUMN category TEXT;
ALTER TABLE products ADD COLUMN transferable INTEGER NOT NULL DEFAULT 0 CHECK(transferable IN (0,1));
ALTER TABLE experts ADD COLUMN is_instructor INTEGER NOT NULL DEFAULT 0 CHECK(is_instructor IN (0,1));
ALTER TABLE course_sessions ADD COLUMN ever_registered_at TEXT;
UPDATE course_sessions SET ever_registered_at=(SELECT MIN(created_at) FROM course_registrations WHERE session_id=course_sessions.id);
CREATE TRIGGER trg_session_remember_history AFTER INSERT ON course_registrations
 WHEN NEW.session_id IS NOT NULL
 BEGIN UPDATE course_sessions SET ever_registered_at=coalesce(ever_registered_at,NEW.created_at) WHERE id=NEW.session_id; END;
CREATE TRIGGER trg_session_remember_moved_history AFTER UPDATE OF session_id ON course_registrations
 WHEN NEW.session_id IS NOT NULL
 BEGIN UPDATE course_sessions SET ever_registered_at=coalesce(ever_registered_at,NEW.updated_at) WHERE id=NEW.session_id; END;
CREATE TRIGGER trg_session_ever_delete BEFORE DELETE ON course_sessions
 WHEN OLD.ever_registered_at IS NOT NULL
 BEGIN SELECT RAISE(ABORT,'SESSION_HAS_REGISTRATIONS'); END;
CREATE TRIGGER trg_session_ever_parent BEFORE UPDATE OF course_id ON course_sessions
 WHEN OLD.ever_registered_at IS NOT NULL AND NEW.course_id IS NOT OLD.course_id
 BEGIN SELECT RAISE(ABORT,'SESSION_COURSE_IMMUTABLE'); END;
CREATE TRIGGER trg_session_history_monotonic BEFORE UPDATE OF ever_registered_at ON course_sessions
 WHEN OLD.ever_registered_at IS NOT NULL AND NEW.ever_registered_at IS NOT OLD.ever_registered_at
 BEGIN SELECT RAISE(ABORT,'SESSION_HISTORY_IMMUTABLE'); END;

-- Public registration acceptance is evaluated under the SAME serialized write boundary as capacity.
CREATE TRIGGER trg_public_registration_accept_insert BEFORE INSERT ON course_registrations
 WHEN NEW.consent_source='public_web_form' AND NEW.status<>'cancelled'
 BEGIN
 SELECT CASE
 WHEN NEW.session_id IS NOT NULL AND EXISTS(SELECT 1 FROM course_sessions WHERE id=NEW.session_id AND course_id<>NEW.course_id) THEN RAISE(ABORT,'SESSION_COURSE_MISMATCH')
 WHEN julianday(NEW.created_at) IS NULL OR julianday(NEW.updated_at) IS NULL THEN RAISE(ABORT,'INVALID_REGISTRATION_TIMESTAMP')
 WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id=NEW.course_id AND status='published'
   AND enrollment_status IN ('open','on_request')) THEN RAISE(ABORT,'COURSE_NOT_ACCEPTING')
 WHEN NEW.session_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM course_sessions s WHERE s.id=NEW.session_id
   AND s.course_id=NEW.course_id AND s.status='open_registration'
   AND (s.registration_open_at IS NULL OR julianday(s.registration_open_at)<=julianday(NEW.created_at))
   AND (s.registration_close_at IS NULL OR julianday(NEW.created_at)<julianday(s.registration_close_at)))
   THEN RAISE(ABORT,'SESSION_NOT_ACCEPTING') END;
 END;
CREATE TRIGGER trg_public_registration_accept_update BEFORE UPDATE OF session_id,status,course_id ON course_registrations
 WHEN NEW.consent_source='public_web_form' AND NEW.status<>'cancelled'
 AND (OLD.status='cancelled' OR OLD.session_id IS NOT NEW.session_id OR OLD.course_id IS NOT NEW.course_id)
 BEGIN
 SELECT CASE
 WHEN NEW.session_id IS NOT NULL AND EXISTS(SELECT 1 FROM course_sessions WHERE id=NEW.session_id AND course_id<>NEW.course_id) THEN RAISE(ABORT,'SESSION_COURSE_MISMATCH')
 WHEN julianday(NEW.created_at) IS NULL OR julianday(NEW.updated_at) IS NULL THEN RAISE(ABORT,'INVALID_REGISTRATION_TIMESTAMP')
 WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id=NEW.course_id AND status='published'
   AND enrollment_status IN ('open','on_request')) THEN RAISE(ABORT,'COURSE_NOT_ACCEPTING')
 WHEN NEW.session_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM course_sessions s WHERE s.id=NEW.session_id
   AND s.course_id=NEW.course_id AND s.status='open_registration'
   AND (s.registration_open_at IS NULL OR julianday(s.registration_open_at)<=julianday(NEW.updated_at))
   AND (s.registration_close_at IS NULL OR julianday(NEW.updated_at)<julianday(s.registration_close_at)))
   THEN RAISE(ABORT,'SESSION_NOT_ACCEPTING') END;
 END;

ALTER TABLE media ADD COLUMN publish_phase TEXT NOT NULL DEFAULT 'idle' CHECK(publish_phase IN ('idle','copying','cleanup'));
CREATE TABLE media_publish_attempts(
 attempt_id TEXT PRIMARY KEY, media_id TEXT NOT NULL, source_key TEXT NOT NULL, public_key TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL CHECK(status IN ('copying','cleanup','published','cleaned')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE RESTRICT);
CREATE UNIQUE INDEX idx_media_one_live_attempt ON media_publish_attempts(media_id) WHERE status IN ('copying','cleanup');
CREATE INDEX idx_media_attempt_recovery ON media_publish_attempts(status,updated_at);
-- Existing claims from v3.4.1 remain recoverable, never silently discarded.
INSERT INTO media_publish_attempts(attempt_id,media_id,source_key,public_key,status,created_at,updated_at)
 SELECT publish_attempt_id,id,storage_key,'published/'||id||'/'||publish_attempt_id,'copying',
 coalesce(publish_started_at,updated_at),updated_at FROM media WHERE publish_attempt_id IS NOT NULL;
UPDATE media SET publish_phase='copying' WHERE publish_attempt_id IS NOT NULL;

ALTER TABLE notification_outbox ADD COLUMN dispatch_lease_until TEXT;
ALTER TABLE notification_outbox ADD COLUMN claim_token TEXT;
ALTER TABLE notification_outbox ADD COLUMN lease_until TEXT;
ALTER TABLE notification_outbox ADD COLUMN payload_hash TEXT;
ALTER TABLE notification_outbox ADD COLUMN provider_first_attempt_at TEXT;
CREATE INDEX idx_outbox_processing_lease ON notification_outbox(status,lease_until);
-- Legacy active/failed attempts lack a trustworthy pinned payload/acceptance record. Quarantine, never blind replay.
UPDATE notification_outbox SET status='failed',last_error_code='DELIVERY_AMBIGUOUS_UNSAFE',
 claim_token=NULL,lease_until=NULL,provider_first_attempt_at=coalesce(provider_first_attempt_at,updated_at)
 WHERE status IN ('processing','failed') OR (status IN ('pending','queued') AND attempts>0);


-- A guard row raises BEFORE any side effect; a zero-row UPDATE is not a successful rename.
CREATE TABLE course_slug_mutations(
 id TEXT PRIMARY KEY, course_id TEXT NOT NULL, expected_slug TEXT NOT NULL, expected_version INTEGER NOT NULL,
 new_slug TEXT NOT NULL, old_path TEXT NOT NULL, new_path TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TRIGGER trg_course_slug_mutation_guard BEFORE INSERT ON course_slug_mutations
 BEGIN
 SELECT CASE
 WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id=NEW.course_id AND slug=NEW.expected_slug
   AND version=NEW.expected_version AND status='published') THEN RAISE(ABORT,'SLUG_VERSION_CONFLICT')
 WHEN NEW.old_path<>('/dao-tao/khoa-hoc/'||NEW.expected_slug)
   OR NEW.new_path<>('/dao-tao/khoa-hoc/'||NEW.new_slug) OR NEW.new_slug=NEW.expected_slug
   THEN RAISE(ABORT,'SLUG_PATH_INVALID')
 WHEN EXISTS(SELECT 1 FROM redirects WHERE source_path=NEW.new_path AND is_active=1)
   THEN RAISE(ABORT,'SLUG_REDIRECT_CONFLICT')
 WHEN EXISTS(SELECT 1 FROM courses WHERE slug=NEW.new_slug AND id<>NEW.course_id)
   THEN RAISE(ABORT,'SLUG_ALREADY_EXISTS') END;
 END;
