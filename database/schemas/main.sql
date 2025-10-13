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
-- e-Stat APIから取得したメタデータを保存
CREATE TABLE IF NOT EXISTS estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,           -- 統計表ID
  stat_name TEXT NOT NULL,               -- 統計名
  title TEXT NOT NULL,                   -- タイトル
  cat01 TEXT,                            -- カテゴリ1
  item_name TEXT,                        -- 項目名
  unit TEXT,                             -- 単位
  ranking_key TEXT,                      -- ランキングキー（ランキングアイテムとして使用されている場合）
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 更新日時
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 作成日時
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
CREATE INDEX IF NOT EXISTS idx_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_stat_name ON estat_metainfo(stat_name);
CREATE INDEX IF NOT EXISTS idx_cat01 ON estat_metainfo(cat01);
CREATE INDEX IF NOT EXISTS idx_updated_at ON estat_metainfo(updated_at);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_ranking_key ON estat_metainfo(ranking_key);
CREATE INDEX IF NOT EXISTS idx_history_stats_id ON estat_data_history(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON estat_data_history(user_id);

-- サンプルデータの挿入は無効化（開発時は必要に応じて手動で挿入）
-- ユーザー認証サンプル（必要に応じて手動で挿入）
-- INSERT OR IGNORE INTO users (username, email, password_hash) VALUES
-- ('admin', 'admin@stats47.local', 'dummy_hash_for_development'),
-- ('test_user', 'test@stats47.local', 'dummy_hash_for_development');

-- e-Statメタデータサンプル（必要に応じて手動で挿入）
-- INSERT OR IGNORE INTO estat_metainfo (stats_data_id, stat_name, title, cat01, item_name, unit) VALUES
-- ('0003448237', '人口推計', '人口推計（2020年）', '総人口', '総人口', '人'),
-- ('0003448237', '人口推計', '人口推計（2020年）', '男性人口', '男性人口', '人'),
-- ('0003448237', '人口推計', '人口推計（2020年）', '女性人口', '女性人口', '人'),
-- ('0003448238', '世帯数調査', '世帯数調査（2020年）', '総世帯数', '総世帯数', '世帯'),
-- ('0003448238', '世帯数調査', '世帯数調査（2020年）', '単身世帯', '単身世帯', '世帯'),
-- ('0003448238', '世帯数調査', '世帯数調査（2020年）', '核家族世帯', '核家族世帯', '世帯'),
-- ('0000010101', '社会・人口統計体系', 'Ａ　人口・世帯', 'A140401', '0～3歳人口（男）', '人'),
-- ('0000010101', '社会・人口統計体系', 'Ａ　人口・世帯', 'A140402', '0～3歳人口（女）', '人');

-- テーブル情報の確認用ビュー
CREATE VIEW IF NOT EXISTS v_estat_metainfo_summary AS
SELECT 
  stats_data_id,
  stat_name,
  title,
  COUNT(*) as item_count,
  MAX(updated_at) as last_updated
FROM estat_metainfo 
GROUP BY stats_data_id, stat_name, title
ORDER BY last_updated DESC;

-- カテゴリ別統計情報のビュー
CREATE VIEW IF NOT EXISTS v_category_summary AS
SELECT 
  cat01 as category,
  COUNT(*) as count,
  COUNT(DISTINCT stats_data_id) as unique_stats_count
FROM estat_metainfo 
WHERE cat01 IS NOT NULL
GROUP BY cat01 
ORDER BY count DESC;

-- 統合サマリービュー
CREATE VIEW IF NOT EXISTS v_estat_summary AS
SELECT 
  stats_data_id,
  stat_name,
  title,
  COUNT(*) as item_count,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM estat_metainfo
GROUP BY stats_data_id, stat_name, title;

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
