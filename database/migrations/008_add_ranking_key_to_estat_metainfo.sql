-- estat_metainfo テーブルに ranking_key カラムを追加
-- 作成日: 2025-01-13
-- 目的: ランキングアイテムとして使用されているメタデータを識別可能にする

-- 1. ranking_keyカラムを追加
ALTER TABLE estat_metainfo ADD COLUMN ranking_key TEXT;

-- 2. インデックスを追加（検索性能向上）
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_ranking_key ON estat_metainfo(ranking_key);

-- 3. 既存のranking_itemsからranking_keyを逆算して更新
UPDATE estat_metainfo
SET ranking_key = (
  SELECT ri.ranking_key
  FROM ranking_items ri
  JOIN data_source_metadata dsm ON ri.id = dsm.ranking_item_id
  WHERE dsm.data_source_id = 'estat'
    AND json_extract(dsm.metadata, '$.stats_data_id') = estat_metainfo.stats_data_id
    AND json_extract(dsm.metadata, '$.cd_cat01') = estat_metainfo.cat01
  LIMIT 1
);

-- 4. データ検証用のクエリ（実行後に確認）
-- SELECT COUNT(*) as total_records FROM estat_metainfo;
-- SELECT COUNT(*) as ranking_records FROM estat_metainfo WHERE ranking_key IS NOT NULL;
-- SELECT stats_data_id, cat01, ranking_key FROM estat_metainfo WHERE ranking_key IS NOT NULL LIMIT 10;
