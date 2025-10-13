-- 不要テーブル削除スクリプト
-- 実行日: 2025-01-13
-- 目的: 使用されていないテーブルを削除してデータベースをクリーンアップ

-- estat_data_historyテーブル削除（データなし、使用されていない）
DROP TABLE IF EXISTS estat_data_history;

-- estat_cache_metadataテーブル削除（古いキャッシュシステム、ranking_valuesで代替）
DROP TABLE IF EXISTS estat_cache_metadata;

-- d1_migrationsテーブル削除（ファイルベースマイグレーションに移行済み）
DROP TABLE IF EXISTS d1_migrations;

-- 確認クエリ
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
