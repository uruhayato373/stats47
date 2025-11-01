-- ============================================================================
-- マイグレーション: estat_ranking_mappings 市区町村のitem_codeを都道府県に統一
-- ============================================================================
-- 作成日: 2025-02-01
-- 説明: estat_ranking_mappingsテーブルで、都道府県（area_type='prefecture'）と
--       市区町村（area_type='city'）で同じ項目名（item_name）がある場合、
--       市区町村の項目コード（item_code）を都道府県の項目コードに統一します。
--       同じitem_nameに対して複数の都道府県レコードがある場合は、
--       最初に見つかった都道府県レコードのitem_codeを使用します。

-- ============================================================================
-- 1. 更新前の確認クエリ（コメントアウト）
-- ============================================================================
-- 影響を受けるレコード数を確認する場合は、以下のクエリを実行してください:
-- SELECT COUNT(*) FROM estat_ranking_mappings AS city
-- WHERE city.area_type = 'city'
--   AND EXISTS (
--     SELECT 1 
--     FROM estat_ranking_mappings AS prefecture
--     WHERE prefecture.item_name = city.item_name
--       AND prefecture.area_type = 'prefecture'
--   )
--   AND city.item_code != (
--     SELECT item_code 
--     FROM estat_ranking_mappings AS prefecture
--     WHERE prefecture.item_name = city.item_name
--       AND prefecture.area_type = 'prefecture'
--     LIMIT 1
--   );

-- ============================================================================
-- 2. 市区町村のitem_codeを都道府県のitem_codeに統一
-- ============================================================================
-- WHERE句: 市区町村（area_type='city'）のレコードのみを対象
-- EXISTS句: 同じitem_nameを持つ都道府県レコードが存在する場合のみ更新
-- 最後の条件: item_codeが異なる場合のみ更新（無駄な更新を避ける）

UPDATE estat_ranking_mappings AS city
SET item_code = (
  SELECT item_code 
  FROM estat_ranking_mappings AS prefecture
  WHERE prefecture.item_name = city.item_name
    AND prefecture.area_type = 'prefecture'
  LIMIT 1
),
updated_at = CURRENT_TIMESTAMP
WHERE city.area_type = 'city'
  AND EXISTS (
    SELECT 1 
    FROM estat_ranking_mappings AS prefecture
    WHERE prefecture.item_name = city.item_name
      AND prefecture.area_type = 'prefecture'
  )
  AND city.item_code != (
    SELECT item_code 
    FROM estat_ranking_mappings AS prefecture
    WHERE prefecture.item_name = city.item_name
      AND prefecture.area_type = 'prefecture'
    LIMIT 1
  );

-- ============================================================================
-- 3. 更新後の確認クエリ（コメントアウト）
-- ============================================================================
-- 更新後の市区町村レコードのitem_codeを確認する場合は、以下のクエリを実行してください:
-- SELECT city.item_name, city.item_code as city_code, prefecture.item_code as prefecture_code
-- FROM estat_ranking_mappings AS city
-- INNER JOIN estat_ranking_mappings AS prefecture
--   ON city.item_name = prefecture.item_name
-- WHERE city.area_type = 'city'
--   AND prefecture.area_type = 'prefecture'
--   AND city.item_code != prefecture.item_code
-- LIMIT 10;

