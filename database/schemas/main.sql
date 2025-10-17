-- stats47 統合データベーススキーマ
-- 認証、e-Statメタデータ、履歴管理を統合
-- 作成日: 2024-12-19
-- 統合日: 2025-08-30

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

-- e-Stat メタデータテーブル
-- e-Stat APIから取得した統計表メタデータを保存
CREATE TABLE IF NOT EXISTS estat_metainfo (
  stats_data_id TEXT PRIMARY KEY,        -- 統計表ID（主キー）
  stat_name TEXT NOT NULL,               -- 統計調査名
  title TEXT NOT NULL,                   -- 統計表タイトル
  gov_org TEXT,                          -- 提供機関
  cycle TEXT,                            -- 調査周期
  survey_date TEXT,                      -- 調査年月
  description TEXT,                      -- 説明
  last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

-- インデックスの作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_stat_name ON estat_metainfo(stat_name);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_title ON estat_metainfo(title);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_gov_org ON estat_metainfo(gov_org);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_updated_at ON estat_metainfo(updated_at);
CREATE INDEX IF NOT EXISTS idx_history_stats_id ON estat_data_history(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON estat_data_history(user_id);

-- サンプルデータの挿入は無効化（開発時は必要に応じて手動で挿入）
-- ユーザー認証サンプル（必要に応じて手動で挿入）
-- INSERT OR IGNORE INTO users (username, email, password_hash) VALUES
-- ('admin', 'admin@stats47.local', 'dummy_hash_for_development'),
-- ('test_user', 'test@stats47.local', 'dummy_hash_for_development');

-- e-Statメタデータサンプル（必要に応じて手動で挿入）
-- INSERT OR IGNORE INTO estat_metainfo (stats_data_id, stat_name, title, gov_org, cycle, survey_date, description) VALUES
-- ('0003448237', '人口推計', '人口推計（2020年）', '総務省統計局', '年次', '2020-10', '人口推計の結果'),
-- ('0003448238', '世帯数調査', '世帯数調査（2020年）', '総務省統計局', '年次', '2020-10', '世帯数の調査結果'),
-- ('0000010101', '社会・人口統計体系', 'Ａ　人口・世帯', '総務省統計局', '年次', '2020-10', '社会・人口統計体系のデータ');

-- 統計表サマリービュー
CREATE VIEW IF NOT EXISTS v_estat_metainfo_summary AS
SELECT 
  stats_data_id,
  stat_name,
  title,
  gov_org,
  cycle,
  survey_date,
  last_fetched_at,
  created_at,
  updated_at
FROM estat_metainfo 
ORDER BY updated_at DESC;

-- ユーザーアクティビティビュー
CREATE VIEW IF NOT EXISTS v_user_activity AS
SELECT 
  u.username,
  u.email,
  u.last_login,
  COUNT(h.id) as action_count
FROM users u
LEFT JOIN estat_data_history h ON u.id = h.user_id
GROUP BY u.id, u.username, u.email, u.last_login
ORDER BY u.last_login DESC;
