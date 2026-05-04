-- indicators → metrics リネーム (2026-05-04)
--
-- - テーブル名: indicators → metrics
-- - FK 列: observations.indicator_id / area_profiles.indicator_id / ai_content.indicator_id
--   → metric_id
-- - taggings.taggable_type の 'indicator' 値も 'metric' に統一
--
-- "indicator" は汎用的すぎて DB にあるのが何の定義かわかりにくいため。
-- 統計指標のメトリクス定義であることを明示する metrics に変更。

PRAGMA foreign_keys = OFF;

ALTER TABLE indicators RENAME TO metrics;

ALTER TABLE observations RENAME COLUMN indicator_id TO metric_id;
ALTER TABLE area_profiles RENAME COLUMN indicator_id TO metric_id;
ALTER TABLE ai_content RENAME COLUMN indicator_id TO metric_id;
ALTER TABLE correlations RENAME COLUMN indicator_x_id TO metric_x_id;
ALTER TABLE correlations RENAME COLUMN indicator_y_id TO metric_y_id;

-- taggings の CHECK 制約を ('article', 'metric') に更新するため再作成
CREATE TABLE taggings_new (
  taggable_type TEXT NOT NULL CHECK (taggable_type IN ('article', 'metric')),
  taggable_id TEXT NOT NULL,
  tag_key TEXT NOT NULL REFERENCES tags(tag_key),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (taggable_type, taggable_id, tag_key)
);

INSERT INTO taggings_new (taggable_type, taggable_id, tag_key, created_at)
SELECT
  CASE WHEN taggable_type = 'indicator' THEN 'metric' ELSE taggable_type END,
  taggable_id, tag_key, created_at
FROM taggings;

DROP TABLE taggings;
ALTER TABLE taggings_new RENAME TO taggings;

CREATE INDEX idx_taggings_tag_key ON taggings(tag_key);
CREATE INDEX idx_taggings_entity ON taggings(taggable_type, taggable_id);

-- index リネーム (PRAGMA index_list の出力に合わせる)
DROP INDEX IF EXISTS idx_indicators_natural_key;
DROP INDEX IF EXISTS idx_indicators_key;
DROP INDEX IF EXISTS idx_indicators_area_type;
DROP INDEX IF EXISTS idx_indicators_source_id;
DROP INDEX IF EXISTS idx_indicators_category_key;
DROP INDEX IF EXISTS idx_indicators_active;
DROP INDEX IF EXISTS idx_indicators_featured;
DROP INDEX IF EXISTS idx_indicators_group_key;

CREATE UNIQUE INDEX idx_metrics_natural_key ON metrics(key, area_type);
CREATE INDEX idx_metrics_key ON metrics(key);
CREATE INDEX idx_metrics_area_type ON metrics(area_type);
CREATE INDEX idx_metrics_source_id ON metrics(source_id);
CREATE INDEX idx_metrics_category_key ON metrics(category_key);
CREATE INDEX idx_metrics_active ON metrics(is_active);
CREATE INDEX idx_metrics_featured ON metrics(is_featured);
CREATE INDEX idx_metrics_group_key ON metrics(group_key);

-- observations / area_profiles の indicator_id 系 index も rename
DROP INDEX IF EXISTS idx_observations_indicator_year;
CREATE INDEX idx_observations_metric_year ON observations(metric_id, year_code);

DROP INDEX IF EXISTS idx_area_profiles_indicator;
DROP INDEX IF EXISTS idx_area_profiles_entity_indicator_type;
CREATE INDEX idx_area_profiles_metric ON area_profiles(metric_id);
CREATE UNIQUE INDEX idx_area_profiles_entity_metric_type
  ON area_profiles(entity_type, entity_code, metric_id, type);

-- correlations の indicator_*_id index も rename
DROP INDEX IF EXISTS idx_correlations_pair_year;
DROP INDEX IF EXISTS idx_correlations_indicator_x;
DROP INDEX IF EXISTS idx_correlations_indicator_y;
CREATE UNIQUE INDEX idx_correlations_pair_year
  ON correlations(metric_x_id, metric_y_id, year_x, year_y);
CREATE INDEX idx_correlations_metric_x ON correlations(metric_x_id);
CREATE INDEX idx_correlations_metric_y ON correlations(metric_y_id);

PRAGMA foreign_keys = ON;
