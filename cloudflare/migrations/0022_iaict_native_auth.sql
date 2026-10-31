PRAGMA foreign_keys = ON;
-- Opt-in native authentication: no existing Access identities are modified.
CREATE TABLE IF NOT EXISTS iaict_password_credentials (
 user_id TEXT PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
 salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 iterations INTEGER NOT NULL CHECK(iterations >= 310000),
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS iaict_auth_sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 revoked_at INTEGER,
 CHECK(expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS idx_iaict_auth_sessions_user ON iaict_auth_sessions(user_id,expires_at);
CREATE TABLE IF NOT EXISTS iaict_login_attempts (
 email_hash TEXT PRIMARY KEY,
 window_start INTEGER NOT NULL,
 failures INTEGER NOT NULL DEFAULT 0,
 blocked_until INTEGER NOT NULL DEFAULT 0
);
