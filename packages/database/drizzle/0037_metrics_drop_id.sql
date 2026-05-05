PRAGMA foreign_keys = OFF;

-- 1-A: correlations 再構築（metric_x_id/y → metric_key_x/y TEXT）
CREATE TABLE correlations_new (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_key_x    TEXT NOT NULL REFERENCES metrics(key),
  metric_key_y    TEXT NOT NULL REFERENCES metrics(key),
  year_x          TEXT NOT NULL,
  year_y          TEXT NOT NULL,
  pearson_r       REAL NOT NULL,
  partial_r_population REAL,
  partial_r_area       REAL,
  partial_r_aging      REAL,
  partial_r_density    REAL,
  scatter_data_json TEXT NOT NULL,
  calculated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO correlations_new
  SELECT c.id, mx.key, my.key, c.year_x, c.year_y, c.pearson_r,
         c.partial_r_population, c.partial_r_area, c.partial_r_aging, c.partial_r_density,
         c.scatter_data_json, c.calculated_at
  FROM correlations c
  JOIN metrics mx ON mx.id = c.metric_x_id
  JOIN metrics my ON my.id = c.metric_y_id;
DROP TABLE correlations;
ALTER TABLE correlations_new RENAME TO correlations;

-- 1-B: ai_content 再構築（metric_id INTEGER PK → metric_key TEXT PK）
CREATE TABLE ai_content_new (
  metric_key       TEXT PRIMARY KEY REFERENCES metrics(key),
  year_code        TEXT NOT NULL,
  faq              TEXT,
  regional_analysis TEXT,
  insights         TEXT,
  ai_model         TEXT NOT NULL,
  prompt_version   TEXT NOT NULL,
  generated_at     TEXT NOT NULL,
  is_active        INTEGER DEFAULT 1,
  is_proofread     INTEGER DEFAULT 0,
  proofread_at     TEXT,
  editorial_source TEXT DEFAULT 'ai-generated',
  reviewed_by      TEXT,
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO ai_content_new
  SELECT m.key, a.year_code, a.faq, a.regional_analysis, a.insights,
         a.ai_model, a.prompt_version, a.generated_at, a.is_active, a.is_proofread,
         a.proofread_at, a.editorial_source, a.reviewed_by, a.created_at, a.updated_at
  FROM ai_content a
  JOIN metrics m ON m.id = a.metric_id;
DROP TABLE ai_content;
ALTER TABLE ai_content_new RENAME TO ai_content;

-- 1-C: area_profiles 再構築（metric_id → metric_key TEXT）
CREATE TABLE area_profiles_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  area_type   TEXT NOT NULL CHECK (area_type IN ('prefecture','city','port','fishing_port')),
  area_code   TEXT NOT NULL,
  area_name   TEXT NOT NULL,
  metric_key  TEXT NOT NULL REFERENCES metrics(key),
  year_code   TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('strength','weakness')),
  rank        INTEGER NOT NULL,
  value       REAL NOT NULL,
  unit        TEXT NOT NULL,
  percentile  REAL NOT NULL,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO area_profiles_new
  SELECT ap.id, ap.area_type, ap.area_code, ap.area_name, m.key,
         ap.year_code, ap.type, ap.rank, ap.value, ap.unit, ap.percentile, ap.created_at
  FROM area_profiles ap
  JOIN metrics m ON m.id = ap.metric_id;
DROP TABLE area_profiles;
ALTER TABLE area_profiles_new RENAME TO area_profiles;

-- 1-D: taggings を IN-PLACE 更新（CAST(id AS TEXT) → key）
UPDATE taggings
SET taggable_id = (SELECT key FROM metrics WHERE CAST(id AS TEXT) = taggings.taggable_id)
WHERE taggable_type = 'metric';

-- 1-E: metrics 再構築（id 列削除、key を PRIMARY KEY に）
CREATE TABLE metrics_new (
  key                       TEXT PRIMARY KEY,
  title                     TEXT NOT NULL,
  subtitle                  TEXT,
  description               TEXT,
  unit                      TEXT NOT NULL DEFAULT '',
  source_id                 TEXT REFERENCES sources(id),
  survey_id                 TEXT REFERENCES surveys(id),
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
  year_format               TEXT NOT NULL DEFAULT 'fiscal'
                              CHECK (year_format IN ('fiscal','calendar','plain')),
  created_at                TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at                TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO metrics_new
  SELECT key, title, subtitle, description, unit, source_id, survey_id,
         category_key, visualization_preset, visualization_config_json,
         source_config_json, value_display_config_json, calculation_config_json,
         group_key, additional_categories_json, demographic_attr, normalization_basis,
         is_active, is_featured, featured_order, seo_title, seo_description,
         year_format, created_at, updated_at
  FROM metrics;
DROP TABLE metrics;
ALTER TABLE metrics_new RENAME TO metrics;

-- 1-F: インデックス再構築
CREATE UNIQUE INDEX idx_correlations_pair_year ON correlations(metric_key_x, metric_key_y, year_x, year_y);
CREATE INDEX idx_correlations_metric_x ON correlations(metric_key_x);
CREATE INDEX idx_correlations_metric_y ON correlations(metric_key_y);
CREATE INDEX idx_correlations_year_x   ON correlations(year_x);
CREATE INDEX idx_correlations_year_y   ON correlations(year_y);

CREATE INDEX idx_ai_content_is_active    ON ai_content(is_active);
CREATE INDEX idx_ai_content_is_proofread ON ai_content(is_proofread);

CREATE UNIQUE INDEX idx_area_profiles_entity_metric_type
  ON area_profiles(area_type, area_code, metric_key, type);
CREATE INDEX idx_area_profiles_entity ON area_profiles(area_type, area_code);
CREATE INDEX idx_area_profiles_metric ON area_profiles(metric_key);
CREATE INDEX idx_area_profiles_rank   ON area_profiles(rank);

CREATE INDEX idx_metrics_source_id    ON metrics(source_id);
CREATE INDEX idx_metrics_category_key ON metrics(category_key);
CREATE INDEX idx_metrics_active       ON metrics(is_active);
CREATE INDEX idx_metrics_featured     ON metrics(is_featured);
CREATE INDEX idx_metrics_group_key    ON metrics(group_key);

PRAGMA foreign_keys = ON;
