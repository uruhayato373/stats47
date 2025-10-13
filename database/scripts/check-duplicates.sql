-- estat_metainfo 重複データ確認スクリプト
-- 実行日: 2025-01-13

-- 重複データの統計
SELECT '総レコード数' as metric, COUNT(*) as count FROM estat_metainfo
UNION ALL
SELECT '重複グループ数', COUNT(*) FROM (
  SELECT stats_data_id, cat01 FROM estat_metainfo
  GROUP BY stats_data_id, cat01 HAVING COUNT(*) > 1
)
UNION ALL
SELECT '重複レコード数', COALESCE(SUM(duplicate_count - 1), 0) FROM (
  SELECT COUNT(*) as duplicate_count FROM estat_metainfo
  GROUP BY stats_data_id, cat01 HAVING COUNT(*) > 1
);

-- 重複データの詳細（上位20件）
SELECT 
  stats_data_id, 
  cat01, 
  COUNT(*) as count, 
  GROUP_CONCAT(id) as duplicate_ids
FROM estat_metainfo
GROUP BY stats_data_id, cat01 
HAVING COUNT(*) > 1
ORDER BY count DESC 
LIMIT 20;

-- 重複のないユニークな組み合わせ数
SELECT 
  COUNT(DISTINCT stats_data_id || '-' || cat01) as unique_combinations
FROM estat_metainfo;