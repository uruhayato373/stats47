-- Migration: Remove ranking_values table (R2 Storage への移行)
-- Date: 2025-01-29
-- Description: 設計により ranking_values テーブルは使用せず、R2 ストレージを使用します

-- 1. ranking_values テーブルを削除
DROP TABLE IF EXISTS ranking_values;

-- 2. 関連インデックスを削除
DROP INDEX IF EXISTS idx_ranking_values_lookup;
DROP INDEX IF EXISTS idx_ranking_values_area;
DROP INDEX IF EXISTS idx_ranking_values_time;

-- 注意: ランキング値データは R2 Storage に JSON 形式で保存されます
-- パス: ranking/{ranking_key}/{area_type}/{time_code}.json
-- 
-- 例:
--   ranking/population-density/prefecture/2023.json
--   ranking/population-density/municipality/2023.json

