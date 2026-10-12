-- v3.4.2 build-readiness hardening. Do not edit earlier migrations.

-- Normalize legacy provenance values from pre-v3.4 data.
UPDATE leads SET consent_source='legacy_import' WHERE consent_source='legacy-import';
UPDATE course_registrations SET consent_source='legacy_import' WHERE consent_source='legacy-import';
UPDATE leads SET consent_purpose='legacy_business_contact' WHERE consent_purpose='legacy-business-contact';
UPDATE course_registrations SET consent_purpose='legacy_training_registration' WHERE consent_purpose='legacy-training-registration';

-- Public-form Idempotency-Key must be a canonical 36-character UUID textual shape.
-- The hex-only check is applied after removing hyphens; unlike a naive GLOB pattern,
-- '*' is not used as a regex repetition operator.
CREATE TRIGGER IF NOT EXISTS trg_form_idempotency_uuid_insert
BEFORE INSERT ON form_idempotency
WHEN length(NEW.idempotency_key) <> 36
  OR substr(NEW.idempotency_key,9,1) <> '-'
  OR substr(NEW.idempotency_key,14,1) <> '-'
  OR substr(NEW.idempotency_key,19,1) <> '-'
  OR substr(NEW.idempotency_key,24,1) <> '-'
  OR length(replace(NEW.idempotency_key,'-','')) <> 32
  OR lower(replace(NEW.idempotency_key,'-','')) GLOB '*[^0-9a-f]*'
BEGIN SELECT RAISE(ABORT, 'INVALID_IDEMPOTENCY_KEY_FORMAT'); END;

CREATE TRIGGER IF NOT EXISTS trg_form_idempotency_uuid_update
BEFORE UPDATE OF idempotency_key ON form_idempotency
WHEN length(NEW.idempotency_key) <> 36
  OR substr(NEW.idempotency_key,9,1) <> '-'
  OR substr(NEW.idempotency_key,14,1) <> '-'
  OR substr(NEW.idempotency_key,19,1) <> '-'
  OR substr(NEW.idempotency_key,24,1) <> '-'
  OR length(replace(NEW.idempotency_key,'-','')) <> 32
  OR lower(replace(NEW.idempotency_key,'-','')) GLOB '*[^0-9a-f]*'
BEGIN SELECT RAISE(ABORT, 'INVALID_IDEMPOTENCY_KEY_FORMAT'); END;

-- Consent source is a stable provenance enum. Purpose is also canonicalized to a bounded business enum.
CREATE TRIGGER IF NOT EXISTS trg_lead_consent_enum_insert
BEFORE INSERT ON leads
WHEN NEW.consent_source NOT IN ('public_web_form','admin_entry','legacy_import','system_migration')
  OR NEW.consent_purpose NOT IN (
    'consultation_follow_up','individual_course_follow_up','training_registration',
    'organization_training_follow_up','custom_program_follow_up','technology_transfer_follow_up',
    'partnership_follow_up','project_follow_up','legacy_business_contact','legacy_training_registration'
  )
BEGIN SELECT RAISE(ABORT, 'INVALID_CONSENT_PROVENANCE_ENUM'); END;

CREATE TRIGGER IF NOT EXISTS trg_lead_consent_enum_update
BEFORE UPDATE OF consent_source,consent_purpose ON leads
WHEN NEW.consent_source NOT IN ('public_web_form','admin_entry','legacy_import','system_migration')
  OR NEW.consent_purpose NOT IN (
    'consultation_follow_up','individual_course_follow_up','training_registration',
    'organization_training_follow_up','custom_program_follow_up','technology_transfer_follow_up',
    'partnership_follow_up','project_follow_up','legacy_business_contact','legacy_training_registration'
  )
BEGIN SELECT RAISE(ABORT, 'INVALID_CONSENT_PROVENANCE_ENUM'); END;

CREATE TRIGGER IF NOT EXISTS trg_registration_consent_enum_insert
BEFORE INSERT ON course_registrations
WHEN NEW.consent_source NOT IN ('public_web_form','admin_entry','legacy_import','system_migration')
  OR NEW.consent_purpose NOT IN ('training_registration','legacy_training_registration')
BEGIN SELECT RAISE(ABORT, 'INVALID_CONSENT_PROVENANCE_ENUM'); END;

CREATE TRIGGER IF NOT EXISTS trg_registration_consent_enum_update
BEFORE UPDATE OF consent_source,consent_purpose ON course_registrations
WHEN NEW.consent_source NOT IN ('public_web_form','admin_entry','legacy_import','system_migration')
  OR NEW.consent_purpose NOT IN ('training_registration','legacy_training_registration')
BEGIN SELECT RAISE(ABORT, 'INVALID_CONSENT_PROVENANCE_ENUM'); END;
