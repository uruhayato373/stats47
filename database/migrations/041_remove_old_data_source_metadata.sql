-- ============================================================================
-- マイグレーション: 古いdata_source_metadataテーブルを削除
-- ============================================================================
-- 作成日: 2025-01-31
-- 説明: 古いdata_source_metadataテーブルが残っている場合、削除する
--       このテーブルは033_rename_data_source_metadata_to_estat_api_metadata.sqlで
--       estat_api_metadataにリネームされたが、何らかの理由で残っている可能性がある

-- ============================================================================
-- 1. data_source_metadataテーブルが存在する場合は削除
-- ============================================================================

-- テーブルが存在する場合のみ削除
-- SQLiteではDROP TABLE IF EXISTSを使用
DROP TABLE IF EXISTS data_source_metadata;

-- 関連するインデックスも削除
DROP INDEX IF EXISTS idx_data_source_metadata_ranking;
DROP INDEX IF EXISTS idx_data_source_metadata_source;
DROP INDEX IF EXISTS idx_data_source_metadata_area;

