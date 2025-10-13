-- choropleth関連テーブル削除スクリプト
-- 実行日: 2025-01-13
-- 目的: 使用されていないchoropleth関連テーブルを削除してデータベースをクリーンアップ

-- choropleth_user_settingsテーブル削除（データなし、機能未実装）
DROP TABLE IF EXISTS choropleth_user_settings;

-- choropleth_access_logsテーブル削除（データなし、ログ機能未実装）
DROP TABLE IF EXISTS choropleth_access_logs;

-- 確認クエリ
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
