-- ============================================================================
-- マイグレーション: ranking_itemsテーブルにarea_typeを追加して複合主キーに変更
-- ============================================================================
-- 作成日: 2025-01-31
-- 説明: ranking_itemsテーブルにarea_typeカラムを追加し、
--       PRIMARY KEYを(ranking_key, area_type)の複合キーに変更
--       estat_api_metadataテーブルの外部キー参照も更新

-- ============================================================================
-- 1. 既存テーブルをバックアップ
-- ============================================================================

CREATE TABLE IF NOT EXISTS ranking_items_backup AS SELECT * FROM ranking_items;

-- ============================================================================
-- 2. estat_api_metadataテーブルをバックアップ（存在する場合）
-- ============================================================================

-- estat_api_metadataテーブルが存在する場合のみバックアップ
-- テーブルが存在しない場合は空のバックアップテーブルを作成
CREATE TABLE IF NOT EXISTS estat_api_metadata_backup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,
  calculation_type TEXT NOT NULL DEFAULT 'direct',
  metadata TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. 新しいranking_itemsテーブルを作成（area_typeを含む）
-- ============================================================================

CREATE TABLE IF NOT EXISTS ranking_items_new (
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'prefecture',  -- 'prefecture' | 'city' | 'national'
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  data_source_id TEXT NOT NULL,
  group_key TEXT,
  display_order_in_group INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ranking_key, area_type),
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id),
  FOREIGN KEY (group_key) REFERENCES ranking_groups(group_key)
);

-- ============================================================================
-- 4. 既存データを新しいテーブルに移行（area_type='prefecture'として）
-- ============================================================================

-- 既存のranking_keyごとに1件のレコードのみ移行（複合キーになるため）
-- 同じranking_keyが複数存在する場合は最初の1件のみ移行
-- group_idをgroup_keyに変換（ranking_groupsテーブルから取得）
INSERT INTO ranking_items_new (
  ranking_key, area_type, label, name, description, unit, data_source_id,
  group_key, display_order_in_group, is_featured, map_color_scheme,
  map_diverging_midpoint, ranking_direction, conversion_factor,
  decimal_places, is_active, created_at, updated_at
)
SELECT 
  ri.ranking_key,
  'prefecture' as area_type,  -- 既存データには'prefecture'を設定
  ri.label,
  ri.name,
  ri.description,
  ri.unit,
  ri.data_source_id,
  rg.group_key,  -- group_idからgroup_keyに変換
  ri.display_order_in_group,
  ri.is_featured,
  ri.map_color_scheme,
  ri.map_diverging_midpoint,
  ri.ranking_direction,
  ri.conversion_factor,
  ri.decimal_places,
  ri.is_active,
  ri.created_at,
  ri.updated_at
FROM ranking_items_backup ri
LEFT JOIN ranking_groups rg ON ri.group_id = rg.id
WHERE ri.ranking_key IN (
  SELECT ranking_key FROM ranking_items_backup
  GROUP BY ranking_key
  HAVING COUNT(*) = 1
) OR ri.id IN (
  -- 重複している場合は最初の1件のみ
  SELECT MIN(id) FROM ranking_items_backup
  GROUP BY ranking_key
);

-- ============================================================================
-- 5. estat_api_metadataテーブルを削除（存在する場合、外部キー制約のため）
-- ============================================================================

DROP TABLE IF EXISTS estat_api_metadata;

-- ============================================================================
-- 6. 古いranking_itemsテーブルを削除
-- ============================================================================

DROP TABLE IF EXISTS ranking_items;

-- ============================================================================
-- 7. 新しいranking_itemsテーブルにリネーム
-- ============================================================================

ALTER TABLE ranking_items_new RENAME TO ranking_items;

-- ============================================================================
-- 8. estat_api_metadataテーブルを再作成（複合キー参照に対応）
-- ============================================================================

CREATE TABLE IF NOT EXISTS estat_api_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,  -- 'prefecture' | 'city' | 'national'
  calculation_type TEXT NOT NULL DEFAULT 'direct',  -- 'direct' | 'ratio' | 'aggregate'
  metadata TEXT NOT NULL,  -- e-Stat API固有のパラメータ（JSON形式）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_key, area_type),
  FOREIGN KEY (ranking_key, area_type) REFERENCES ranking_items(ranking_key, area_type) ON DELETE CASCADE,
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  CHECK (calculation_type IN ('direct', 'ratio', 'aggregate'))
);

-- ============================================================================
-- 9. estat_api_metadataの既存データを復元（バックアップが存在し、データがある場合のみ）
-- ============================================================================

-- バックアップから復元（ranking_keyがranking_itemsに存在するもののみ）
INSERT INTO estat_api_metadata (
  ranking_key, area_type, calculation_type, metadata, created_at, updated_at
)
SELECT 
  ranking_key,
  COALESCE(area_type, 'prefecture') as area_type,  -- 既存のarea_typeを使用（存在しない場合は'prefecture'）
  calculation_type,
  metadata,
  created_at,
  updated_at
FROM estat_api_metadata_backup
WHERE EXISTS (
  SELECT 1 FROM ranking_items 
  WHERE ranking_items.ranking_key = estat_api_metadata_backup.ranking_key
)
AND (SELECT COUNT(*) FROM estat_api_metadata_backup) > 0;

-- ============================================================================
-- 10. インデックスを再作成
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ranking_items_data_source ON ranking_items(data_source_id);
CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX IF NOT EXISTS idx_ranking_items_group_key ON ranking_items(group_key);
CREATE INDEX IF NOT EXISTS idx_ranking_items_area_type ON ranking_items(area_type);
CREATE INDEX IF NOT EXISTS idx_estat_api_metadata_ranking ON estat_api_metadata(ranking_key);
CREATE INDEX IF NOT EXISTS idx_estat_api_metadata_area ON estat_api_metadata(area_type);

-- ============================================================================
-- 11. バックアップテーブルを削除（オプション）
-- ============================================================================

-- 本番環境ではバックアップテーブルを残しておくことを推奨
-- DROP TABLE IF EXISTS ranking_items_backup;
-- DROP TABLE IF EXISTS estat_api_metadata_backup;
