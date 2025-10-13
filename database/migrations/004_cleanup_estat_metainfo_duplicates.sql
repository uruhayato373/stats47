-- 重複データのクリーンアップ
-- estat_metainfo テーブルから重複レコードを削除
-- 各 (stats_data_id, cat01) グループで最新の updated_at を持つレコードのみを残す

-- ステップ1: 残すべきレコードのIDを一時テーブルに保存
CREATE TEMP TABLE IF NOT EXISTS keep_ids AS
SELECT id
FROM estat_metainfo e1
WHERE id = (
  SELECT id
  FROM estat_metainfo e2
  WHERE e2.stats_data_id = e1.stats_data_id
    AND (e2.cat01 = e1.cat01 OR (e2.cat01 IS NULL AND e1.cat01 IS NULL))
  ORDER BY updated_at DESC, id DESC
  LIMIT 1
);

-- ステップ2: 削除前の統計情報
SELECT
  'クリーンアップ前' as phase,
  COUNT(*) as total_records,
  COUNT(DISTINCT stats_data_id || '-' || COALESCE(cat01, 'NULL')) as unique_combinations,
  COUNT(*) - COUNT(DISTINCT stats_data_id || '-' || COALESCE(cat01, 'NULL')) as will_be_deleted
FROM estat_metainfo;

-- ステップ3: keep_idsにないレコードを削除
DELETE FROM estat_metainfo
WHERE id NOT IN (SELECT id FROM keep_ids);

-- ステップ4: 一時テーブルを削除
DROP TABLE IF EXISTS keep_ids;

-- ステップ5: 削除後の確認
SELECT
  'クリーンアップ後' as phase,
  COUNT(*) as total_records,
  COUNT(DISTINCT stats_data_id || '-' || COALESCE(cat01, 'NULL')) as unique_combinations,
  CASE
    WHEN COUNT(*) = COUNT(DISTINCT stats_data_id || '-' || COALESCE(cat01, 'NULL'))
    THEN '✅ 重複なし'
    ELSE '❌ まだ重複あり'
  END as status
FROM estat_metainfo;

-- ステップ6: 重複チェック（0件であることを確認）
SELECT
  stats_data_id,
  cat01,
  COUNT(*) as count
FROM estat_metainfo
GROUP BY stats_data_id, cat01
HAVING COUNT(*) > 1;
