-- Cloudflare D1 Database Schema for Password Manager

-- Users table (only authorized users: spoass@icloud.com, laila.torresanz@hotmail.com)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  last_login TEXT
);

-- Verification codes table
CREATE TABLE verification_codes (
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL, -- 'login' only (no registration)
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (email, type)
);

-- Passwords table
CREATE TABLE passwords (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  password TEXT,
  url TEXT,
  notes TEXT,
  two_factor_secret TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_passwords_user_id ON passwords(user_id);
CREATE INDEX idx_verification_codes_email_type ON verification_codes(email, type);

-- Initialize authorized users (run after creating database)
-- INSERT OR IGNORE INTO users (id, email, created_at) VALUES
--   ('user-spoass', 'spoass@icloud.com', datetime('now')),
--   ('user-laila', 'laila.torresanz@hotmail.com', datetime('now'));