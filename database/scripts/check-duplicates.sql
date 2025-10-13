-- 重複データの確認スクリプト
-- estat_metainfo テーブルの重複レコードを分析

-- 重複データの統計
SELECT
  '総レコード数' as metric,
  COUNT(*) as count
FROM estat_metainfo
UNION ALL
SELECT
  '一意な組み合わせ数' as metric,
  COUNT(DISTINCT stats_data_id || '-' || cat01) as count
FROM estat_metainfo
UNION ALL
SELECT
  '重複グループ数' as metric,
  COUNT(*) as count
FROM (
  SELECT stats_data_id, cat01
  FROM estat_metainfo
  GROUP BY stats_data_id, cat01
  HAVING COUNT(*) > 1
);

-- 重複データの詳細（上位20件）
SELECT
  stats_data_id,
  cat01,
  stat_name,
  COUNT(*) as duplicate_count,
  GROUP_CONCAT(id) as duplicate_ids,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM estat_metainfo
GROUP BY stats_data_id, cat01
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;
