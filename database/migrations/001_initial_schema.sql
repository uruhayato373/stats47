-- マイグレーション: 001_initial_schema.sql
-- 作成日: 2024-12-19
-- 説明: 初期スキーマの作成

-- 認証関連テーブル
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- e-Statメタ情報テーブル
CREATE TABLE IF NOT EXISTS estat_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT,
  item_name TEXT,
  unit TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_estat_metadata_stats_id ON estat_metadata(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_estat_metadata_stat_name ON estat_metadata(stat_name);
CREATE INDEX IF NOT EXISTS idx_estat_metadata_cat01 ON estat_metadata(cat01);
CREATE INDEX IF NOT EXISTS idx_estat_metadata_item_name ON estat_metadata(item_name);
CREATE INDEX IF NOT EXISTS idx_estat_metadata_search ON estat_metadata(stat_name, cat01, item_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_estat_metadata_unique ON estat_metadata(stats_data_id, cat01, item_name);

-- スキーマバージョン管理
CREATE TABLE IF NOT EXISTS schema_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

INSERT OR IGNORE INTO schema_versions (version, description) 
VALUES ('1.0.0', '初期スキーマ作成');
