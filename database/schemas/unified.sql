-- stats47 統合データベーススキーマ
-- 認証、e-Statメタデータ、その他の機能を統合

-- ユーザー認証テーブル
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- e-Statメタデータテーブル
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

-- 統計データの履歴管理テーブル
CREATE TABLE IF NOT EXISTS estat_data_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  user_id INTEGER,
  metadata_snapshot TEXT, -- JSON形式でメタデータのスナップショット
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_estat_stats_id ON estat_metadata(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_estat_title ON estat_metadata(title);
CREATE INDEX IF NOT EXISTS idx_history_stats_id ON estat_data_history(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON estat_data_history(user_id);

-- ビュー
CREATE VIEW IF NOT EXISTS v_estat_summary AS
SELECT 
  stats_data_id,
  stat_name,
  title,
  COUNT(*) as item_count,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM estat_metadata
GROUP BY stats_data_id, stat_name, title;

-- サンプルデータ（開発用）
INSERT OR IGNORE INTO users (username, email, password_hash) VALUES
('admin', 'admin@stats47.local', 'dummy_hash_for_development'),
('test_user', 'test@stats47.local', 'dummy_hash_for_development');

-- 統計情報のサンプル（開発用）
INSERT OR IGNORE INTO estat_metadata (stats_data_id, stat_name, title, cat01, item_name, unit) VALUES
('0000010101', '社会・人口統計体系', 'Ａ　人口・世帯', 'A140401', '0～3歳人口（男）', '人'),
('0000010101', '社会・人口統計体系', 'Ａ　人口・世帯', 'A140402', '0～3歳人口（女）', '人');
