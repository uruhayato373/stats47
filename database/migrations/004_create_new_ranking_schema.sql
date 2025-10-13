-- データベーススキーマ リファクタリング - フェーズ1: 新テーブルの作成
-- 作成日: 2025-01-13
-- 目的: e-Stat専用スキーマを汎用的なマルチデータソース対応スキーマに変更

-- 1. データソーステーブル
CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_url TEXT,
  api_version TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期データの投入
INSERT INTO data_sources (id, name, description, base_url, api_version) VALUES
  ('estat', 'e-Stat', '政府統計の総合窓口', 'https://api.e-stat.go.jp', 'v3'),
  ('custom', 'カスタムデータ', 'ユーザー定義データソース', NULL, NULL);

-- 2. 新しいranking_itemsテーブル（data_source_id追加、subcategory_id削除）
CREATE TABLE IF NOT EXISTS ranking_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT UNIQUE NOT NULL,  -- UNIQUE制約を変更（subcategory_idとの組み合わせから単独に）
  label TEXT NOT NULL,               -- '総面積（除く）'
  name TEXT NOT NULL,                -- '総面積（北方地域及び竹島を除く）'
  description TEXT,                   -- 説明文
  unit TEXT NOT NULL,                -- 'ha', '人', '℃'

  -- データソース情報（分離）
  data_source_id TEXT NOT NULL,     -- 'estat', 'jma', etc.

  -- 可視化設定（ranking_items に保持）
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
);

-- インデックスの作成
CREATE INDEX idx_ranking_items_new_data_source ON ranking_items_new(data_source_id);
CREATE INDEX idx_ranking_items_new_active ON ranking_items_new(is_active);

-- 3. 多対多中間テーブル（サブカテゴリとランキング項目の関係）
CREATE TABLE IF NOT EXISTS subcategory_ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,
  ranking_item_id INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,   -- サブカテゴリ内での表示順
  is_default BOOLEAN DEFAULT 0,      -- デフォルト選択
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(subcategory_id, ranking_item_id),
  FOREIGN KEY (subcategory_id) REFERENCES subcategory_configs(id) ON DELETE CASCADE,
  FOREIGN KEY (ranking_item_id) REFERENCES ranking_items_new(id) ON DELETE CASCADE
);

-- インデックスの作成
CREATE INDEX idx_subcategory_ranking_subcategory ON subcategory_ranking_items(subcategory_id);
CREATE INDEX idx_subcategory_ranking_item ON subcategory_ranking_items(ranking_item_id);
CREATE INDEX idx_subcategory_ranking_order ON subcategory_ranking_items(subcategory_id, display_order);

-- 4. データソースメタデータテーブル（e-Stat の stats_data_id など）
CREATE TABLE IF NOT EXISTS data_source_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_item_id INTEGER NOT NULL,
  data_source_id TEXT NOT NULL,

  -- データソース固有のキー・バリューペア（JSON）
  metadata TEXT NOT NULL,  -- JSON形式
  -- 例（e-Stat）: {"stats_data_id": "0000010102", "cd_cat01": "B1101"}
  -- 例（気象庁）: {"station_id": "47662", "element_id": "temperature"}

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(ranking_item_id, data_source_id),
  FOREIGN KEY (ranking_item_id) REFERENCES ranking_items_new(id) ON DELETE CASCADE,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
);

-- インデックスの作成
CREATE INDEX idx_data_source_metadata_ranking ON data_source_metadata(ranking_item_id);
CREATE INDEX idx_data_source_metadata_source ON data_source_metadata(data_source_id);

-- 5. 新しいranking_valuesテーブル（汎用版、ranking_key使用）
CREATE TABLE IF NOT EXISTS ranking_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- ranking_key を使用（データソース非依存）
  ranking_key TEXT NOT NULL,

  -- 地域情報
  area_code TEXT NOT NULL,          -- '01000' (都道府県コード)
  area_name TEXT,                   -- '北海道'

  -- 時間情報
  time_code TEXT NOT NULL,          -- '2020000000', '2023-01-01'
  time_name TEXT,                   -- '2020年', '2023年1月'

  -- データ値
  value TEXT NOT NULL,              -- 元の値（文字列）
  numeric_value REAL,               -- 数値変換後
  display_value TEXT,                -- 表示用（フォーマット済み）
  rank INTEGER,                     -- ランキング順位

  -- システム情報
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- ranking_key ベースの UNIQUE 制約
  UNIQUE(ranking_key, time_code, area_code),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items_new(ranking_key) ON DELETE CASCADE
);

-- インデックスの作成
CREATE INDEX idx_ranking_values_lookup ON ranking_values(ranking_key, time_code);
CREATE INDEX idx_ranking_values_area ON ranking_values(area_code);
CREATE INDEX idx_ranking_values_time ON ranking_values(time_code);

-- 6. subcategory_configsテーブルの修正（default_ranking_keyをdefault_ranking_item_idに変更）
-- 注意: 既存のカラムがある場合は、まずバックアップを取る
-- ALTER TABLE subcategory_configs ADD COLUMN default_ranking_item_id INTEGER REFERENCES ranking_items_new(id);
