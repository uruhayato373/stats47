-- Migration 0034: observations にデノーム列追加 + metric_id → metric_key 自然キー化
--
-- 変更内容:
--   - metric_id (FK to metrics.id) → metric_key (TEXT, composite FK with area_type)
--   - area_name TEXT NOT NULL DEFAULT '' (denorm: areas テーブルから)
--   - year_name TEXT NOT NULL DEFAULT '' (denorm: yearCode + metrics.year_format から計算)
--   - unit TEXT NOT NULL DEFAULT ''     (denorm: metrics.unit)
--   - PK: (metric_key, area_type, area_code, year_code)
--   - FK: (metric_key, area_type) REFERENCES metrics(key, area_type)

PRAGMA foreign_keys = OFF;

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
  FOREIGN KEY (metric_key, area_type) REFERENCES metrics(key, area_type)
);

INSERT INTO observations_new
  (metric_key, area_type, area_code, area_name, year_code, year_name, value, unit, rank, created_at)
SELECT
  m.key        AS metric_key,
  o.area_type,
  o.area_code,
  COALESCE(
    pref.name,
    city.name,
    port.port_name,
    fp.port_name,
    o.area_code
  )            AS area_name,
  o.year_code,
  CASE m.year_format
    WHEN 'fiscal'   THEN substr(o.year_code, 1, 4) || '年度'
    WHEN 'calendar' THEN substr(o.year_code, 1, 4) || '年'
    ELSE substr(o.year_code, 1, 4)
  END          AS year_name,
  o.value,
  COALESCE(m.unit, '')  AS unit,
  o.rank,
  o.created_at
FROM observations o
JOIN metrics m ON m.id = o.metric_id
LEFT JOIN prefectures  pref ON o.area_type = 'prefecture'   AND pref.code      = o.area_code
LEFT JOIN cities       city ON o.area_type = 'city'         AND city.code      = o.area_code
LEFT JOIN ports        port ON o.area_type = 'port'         AND port.port_code = o.area_code
LEFT JOIN fishing_ports fp  ON o.area_type = 'fishing_port' AND fp.port_code   = o.area_code;

DROP TABLE observations;
ALTER TABLE observations_new RENAME TO observations;

CREATE INDEX idx_observations_entity      ON observations(area_type, area_code, year_code);
CREATE INDEX idx_observations_metric_year ON observations(metric_key, year_code);

PRAGMA foreign_keys = ON;
