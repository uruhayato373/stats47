-- コロプレス地図機能用 簡素化データベーススキーマ
-- カテゴリ・サブカテゴリはJSONで管理、DBはキャッシュとログに集中
-- 作成日: 2025-09-27

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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
-- データキャッシュアクセス時の統計更新
CREATE TRIGGER IF NOT EXISTS tr_choropleth_data_cache_access
  AFTER UPDATE OF access_count ON choropleth_data_cache
  FOR EACH ROW
BEGIN
  UPDATE choropleth_data_cache
  SET last_accessed_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- ユーザー設定更新時のupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS tr_choropleth_user_settings_updated_at
  AFTER UPDATE ON choropleth_user_settings
  FOR EACH ROW
BEGIN
  UPDATE choropleth_user_settings
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;