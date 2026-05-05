PRAGMA foreign_keys = OFF;

ALTER TABLE observations RENAME TO stats;

-- インデックス再命名 (旧 idx_observations_* → idx_stats_*)
DROP INDEX IF EXISTS idx_observations_entity;
DROP INDEX IF EXISTS idx_observations_metric_year;
DROP INDEX IF EXISTS idx_observations_metric_atype;

CREATE INDEX idx_stats_entity       ON stats(area_type, area_code, year_code);
CREATE INDEX idx_stats_metric_year  ON stats(metric_key, year_code);
CREATE INDEX idx_stats_metric_atype ON stats(metric_key, area_type);

PRAGMA foreign_keys = ON;
