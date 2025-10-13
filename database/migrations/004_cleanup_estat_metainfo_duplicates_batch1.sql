-- estat_metainfo 重複データクリーンアップスクリプト（本番環境用 - バッチ処理）
-- 実行日: 2025-01-13
-- 目的: 各(stats_data_id, cat01)グループで最新のupdated_atを持つレコードを残し、他を削除
-- 本番環境用に最適化（CPU時間制限対応、バッチ処理）

-- バッチサイズを小さくして段階的に削除
-- 1回目: 1000件の重複レコードを削除
DELETE FROM estat_metainfo 
WHERE id IN (
  SELECT id FROM (
    SELECT e1.id FROM estat_metainfo e1
    WHERE EXISTS (
      SELECT 1 FROM estat_metainfo e2
      WHERE e2.stats_data_id = e1.stats_data_id 
        AND e2.cat01 = e1.cat01
        AND e2.id != e1.id
        AND (e2.updated_at > e1.updated_at 
             OR (e2.updated_at = e1.updated_at AND e2.id > e1.id))
    )
    LIMIT 1000
  )
);

-- 削除後の確認
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT stats_data_id || '-' || cat01) as unique_combinations,
  COUNT(*) - COUNT(DISTINCT stats_data_id || '-' || cat01) as remaining_duplicates
FROM estat_metainfo;
