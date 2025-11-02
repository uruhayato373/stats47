-- ranking_groups テーブルを空にするスクリプト
-- 
-- 注意: 
-- - ranking_items テーブルの group_key を NULL に更新してから削除します
-- - 外部キー制約により、参照されているグループは削除できません
-- 
-- 実行方法:
-- ローカル: npx wrangler d1 execute stats47 --local --file=./database/scripts/clear_ranking_groups.sql
-- リモート: npx wrangler d1 execute stats47 --remote --file=./database/scripts/clear_ranking_groups.sql

BEGIN TRANSACTION;

-- 1. ranking_items テーブルの group_key を NULL に更新
UPDATE ranking_items
SET 
  group_key = NULL,
  display_order_in_group = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE group_key IS NOT NULL;

-- 2. ranking_groups テーブルの全レコードを削除
DELETE FROM ranking_groups;

COMMIT;

-- 結果確認（オプション）
-- SELECT COUNT(*) as remaining_groups FROM ranking_groups;
-- SELECT COUNT(*) as items_with_group FROM ranking_items WHERE group_key IS NOT NULL;

