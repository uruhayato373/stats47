PRAGMA foreign_keys = OFF;

-- Step 1: 重複 metrics 行を削除
-- city/port で同じ key が prefecture にも存在する場合は prefecture 版を正として残す
DELETE FROM metrics
WHERE area_type IN ('city', 'port', 'fishing_port', 'national')
  AND key IN (SELECT key FROM metrics WHERE area_type = 'prefecture');

-- Step 2: metrics を area_type なしで再作成（27列 → 26列）
CREATE TABLE metrics_new (
  id                        INTEGER PRIMARY KEY,
  key                       TEXT NOT NULL UNIQUE,
  title                     TEXT NOT NULL,
  subtitle                  TEXT,
  description               TEXT,
  unit                      TEXT NOT NULL DEFAULT '',
  source_id                 TEXT REFERENCES sources(id),
  category_key              TEXT,
  visualization_preset      TEXT,
  visualization_config_json TEXT,
  source_config_json        TEXT,
  value_display_config_json TEXT,
  calculation_config_json   TEXT,
  group_key                 TEXT,
  additional_categories_json TEXT,
  demographic_attr          TEXT,
  normalization_basis       TEXT,
  is_active                 INTEGER DEFAULT 1,
  is_featured               INTEGER DEFAULT 0,
  featured_order            INTEGER DEFAULT 0,
  seo_title                 TEXT,
  seo_description           TEXT,
  created_at                TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at                TEXT DEFAULT CURRENT_TIMESTAMP,
  survey_id                 TEXT REFERENCES surveys(id),
  year_format               TEXT NOT NULL DEFAULT 'fiscal'
                              CHECK (year_format IN ('fiscal','calendar','plain'))
);

INSERT INTO metrics_new
  SELECT id, key, title, subtitle, description, unit, source_id,
         category_key, visualization_preset, visualization_config_json,
         source_config_json, value_display_config_json, calculation_config_json,
         group_key, additional_categories_json, demographic_attr, normalization_basis,
         is_active, is_featured, featured_order, seo_title, seo_description,
         created_at, updated_at, survey_id, year_format
  FROM metrics;

DROP TABLE metrics;
ALTER TABLE metrics_new RENAME TO metrics;

-- Step 3: observations の FK を composite (metric_key, area_type) → single (metric_key) に変更
CREATE TABLE observations_new (
  metric_key TEXT NOT NULL,
  area_type  TEXT NOT NULL CHECK (area_type IN ('prefecture','city','port','fishing_port')),
  area_code  TEXT NOT NULL,
  area_name  TEXT NOT NULL DEFAULT '',
  year_code  TEXT NOT NULL,
  year_name  TEXT NOT NULL DEFAULT '',
  value      REAL,
  unit       TEXT NOT NULL DEFAULT '',
  rank       INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_key, area_type, area_code, year_code),
  FOREIGN KEY (metric_key) REFERENCES metrics(key)
);

INSERT INTO observations_new SELECT * FROM observations;
DROP TABLE observations;
ALTER TABLE observations_new RENAME TO observations;

-- Step 4: インデックス再構築
CREATE UNIQUE INDEX idx_metrics_natural_key  ON metrics(key);
CREATE INDEX idx_metrics_key                 ON metrics(key);
CREATE INDEX idx_metrics_source_id           ON metrics(source_id);
CREATE INDEX idx_metrics_category_key        ON metrics(category_key);
CREATE INDEX idx_metrics_active              ON metrics(is_active);
CREATE INDEX idx_metrics_featured            ON metrics(is_featured);
CREATE INDEX idx_metrics_group_key           ON metrics(group_key);

CREATE INDEX idx_observations_entity         ON observations(area_type, area_code, year_code);
CREATE INDEX idx_observations_metric_year    ON observations(metric_key, year_code);
CREATE INDEX idx_observations_metric_atype   ON observations(metric_key, area_type);

PRAGMA foreign_keys = ON;
