-- chart_settingsとreading_timeカラムの削除
-- 作成日: 2025-01-31
-- 説明: articlesテーブルからchart_settingsとreading_timeカラムを削除

-- ============================================================================
-- chart_settingsとreading_timeカラムの削除
-- ============================================================================

-- chart_settingsカラムを削除
ALTER TABLE articles DROP COLUMN chart_settings;

-- reading_timeカラムを削除
ALTER TABLE articles DROP COLUMN reading_time;

