-- データベーススキーマ リファクタリング - フェーズ5: 旧テーブルの削除
-- 作成日: 2025-01-13
-- 目的: 旧テーブルをバックアップして削除し、新テーブルを正式化

-- 1. 旧テーブルのバックアップ
ALTER TABLE ranking_items RENAME TO ranking_items_old_backup;
ALTER TABLE estat_ranking_values RENAME TO estat_ranking_values_old_backup;

-- 2. 新テーブルの正式化
ALTER TABLE ranking_items_new RENAME TO ranking_items;

-- 3. 旧APIエンドポイントで使用されていたテーブルの確認
-- 以下のテーブルは削除しない（他の機能で使用中）:
-- - ranking_visualizations (ランキング設定で使用)
-- - subcategory_configs (サブカテゴリ設定で使用)

-- 4. インデックスの再作成（新テーブル名に合わせて）
DROP INDEX IF EXISTS idx_ranking_items_new_data_source;
DROP INDEX IF EXISTS idx_ranking_items_new_active;

-- インデックスが既に存在する場合はスキップ
-- CREATE INDEX IF NOT EXISTS idx_ranking_items_data_source ON ranking_items(data_source_id);
-- CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);

-- 5. 外部キー制約の確認
-- ranking_items テーブルの外部キー制約を確認
PRAGMA foreign_key_check;

-- 6. データ整合性の最終確認
SELECT 
  'ranking_items' as table_name,
  COUNT(*) as count
FROM ranking_items;

SELECT 
  'ranking_values' as table_name,
  COUNT(*) as count
FROM ranking_values;

SELECT 
  'data_source_metadata' as table_name,
  COUNT(*) as count
FROM data_source_metadata;

SELECT 
  'subcategory_ranking_items' as table_name,
  COUNT(*) as count
FROM subcategory_ranking_items;

-- 7. バックアップテーブルの確認
SELECT 
  'ranking_items_old_backup' as table_name,
  COUNT(*) as count
FROM ranking_items_old_backup;

SELECT 
  'estat_ranking_values_old_backup' as table_name,
  COUNT(*) as count
FROM estat_ranking_values_old_backup;
