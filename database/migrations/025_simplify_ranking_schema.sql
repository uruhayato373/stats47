-- ランキングスキーマ簡略化
-- ranking_group_items を削除し、ranking_items に直接 group_id を追加
-- 1対多の関係に簡略化

-- ranking_items に新しいカラムを追加
ALTER TABLE ranking_items ADD COLUMN group_id INTEGER REFERENCES ranking_groups(id);
ALTER TABLE ranking_items ADD COLUMN display_order_in_group INTEGER DEFAULT 0;
ALTER TABLE ranking_items ADD COLUMN is_featured BOOLEAN DEFAULT 0;

-- ranking_group_items テーブルを削除
DROP TABLE IF EXISTS ranking_group_items;

