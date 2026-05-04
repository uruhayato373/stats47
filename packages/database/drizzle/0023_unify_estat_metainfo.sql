-- estat_metainfo + estat_stats_tables 統一 (Commit 2)
--
-- estat_metainfo に catalog 系カラムを追加し、既存 62 行 (status='registered') に
-- estat_stats_tables からの値をマージする。
-- candidate 行 (8,399) の取り込みは migrate-estat-stats-tables-to-metainfo.ts で行う。
-- estat_stats_tables 自体の DROP は 0024 で行う。

ALTER TABLE estat_metainfo ADD COLUMN gov_org TEXT;
ALTER TABLE estat_metainfo ADD COLUMN category_key TEXT;
ALTER TABLE estat_metainfo ADD COLUMN stats_field TEXT;
ALTER TABLE estat_metainfo ADD COLUMN class_inf TEXT;
ALTER TABLE estat_metainfo ADD COLUMN updated_date TEXT;
ALTER TABLE estat_metainfo ADD COLUMN status TEXT NOT NULL DEFAULT 'registered'
  CHECK (status IN ('candidate', 'registered'));

UPDATE estat_metainfo
SET
  gov_org = (SELECT gov_org FROM estat_stats_tables s WHERE s.stats_data_id = estat_metainfo.stats_data_id),
  category_key = (SELECT category_key FROM estat_stats_tables s WHERE s.stats_data_id = estat_metainfo.stats_data_id),
  stats_field = (SELECT stats_field FROM estat_stats_tables s WHERE s.stats_data_id = estat_metainfo.stats_data_id),
  class_inf = (SELECT class_inf FROM estat_stats_tables s WHERE s.stats_data_id = estat_metainfo.stats_data_id),
  updated_date = (SELECT updated_date FROM estat_stats_tables s WHERE s.stats_data_id = estat_metainfo.stats_data_id);

CREATE INDEX IF NOT EXISTS idx_estat_metainfo_status ON estat_metainfo(status);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_category_key ON estat_metainfo(category_key);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_stats_field ON estat_metainfo(stats_field);
