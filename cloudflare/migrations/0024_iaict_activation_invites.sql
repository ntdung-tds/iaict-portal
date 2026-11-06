PRAGMA foreign_keys = ON;

-- Short-lived, one-time first-password invitations. Never store bearer tokens.
-- Exactly one outstanding invitation per user; reissuing invalidates the old one.
CREATE TABLE IF NOT EXISTS iaict_activation_invites (
  user_id TEXT PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  issued_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  CHECK (expires_at > issued_at)
);
CREATE INDEX IF NOT EXISTS idx_iaict_activation_invites_expiry
  ON iaict_activation_invites(expires_at);
