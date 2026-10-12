-- v3.4 FINAL: relational/data-lifecycle invariants and consent provenance.
-- D1-compatible: no explicit BEGIN/COMMIT wrappers.

-- Course display copy is separate from canonical taxonomy arrays.
ALTER TABLE courses ADD COLUMN audience_summary TEXT;

-- Keep a non-PII Lead stub when a linked registration must outlive Lead PII retention.
ALTER TABLE leads ADD COLUMN pii_redacted_at TEXT;
ALTER TABLE leads ADD COLUMN privacy_notice_version TEXT;
ALTER TABLE leads ADD COLUMN consent_source TEXT;
ALTER TABLE leads ADD COLUMN consent_purpose TEXT;
ALTER TABLE course_registrations ADD COLUMN privacy_notice_version TEXT;
ALTER TABLE course_registrations ADD COLUMN consent_source TEXT;
ALTER TABLE course_registrations ADD COLUMN consent_purpose TEXT;

-- Notification provider observability without storing message body/recipient PII.
ALTER TABLE notification_outbox ADD COLUMN provider TEXT;
ALTER TABLE notification_outbox ADD COLUMN provider_message_id TEXT;
ALTER TABLE notification_outbox ADD COLUMN provider_idempotency_expires_at TEXT;

-- Backfill legacy provenance before enforcing new writes.
UPDATE leads SET privacy_notice_version=COALESCE(NULLIF(trim(privacy_notice_version),''),'legacy-unknown')
WHERE privacy_notice_version IS NULL OR trim(privacy_notice_version)='';
UPDATE leads SET consent_source=COALESCE(NULLIF(trim(consent_source),''),'legacy-import')
WHERE consent_source IS NULL OR trim(consent_source)='';
UPDATE leads SET consent_purpose=COALESCE(NULLIF(trim(consent_purpose),''),'legacy-business-contact')
WHERE consent_purpose IS NULL OR trim(consent_purpose)='';
UPDATE course_registrations SET privacy_notice_version=COALESCE(NULLIF(trim(privacy_notice_version),''),'legacy-unknown')
WHERE privacy_notice_version IS NULL OR trim(privacy_notice_version)='';
UPDATE course_registrations SET consent_source=COALESCE(NULLIF(trim(consent_source),''),'legacy-import')
WHERE consent_source IS NULL OR trim(consent_source)='';
UPDATE course_registrations SET consent_purpose=COALESCE(NULLIF(trim(consent_purpose),''),'legacy-training-registration')
WHERE consent_purpose IS NULL OR trim(consent_purpose)='';

-- A new/updated active Lead must have a contact method. Redacted historical stubs are exempt.
DROP TRIGGER IF EXISTS trg_lead_contact_update;
CREATE TRIGGER trg_lead_contact_update
BEFORE UPDATE OF phone,email,pii_redacted_at ON leads
WHEN NEW.pii_redacted_at IS NULL
  AND trim(coalesce(NEW.phone,'')) = ''
  AND trim(coalesce(NEW.email,'')) = ''
BEGIN SELECT RAISE(ABORT, 'CONTACT_METHOD_REQUIRED'); END;

CREATE TRIGGER IF NOT EXISTS trg_lead_consent_provenance_insert
BEFORE INSERT ON leads
WHEN NEW.privacy_notice_version IS NULL OR trim(NEW.privacy_notice_version)=''
  OR NEW.consent_source IS NULL OR trim(NEW.consent_source)=''
  OR NEW.consent_purpose IS NULL OR trim(NEW.consent_purpose)=''
BEGIN SELECT RAISE(ABORT, 'CONSENT_PROVENANCE_REQUIRED'); END;
CREATE TRIGGER IF NOT EXISTS trg_registration_consent_provenance_insert
BEFORE INSERT ON course_registrations
WHEN NEW.privacy_notice_version IS NULL OR trim(NEW.privacy_notice_version)=''
  OR NEW.consent_source IS NULL OR trim(NEW.consent_source)=''
  OR NEW.consent_purpose IS NULL OR trim(NEW.consent_purpose)=''
BEGIN SELECT RAISE(ABORT, 'CONSENT_PROVENANCE_REQUIRED'); END;

-- Capacity is optional but never negative.
CREATE TRIGGER IF NOT EXISTS trg_session_capacity_nonnegative_insert
BEFORE INSERT ON course_sessions
WHEN NEW.capacity IS NOT NULL AND NEW.capacity < 0
BEGIN SELECT RAISE(ABORT, 'INVALID_SESSION_CAPACITY'); END;
CREATE TRIGGER IF NOT EXISTS trg_session_capacity_nonnegative_update
BEFORE UPDATE OF capacity ON course_sessions
WHEN NEW.capacity IS NOT NULL AND NEW.capacity < 0
BEGIN SELECT RAISE(ABORT, 'INVALID_SESSION_CAPACITY'); END;

-- A registration's course and selected session must refer to the same Course.
CREATE TRIGGER IF NOT EXISTS trg_registration_session_course_insert
BEFORE INSERT ON course_registrations
WHEN NEW.session_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM course_sessions WHERE id=NEW.session_id)
      THEN RAISE(ABORT, 'SESSION_NOT_FOUND')
    WHEN NOT EXISTS (SELECT 1 FROM course_sessions WHERE id=NEW.session_id AND course_id=NEW.course_id)
      THEN RAISE(ABORT, 'SESSION_COURSE_MISMATCH')
  END;
END;
CREATE TRIGGER IF NOT EXISTS trg_registration_session_course_update
BEFORE UPDATE OF course_id,session_id ON course_registrations
WHEN NEW.session_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM course_sessions WHERE id=NEW.session_id)
      THEN RAISE(ABORT, 'SESSION_NOT_FOUND')
    WHEN NOT EXISTS (SELECT 1 FROM course_sessions WHERE id=NEW.session_id AND course_id=NEW.course_id)
      THEN RAISE(ABORT, 'SESSION_COURSE_MISMATCH')
  END;
END;

-- Once a session has any registration history, its parent Course is immutable.
CREATE TRIGGER IF NOT EXISTS trg_session_course_immutable_with_history
BEFORE UPDATE OF course_id ON course_sessions
WHEN NEW.course_id IS NOT OLD.course_id
  AND EXISTS (SELECT 1 FROM course_registrations WHERE session_id=OLD.id)
BEGIN SELECT RAISE(ABORT, 'SESSION_COURSE_IMMUTABLE'); END;

-- Prevent Lead deletion from silently cascading into a Registration whose retention may be longer.
-- Retention purge redacts the Lead first; hard deletion is allowed only after linked registrations are gone.
CREATE TRIGGER IF NOT EXISTS trg_lead_delete_registration_guard
BEFORE DELETE ON leads
WHEN EXISTS (SELECT 1 FROM course_registrations WHERE lead_id=OLD.id)
BEGIN SELECT RAISE(ABORT, 'LEAD_HAS_REGISTRATION'); END;

CREATE INDEX IF NOT EXISTS idx_leads_pii_redacted ON leads(pii_redacted_at, retention_until);

-- Media storage boundary is explicit in metadata; application maps each scope to the matching R2 binding.
ALTER TABLE media ADD COLUMN storage_scope TEXT;
ALTER TABLE media ADD COLUMN publication_state TEXT NOT NULL DEFAULT 'draft'
  CHECK (publication_state IN ('draft','approved','published','archived'));
UPDATE media
SET storage_scope = CASE WHEN visibility='public' THEN 'public_media' ELSE 'editorial_staging' END
WHERE storage_scope IS NULL OR trim(storage_scope)='';
CREATE TRIGGER IF NOT EXISTS trg_media_storage_scope_insert
BEFORE INSERT ON media
WHEN NEW.storage_scope IS NULL OR NEW.storage_scope NOT IN ('editorial_staging','public_media','private_uploads')
BEGIN SELECT RAISE(ABORT, 'INVALID_MEDIA_STORAGE_SCOPE'); END;
CREATE TRIGGER IF NOT EXISTS trg_media_storage_scope_update
BEFORE UPDATE OF storage_scope ON media
WHEN NEW.storage_scope IS NULL OR NEW.storage_scope NOT IN ('editorial_staging','public_media','private_uploads')
BEGIN SELECT RAISE(ABORT, 'INVALID_MEDIA_STORAGE_SCOPE'); END;

CREATE TRIGGER IF NOT EXISTS trg_lead_consent_provenance_update
BEFORE UPDATE OF privacy_notice_version,consent_source,consent_purpose ON leads
WHEN NEW.privacy_notice_version IS NULL OR trim(NEW.privacy_notice_version)=''
  OR NEW.consent_source IS NULL OR trim(NEW.consent_source)=''
  OR NEW.consent_purpose IS NULL OR trim(NEW.consent_purpose)=''
BEGIN SELECT RAISE(ABORT, 'CONSENT_PROVENANCE_REQUIRED'); END;
CREATE TRIGGER IF NOT EXISTS trg_registration_consent_provenance_update
BEFORE UPDATE OF privacy_notice_version,consent_source,consent_purpose ON course_registrations
WHEN NEW.privacy_notice_version IS NULL OR trim(NEW.privacy_notice_version)=''
  OR NEW.consent_source IS NULL OR trim(NEW.consent_source)=''
  OR NEW.consent_purpose IS NULL OR trim(NEW.consent_purpose)=''
BEGIN SELECT RAISE(ABORT, 'CONSENT_PROVENANCE_REQUIRED'); END;
