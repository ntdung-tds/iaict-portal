-- v3.2: public form idempotency + canonical lead/contact invariants.
CREATE TABLE IF NOT EXISTS form_idempotency (
  endpoint TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  result_type TEXT NOT NULL,
  result_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (endpoint, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_form_idempotency_expiry ON form_idempotency(expires_at);

CREATE TRIGGER IF NOT EXISTS trg_lead_type_insert
BEFORE INSERT ON leads
WHEN NEW.type NOT IN ('consultation','project','technology_transfer','individual_course','organization_training','custom_program','partnership')
BEGIN SELECT RAISE(ABORT, 'INVALID_LEAD_TYPE'); END;
CREATE TRIGGER IF NOT EXISTS trg_lead_type_update
BEFORE UPDATE OF type ON leads
WHEN NEW.type NOT IN ('consultation','project','technology_transfer','individual_course','organization_training','custom_program','partnership')
BEGIN SELECT RAISE(ABORT, 'INVALID_LEAD_TYPE'); END;

CREATE TRIGGER IF NOT EXISTS trg_lead_contact_insert
BEFORE INSERT ON leads
WHEN trim(coalesce(NEW.phone,'')) = '' AND trim(coalesce(NEW.email,'')) = ''
BEGIN SELECT RAISE(ABORT, 'CONTACT_METHOD_REQUIRED'); END;
CREATE TRIGGER IF NOT EXISTS trg_lead_contact_update
BEFORE UPDATE OF phone,email ON leads
WHEN trim(coalesce(NEW.phone,'')) = '' AND trim(coalesce(NEW.email,'')) = ''
BEGIN SELECT RAISE(ABORT, 'CONTACT_METHOD_REQUIRED'); END;

CREATE TRIGGER IF NOT EXISTS trg_registration_contact_insert
BEFORE INSERT ON course_registrations
WHEN trim(coalesce(NEW.phone,'')) = '' AND trim(coalesce(NEW.email,'')) = ''
BEGIN SELECT RAISE(ABORT, 'CONTACT_METHOD_REQUIRED'); END;
CREATE TRIGGER IF NOT EXISTS trg_registration_contact_update
BEFORE UPDATE OF phone,email ON course_registrations
WHEN trim(coalesce(NEW.phone,'')) = '' AND trim(coalesce(NEW.email,'')) = ''
BEGIN SELECT RAISE(ABORT, 'CONTACT_METHOD_REQUIRED'); END;
