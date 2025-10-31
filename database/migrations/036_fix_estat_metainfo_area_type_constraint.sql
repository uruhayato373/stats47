-- 036: estat_metainfoテーブルのarea_type CHECK制約を修正
-- 作成日: 2025-01-31
-- 説明: area_typeのCHECK制約を('country', 'prefecture', 'municipality')から
--      ('national', 'prefecture', 'city')に修正し、既存データも変換

-- ============================================================================
-- 1. 新しいテーブルを作成（CHECK制約を更新）
-- ============================================================================

CREATE TABLE estat_metainfo_new (
  stats_data_id TEXT PRIMARY KEY,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'national',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (area_type IN ('national', 'prefecture', 'city'))
);

-- ============================================================================
-- 2. 既存データを変換して新しいテーブルに移行
-- ============================================================================

INSERT INTO estat_metainfo_new (
  stats_data_id,
  stat_name,
  title,
  area_type,
  description,
  created_at,
  updated_at
)
SELECT
  stats_data_id,
  stat_name,
  title,
  CASE
    WHEN area_type = 'country' THEN 'national'
    WHEN area_type = 'municipality' THEN 'city'
    ELSE area_type
  END AS area_type,
  description,
  created_at,
  updated_at
FROM estat_metainfo;

-- ============================================================================
-- 3. ビューが存在する場合は削除（テーブル削除前に必要）
-- ============================================================================

DROP VIEW IF EXISTS v_estat_metainfo_summary;

-- ============================================================================
-- 4. 古いテーブルを削除
-- ============================================================================

DROP TABLE estat_metainfo;

-- ============================================================================
-- 5. 新しいテーブルをリネーム
-- ============================================================================

ALTER TABLE estat_metainfo_new RENAME TO estat_metainfo;

-- ============================================================================
-- 6. ビューを再作成
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_estat_metainfo_summary AS
SELECT 
  area_type,
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM estat_metainfo
GROUP BY area_type;

