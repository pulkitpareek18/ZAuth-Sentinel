import { pool } from "./pool.js";

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
CREATE TABLE IF NOT EXISTS sentinel_users (
  id BIGSERIAL PRIMARY KEY,
  subject_id TEXT NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  rank TEXT NOT NULL DEFAULT 'Operator',
  unit TEXT NOT NULL DEFAULT 'HQ Company',
  clearance_level TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sentinel_sessions (
  session_id TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES sentinel_users(id),
  subject_id TEXT NOT NULL,
  acr TEXT,
  amr JSONB,
  uid TEXT,
  did TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sentinel_personnel (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES sentinel_users(id),
  full_name TEXT NOT NULL,
  rank TEXT NOT NULL DEFAULT 'Sepoy',
  unit TEXT NOT NULL DEFAULT 'HQ Company',
  service_number TEXT NOT NULL,
  clearance_level TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  zk_verified BOOLEAN NOT NULL DEFAULT FALSE,
  zk_verified_at TIMESTAMPTZ,
  last_checkpoint TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  photo_placeholder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sentinel_checkpoints (
  id BIGSERIAL PRIMARY KEY,
  personnel_id BIGINT NOT NULL REFERENCES sentinel_personnel(id),
  checkpoint_name TEXT NOT NULL,
  location TEXT,
  verified_by_id BIGINT REFERENCES sentinel_users(id),
  verification_method TEXT NOT NULL DEFAULT 'zk_biometric',
  acr_at_verify TEXT,
  result TEXT NOT NULL DEFAULT 'PASS',
  notes TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sentinel_armoury (
  id BIGSERIAL PRIMARY KEY,
  personnel_id BIGINT NOT NULL REFERENCES sentinel_personnel(id),
  weapon_type TEXT NOT NULL,
  weapon_serial TEXT NOT NULL,
  action TEXT NOT NULL,
  authorized_by BIGINT REFERENCES sentinel_users(id),
  acr_at_action TEXT,
  reason TEXT,
  action_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sentinel_dispatches (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES sentinel_users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  priority TEXT NOT NULL DEFAULT 'ROUTINE',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_sessions_expires ON sentinel_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sentinel_checkpoints_time ON sentinel_checkpoints (verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentinel_armoury_time ON sentinel_armoury (action_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentinel_dispatches_user ON sentinel_dispatches (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentinel_personnel_svc ON sentinel_personnel (service_number);
  `);
}
