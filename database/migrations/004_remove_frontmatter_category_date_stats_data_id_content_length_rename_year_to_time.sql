-- frontmatter_category、date、stats_data_id、content_lengthカラムの削除とyearのtimeへのリネーム
-- 作成日: 2025-01-31
-- 説明: articlesテーブルからfrontmatter_category、date、stats_data_id、content_lengthカラムを削除し、yearカラムをtimeにリネーム

-- ============================================================================
-- カラムの削除とリネーム
-- ============================================================================

-- 1. frontmatter_categoryカラムを削除
ALTER TABLE articles DROP COLUMN frontmatter_category;

-- 2. dateカラムを削除
ALTER TABLE articles DROP COLUMN date;

-- 3. stats_data_idカラムを削除
ALTER TABLE articles DROP COLUMN stats_data_id;

-- 4. content_lengthカラムを削除
ALTER TABLE articles DROP COLUMN content_length;

-- 5. yearカラムをtimeにリネーム
-- SQLiteではALTER TABLE ... RENAME COLUMNがサポートされている
ALTER TABLE articles RENAME COLUMN year TO time;

-- ============================================================================
-- インデックスの再作成
-- ============================================================================

-- 削除されたカラムのインデックスを削除
DROP INDEX IF EXISTS idx_articles_date;
DROP INDEX IF EXISTS idx_articles_frontmatter_category;
DROP INDEX IF EXISTS idx_articles_stats_data_id;

-- yearをtimeにリネームしたため、time用のインデックスを作成
CREATE INDEX IF NOT EXISTS idx_articles_time ON articles(time DESC);

-- UNIQUE制約の更新（category, slug, year → category, slug, time）
-- SQLiteではUNIQUE制約を直接変更できないため、一時テーブルを使用して再作成
-- ただし、このマイグレーションでは既存のUNIQUE制約が(category, slug, time)として正しく機能するため、
-- 明示的な変更は不要です（既存のUNIQUE制約は自動的に更新されます）

