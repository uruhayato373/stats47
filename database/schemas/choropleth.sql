-- コロプレス地図表示機能用データベーススキーマ
-- e-stat APIの統計データをカテゴリ・サブカテゴリに分類して管理
-- 作成日: 2025-09-27

-- カテゴリマスターテーブル
CREATE TABLE IF NOT EXISTS choropleth_categories (
  id TEXT PRIMARY KEY,                        -- カテゴリID (例: "population", "economy")
  name TEXT NOT NULL,                         -- カテゴリ名 (例: "人口・世帯", "経済・産業")
  description TEXT,                           -- カテゴリ説明
  icon TEXT,                                  -- アイコン (例: "👥", "💼")
  color TEXT,                                 -- 表示色 (例: "blue", "green")
  display_order INTEGER NOT NULL DEFAULT 0,  -- 表示順序
  is_active BOOLEAN DEFAULT 1,               -- 有効フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- サブカテゴリマスターテーブル
CREATE TABLE IF NOT EXISTS choropleth_subcategories (
  id TEXT PRIMARY KEY,                        -- サブカテゴリID (例: "population-total")
  category_id TEXT NOT NULL,                  -- 親カテゴリID
  name TEXT NOT NULL,                         -- サブカテゴリ名 (例: "人口総数")
  description TEXT,                           -- サブカテゴリ説明
  unit TEXT NOT NULL,                         -- 単位 (例: "人", "%", "千円")
  data_type TEXT NOT NULL CHECK(data_type IN ('numerical', 'percentage', 'rate')), -- データ種別
  stats_data_id TEXT,                         -- e-stat統計表ID
  table_name TEXT,                            -- 統計表名
  color_scheme TEXT,                          -- カラースキーム (例: "interpolateBlues")
  display_order INTEGER NOT NULL DEFAULT 0,  -- 表示順序
  is_active BOOLEAN DEFAULT 1,               -- 有効フラグ
  last_updated DATETIME,                      -- 最終更新日時
  available_years TEXT,                       -- 利用可能年度 (JSON配列)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES choropleth_categories(id) ON DELETE CASCADE
);

-- 統計データキャッシュテーブル
-- e-stat APIから取得したデータをキャッシュして高速化
CREATE TABLE IF NOT EXISTS choropleth_data_cache (
  id TEXT PRIMARY KEY,                        -- キャッシュID (subcategory_id + year のハッシュ)
  subcategory_id TEXT NOT NULL,              -- サブカテゴリID
  year TEXT NOT NULL,                         -- 対象年度
  data JSON NOT NULL,                         -- 統計データ (JSON形式)
  metadata JSON,                              -- メタデータ (統計情報等)
  source TEXT,                                -- データソース (例: "e-stat API")
  is_sample BOOLEAN DEFAULT 0,               -- サンプルデータフラグ
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- キャッシュ作成日時
  expires_at DATETIME,                        -- キャッシュ有効期限
  access_count INTEGER DEFAULT 0,            -- アクセス回数
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 最終アクセス日時
  FOREIGN KEY (subcategory_id) REFERENCES choropleth_subcategories(id) ON DELETE CASCADE,
  UNIQUE(subcategory_id, year)                -- 同一サブカテゴリ・年度の重複防止
);

-- 都道府県マスターテーブル
CREATE TABLE IF NOT EXISTS prefectures (
  code TEXT PRIMARY KEY,                      -- 都道府県コード (01-47)
  name TEXT NOT NULL,                         -- 都道府県名
  region TEXT,                                -- 地域区分 (例: "北海道", "東北", "関東")
  capital TEXT,                               -- 県庁所在地
  area_km2 REAL,                             -- 面積 (km²)
  population INTEGER,                         -- 人口 (最新)
  population_year TEXT,                       -- 人口データ年度
  is_active BOOLEAN DEFAULT 1,               -- 有効フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- データアクセスログテーブル
-- API利用状況の監視とパフォーマンス分析用
CREATE TABLE IF NOT EXISTS choropleth_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT,                        -- アクセスしたサブカテゴリ
  year TEXT,                                  -- 指定年度
  user_ip TEXT,                              -- ユーザーIP (匿名化)
  user_agent TEXT,                           -- ユーザーエージェント
  response_time_ms INTEGER,                   -- レスポンス時間 (ミリ秒)
  cache_hit BOOLEAN DEFAULT 0,               -- キャッシュヒットフラグ
  error_message TEXT,                         -- エラーメッセージ (エラー時)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subcategory_id) REFERENCES choropleth_subcategories(id) ON DELETE SET NULL
);

-- ユーザー設定テーブル
-- 個人用の表示設定やお気に入り機能
CREATE TABLE IF NOT EXISTS choropleth_user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,                            -- ユーザーID (users テーブル参照)
  favorite_categories TEXT,                   -- お気に入りカテゴリ (JSON配列)
  favorite_subcategories TEXT,               -- お気に入りサブカテゴリ (JSON配列)
  default_color_scheme TEXT DEFAULT 'interpolateBlues', -- デフォルトカラースキーム
  default_year TEXT,                          -- デフォルト年度
  settings JSON,                              -- その他の設定 (JSON)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)                             -- ユーザーごとに1レコード
);

-- インデックス作成（検索パフォーマンス向上）
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

-- ビュー作成（よく使用されるクエリの最適化）
-- カテゴリとサブカテゴリの結合ビュー
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

-- データキャッシュ統計ビュー
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

-- アクセスログ統計ビュー
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

-- トリガー作成（自動更新処理）
-- カテゴリ更新時のupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS tr_choropleth_categories_updated_at
  AFTER UPDATE ON choropleth_categories
  FOR EACH ROW
BEGIN
  UPDATE choropleth_categories
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- サブカテゴリ更新時のupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS tr_choropleth_subcategories_updated_at
  AFTER UPDATE ON choropleth_subcategories
  FOR EACH ROW
BEGIN
  UPDATE choropleth_subcategories
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- データキャッシュアクセス時の統計更新
CREATE TRIGGER IF NOT EXISTS tr_choropleth_data_cache_access
  AFTER UPDATE OF access_count ON choropleth_data_cache
  FOR EACH ROW
BEGIN
  UPDATE choropleth_data_cache
  SET last_accessed_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- 有効期限切れキャッシュの自動削除（期限切れから7日後）
-- 注意: SQLiteのイベントスケジューラーは限定的なため、アプリケーション側での実装を推奨

-- 初期データ挿入用のコメント
-- 実際の初期データは separate DML script で提供
-- INSERT INTO choropleth_categories (id, name, description, icon, color, display_order) VALUES ...
-- INSERT INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, stats_data_id, table_name, color_scheme, display_order) VALUES ...