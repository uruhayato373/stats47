-- observations / ai_content / area_profiles / correlations の FK が
-- テーブルリネーム後も REFERENCES indicators(id) のままだった問題を修正 (SQLite 制約)。
-- 合わせて observations.percentile (使用率 0.5%) を削除。
--
-- SQLite は ALTER TABLE MODIFY COLUMN 非対応のため、4 テーブルすべて再作成。

PRAGMA foreign_keys = OFF;

-- ─── observations ────────────────────────────────────────────────────────────

CREATE TABLE observations_new (
  metric_id INTEGER NOT NULL REFERENCES metrics(id),
  area_type TEXT NOT NULL CHECK (area_type IN ('prefecture','city','port','fishing_port')),
  area_code TEXT NOT NULL,
  year_code TEXT NOT NULL,
  value REAL,
  rank INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_id, area_type, area_code, year_code)
);

INSERT INTO observations_new (metric_id, area_type, area_code, year_code, value, rank, created_at)
  SELECT metric_id, area_type, area_code, year_code, value, rank, created_at
  FROM observations;

DROP TABLE observations;
ALTER TABLE observations_new RENAME TO observations;

CREATE INDEX idx_observations_entity ON observations(area_type, area_code, year_code);
CREATE INDEX idx_observations_metric_year ON observations(metric_id, year_code);

-- ─── ai_content ──────────────────────────────────────────────────────────────

CREATE TABLE ai_content_new (
  metric_id INTEGER PRIMARY KEY REFERENCES metrics(id),
  year_code TEXT NOT NULL,
  faq TEXT,
  regional_analysis TEXT,
  insights TEXT,
  ai_model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  is_proofread INTEGER DEFAULT 0,
  proofread_at TEXT,
  editorial_source TEXT DEFAULT 'ai-generated',
  reviewed_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ai_content_new SELECT * FROM ai_content;

DROP TABLE ai_content;
ALTER TABLE ai_content_new RENAME TO ai_content;

-- ─── area_profiles ───────────────────────────────────────────────────────────

CREATE TABLE area_profiles_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area_type TEXT NOT NULL CHECK (area_type IN ('prefecture','city','port','fishing_port')),
  area_code TEXT NOT NULL,
  area_name TEXT NOT NULL,
  metric_id INTEGER NOT NULL REFERENCES metrics(id),
  year_code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('strength','weakness')),
  rank INTEGER NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  percentile REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO area_profiles_new SELECT * FROM area_profiles;

DROP TABLE area_profiles;
ALTER TABLE area_profiles_new RENAME TO area_profiles;

CREATE UNIQUE INDEX idx_area_profiles_entity_metric_type
  ON area_profiles(area_type, area_code, metric_id, type);
CREATE INDEX idx_area_profiles_entity ON area_profiles(area_type, area_code);
CREATE INDEX idx_area_profiles_metric ON area_profiles(metric_id);
CREATE INDEX idx_area_profiles_rank ON area_profiles(rank);

-- ─── correlations ────────────────────────────────────────────────────────────

CREATE TABLE correlations_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_x_id INTEGER NOT NULL REFERENCES metrics(id),
  metric_y_id INTEGER NOT NULL REFERENCES metrics(id),
  year_x TEXT NOT NULL,
  year_y TEXT NOT NULL,
  pearson_r REAL NOT NULL,
  partial_r_population REAL,
  partial_r_area REAL,
  partial_r_aging REAL,
  partial_r_density REAL,
  scatter_data_json TEXT NOT NULL,
  calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO correlations_new SELECT * FROM correlations;

DROP TABLE correlations;
ALTER TABLE correlations_new RENAME TO correlations;

CREATE UNIQUE INDEX idx_correlations_pair_year
  ON correlations(metric_x_id, metric_y_id, year_x, year_y);
CREATE INDEX idx_correlations_metric_x ON correlations(metric_x_id);
CREATE INDEX idx_correlations_metric_y ON correlations(metric_y_id);

PRAGMA foreign_keys = ON;
