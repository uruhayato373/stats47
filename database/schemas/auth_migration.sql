-- 認証システム用データベースマイグレーション
-- usersテーブルにroleカラムを追加、sessionsテーブルを作成
-- 作成日: 2025-01-15

-- 1. usersテーブルにroleカラムを追加
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- 2. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. セッション管理用テーブルを作成
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, -- セッションID（UUID）
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL, -- JWTトークン
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. セッションテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 5. デフォルト管理者ユーザーを作成（開発用）
-- パスワード: admin123 (bcryptでハッシュ化)
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active)
VALUES (
  'admin',
  'admin@stats47.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
  'admin',
  1
);

-- 6. 通常ユーザーサンプル（開発用）
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active)
VALUES (
  'user',
  'user@stats47.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
  'user',
  1
);
