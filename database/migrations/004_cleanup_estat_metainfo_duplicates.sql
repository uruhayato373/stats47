-- estat_metainfo 重複データクリーンアップスクリプト
-- 実行日: 2025-01-13
-- 目的: 各(stats_data_id, cat01)グループで最新のupdated_atを持つレコードを残し、他を削除

-- SQLite対応版: 各グループで最新のupdated_atを持つレコードを残す
-- 一時テーブルを使わずに直接削除する方法

-- 重複レコードを削除（最新のupdated_atを持つレコード以外を削除）
DELETE FROM estat_metainfo 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id FROM estat_metainfo e1
    WHERE id = (
      SELECT id FROM estat_metainfo e2
      WHERE e2.stats_data_id = e1.stats_data_id AND e2.cat01 = e1.cat01
      ORDER BY updated_at DESC, id DESC LIMIT 1
    )
  )
);

-- 削除後の確認
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT stats_data_id || '-' || cat01) as unique_combinations
FROM estat_metainfo;

-- 重複が完全に削除されたことを確認
SELECT 
  'クリーンアップ後の重複チェック' as check_name,
  COUNT(*) as duplicate_groups
FROM (
  SELECT stats_data_id, cat01 
  FROM estat_metainfo 
  GROUP BY stats_data_id, cat01 
  HAVING COUNT(*) > 1
);