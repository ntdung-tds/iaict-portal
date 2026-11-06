PRAGMA foreign_keys = ON;

-- Forward-only schema for Workers-compatible PBKDF2 credentials.
-- Keep the original 0022 table unchanged; this table is separately versioned.
CREATE TABLE IF NOT EXISTS iaict_password_credentials_v2 (
  user_id TEXT PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  iterations INTEGER NOT NULL CHECK (iterations = 100000),
  updated_at TEXT NOT NULL
);
