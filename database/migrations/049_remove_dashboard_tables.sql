-- 049_remove_dashboard_tables.sql
-- ダッシュボード関連テーブルを削除
-- コンポーネントベースのアプローチに移行したため、データベーステーブルは不要

-- ダッシュボード関連テーブルを削除
-- 注意: FOREIGN KEY制約により、依存関係がある場合は先に削除する必要があります

-- 1. ダッシュボードウィジェットテーブルを削除（外部キー参照があるため先に削除）
DROP TABLE IF EXISTS dashboard_widgets;

-- 2. ダッシュボード設定テーブルを削除
DROP TABLE IF EXISTS dashboard_configs;

-- 3. ウィジェットテンプレートテーブルを削除
DROP TABLE IF EXISTS widget_templates;

-- 4. ダッシュボード関連インデックスを削除（テーブル削除時に自動的に削除されるが、明示的に削除）
DROP INDEX IF EXISTS idx_dashboard_configs_subcategory;
DROP INDEX IF EXISTS idx_dashboard_configs_active;
DROP INDEX IF EXISTS idx_dashboard_widgets_config;
DROP INDEX IF EXISTS idx_dashboard_widgets_order;
DROP INDEX IF EXISTS idx_dashboard_widgets_visible;
DROP INDEX IF EXISTS idx_widget_templates_key;
DROP INDEX IF EXISTS idx_widget_templates_type;

