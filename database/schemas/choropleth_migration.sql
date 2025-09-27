-- コロプレス地図機能 データベースマイグレーション
-- 既存のデータベースに安全にchoropleth機能を追加
-- 作成日: 2025-09-27

-- マイグレーション実行ログテーブル
CREATE TABLE IF NOT EXISTS migration_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT 1,
  error_message TEXT
);

-- マイグレーション開始ログ
INSERT INTO migration_log (migration_name, success)
VALUES ('choropleth_schema_migration_start', 1);

-- PRAGMA設定（パフォーマンス最適化）
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456; -- 256MB

-- バックアップテーブル作成（既存データ保護）
-- 既存のchoropleth関連テーブルがある場合のバックアップ
CREATE TABLE IF NOT EXISTS choropleth_categories_backup AS
SELECT * FROM choropleth_categories WHERE 0=1; -- 構造のみコピー

CREATE TABLE IF NOT EXISTS choropleth_subcategories_backup AS
SELECT * FROM choropleth_subcategories WHERE 0=1; -- 構造のみコピー

-- 既存データのバックアップ（テーブルが存在する場合）
INSERT OR IGNORE INTO choropleth_categories_backup
SELECT * FROM choropleth_categories;

INSERT OR IGNORE INTO choropleth_subcategories_backup
SELECT * FROM choropleth_subcategories;

-- 新しいテーブル作成（choropleth.sqlの内容）
-- カテゴリマスターテーブル
CREATE TABLE IF NOT EXISTS choropleth_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- サブカテゴリマスターテーブル
CREATE TABLE IF NOT EXISTS choropleth_subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK(data_type IN ('numerical', 'percentage', 'rate')),
  stats_data_id TEXT,
  table_name TEXT,
  color_scheme TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  last_updated DATETIME,
  available_years TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES choropleth_categories(id) ON DELETE CASCADE
);

-- 統計データキャッシュテーブル
CREATE TABLE IF NOT EXISTS choropleth_data_cache (
  id TEXT PRIMARY KEY,
  subcategory_id TEXT NOT NULL,
  year TEXT NOT NULL,
  data JSON NOT NULL,
  metadata JSON,
  source TEXT,
  is_sample BOOLEAN DEFAULT 0,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  access_count INTEGER DEFAULT 0,
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subcategory_id) REFERENCES choropleth_subcategories(id) ON DELETE CASCADE,
  UNIQUE(subcategory_id, year)
);

-- 都道府県マスターテーブル
CREATE TABLE IF NOT EXISTS prefectures (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  capital TEXT,
  area_km2 REAL,
  population INTEGER,
  population_year TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- データアクセスログテーブル
CREATE TABLE IF NOT EXISTS choropleth_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT,
  year TEXT,
  user_ip TEXT,
  user_agent TEXT,
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subcategory_id) REFERENCES choropleth_subcategories(id) ON DELETE SET NULL
);

-- ユーザー設定テーブル
CREATE TABLE IF NOT EXISTS choropleth_user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  favorite_categories TEXT,
  favorite_subcategories TEXT,
  default_color_scheme TEXT DEFAULT 'interpolateBlues',
  default_year TEXT,
  settings JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_choropleth_categories_display_order ON choropleth_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_choropleth_categories_is_active ON choropleth_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_choropleth_subcategories_category_id ON choropleth_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_choropleth_subcategories_display_order ON choropleth_subcategories(display_order);
CREATE INDEX IF NOT EXISTS idx_choropleth_subcategories_is_active ON choropleth_subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_choropleth_subcategories_stats_data_id ON choropleth_subcategories(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_choropleth_data_cache_subcategory_year ON choropleth_data_cache(subcategory_id, year);
CREATE INDEX IF NOT EXISTS idx_choropleth_data_cache_expires_at ON choropleth_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_choropleth_data_cache_cached_at ON choropleth_data_cache(cached_at);
CREATE INDEX IF NOT EXISTS idx_choropleth_data_cache_is_sample ON choropleth_data_cache(is_sample);
CREATE INDEX IF NOT EXISTS idx_prefectures_region ON prefectures(region);
CREATE INDEX IF NOT EXISTS idx_prefectures_is_active ON prefectures(is_active);
CREATE INDEX IF NOT EXISTS idx_choropleth_access_logs_created_at ON choropleth_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_choropleth_access_logs_subcategory_id ON choropleth_access_logs(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_choropleth_access_logs_cache_hit ON choropleth_access_logs(cache_hit);
CREATE INDEX IF NOT EXISTS idx_choropleth_user_settings_user_id ON choropleth_user_settings(user_id);

-- ビュー作成
CREATE VIEW IF NOT EXISTS v_choropleth_categories_full AS
SELECT
  c.id as category_id,
  c.name as category_name,
  c.description as category_description,
  c.icon as category_icon,
  c.color as category_color,
  c.display_order as category_display_order,
  s.id as subcategory_id,
  s.name as subcategory_name,
  s.description as subcategory_description,
  s.unit,
  s.data_type,
  s.stats_data_id,
  s.table_name,
  s.color_scheme,
  s.display_order as subcategory_display_order,
  s.last_updated,
  s.available_years
FROM choropleth_categories c
LEFT JOIN choropleth_subcategories s ON c.id = s.category_id
WHERE c.is_active = 1 AND (s.is_active = 1 OR s.is_active IS NULL)
ORDER BY c.display_order, s.display_order;

CREATE VIEW IF NOT EXISTS v_choropleth_cache_stats AS
SELECT
  subcategory_id,
  COUNT(*) as cache_count,
  SUM(access_count) as total_accesses,
  MAX(last_accessed_at) as last_access,
  AVG(CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END) as cache_hit_rate,
  COUNT(CASE WHEN is_sample = 1 THEN 1 END) as sample_data_count
FROM choropleth_data_cache
GROUP BY subcategory_id;

CREATE VIEW IF NOT EXISTS v_choropleth_access_stats AS
SELECT
  DATE(created_at) as access_date,
  subcategory_id,
  COUNT(*) as access_count,
  AVG(response_time_ms) as avg_response_time,
  SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits,
  COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count
FROM choropleth_access_logs
GROUP BY DATE(created_at), subcategory_id
ORDER BY access_date DESC;

-- トリガー作成
CREATE TRIGGER IF NOT EXISTS tr_choropleth_categories_updated_at
  AFTER UPDATE ON choropleth_categories
  FOR EACH ROW
BEGIN
  UPDATE choropleth_categories
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_choropleth_subcategories_updated_at
  AFTER UPDATE ON choropleth_subcategories
  FOR EACH ROW
BEGIN
  UPDATE choropleth_subcategories
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_choropleth_data_cache_access
  AFTER UPDATE OF access_count ON choropleth_data_cache
  FOR EACH ROW
BEGIN
  UPDATE choropleth_data_cache
  SET last_accessed_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- データベース整合性チェック
PRAGMA integrity_check;

-- 統計情報更新
ANALYZE;

-- マイグレーション完了ログ
INSERT INTO migration_log (migration_name, success)
VALUES ('choropleth_schema_migration_complete', 1);

-- マイグレーション結果確認用クエリ
SELECT
  'Tables created' as check_type,
  COUNT(*) as count
FROM sqlite_master
WHERE type = 'table'
AND name LIKE 'choropleth_%'

UNION ALL

SELECT
  'Indexes created' as check_type,
  COUNT(*) as count
FROM sqlite_master
WHERE type = 'index'
AND name LIKE 'idx_choropleth_%'

UNION ALL

SELECT
  'Views created' as check_type,
  COUNT(*) as count
FROM sqlite_master
WHERE type = 'view'
AND name LIKE 'v_choropleth_%'

UNION ALL

SELECT
  'Triggers created' as check_type,
  COUNT(*) as count
FROM sqlite_master
WHERE type = 'trigger'
AND name LIKE 'tr_choropleth_%';

-- 最終確認メッセージ
SELECT
  'Choropleth database migration completed successfully!' as status,
  datetime('now') as completed_at;