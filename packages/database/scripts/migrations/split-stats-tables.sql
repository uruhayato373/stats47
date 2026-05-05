-- stats テーブルを area 種別ごとの 4 テーブルに分割
-- 実行前: stats テーブルに prefecture/port/fishing_port データが存在することを確認
-- city データはほぼ 0 行のため stats_city は空テーブルとして作成

-- ─── 新テーブル作成 ──────────────────────────────────────────────────

CREATE TABLE stats_prefecture (
  metric_key      TEXT NOT NULL REFERENCES metrics(key),
  area_code       TEXT NOT NULL,
  area_name       TEXT NOT NULL DEFAULT '',
  year_code       TEXT NOT NULL,
  year_name       TEXT NOT NULL DEFAULT '',
  value           REAL,
  unit            TEXT NOT NULL DEFAULT '',
  rank            INTEGER,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_key, area_code, year_code)
);

CREATE TABLE stats_city (
  metric_key      TEXT NOT NULL REFERENCES metrics(key),
  area_code       TEXT NOT NULL,
  area_name       TEXT NOT NULL DEFAULT '',
  prefecture_code TEXT NOT NULL,
  year_code       TEXT NOT NULL,
  year_name       TEXT NOT NULL DEFAULT '',
  value           REAL,
  unit            TEXT NOT NULL DEFAULT '',
  rank            INTEGER,
  rank_pref       INTEGER,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_key, area_code, year_code)
);

CREATE TABLE stats_port (
  metric_key      TEXT NOT NULL REFERENCES metrics(key),
  area_code       TEXT NOT NULL,
  area_name       TEXT NOT NULL DEFAULT '',
  prefecture_code TEXT,
  year_code       TEXT NOT NULL,
  year_name       TEXT NOT NULL DEFAULT '',
  value           REAL,
  unit            TEXT NOT NULL DEFAULT '',
  rank            INTEGER,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_key, area_code, year_code)
);

CREATE TABLE stats_fishing_port (
  metric_key      TEXT NOT NULL REFERENCES metrics(key),
  area_code       TEXT NOT NULL,
  area_name       TEXT NOT NULL DEFAULT '',
  prefecture_code TEXT,
  year_code       TEXT NOT NULL,
  year_name       TEXT NOT NULL DEFAULT '',
  value           REAL,
  unit            TEXT NOT NULL DEFAULT '',
  rank            INTEGER,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_key, area_code, year_code)
);

-- ─── インデックス作成 ──────────────────────────────────────────────────

CREATE INDEX idx_stats_pref_entity       ON stats_prefecture(area_code, year_code);
CREATE INDEX idx_stats_pref_metric_year  ON stats_prefecture(metric_key, year_code);

CREATE INDEX idx_stats_city_entity       ON stats_city(area_code, year_code);
CREATE INDEX idx_stats_city_metric_year  ON stats_city(metric_key, year_code);
CREATE INDEX idx_stats_city_pref_code    ON stats_city(prefecture_code, metric_key, year_code);

CREATE INDEX idx_stats_port_entity       ON stats_port(area_code, year_code);
CREATE INDEX idx_stats_port_metric_year  ON stats_port(metric_key, year_code);
CREATE INDEX idx_stats_port_pref_code    ON stats_port(prefecture_code, metric_key);

CREATE INDEX idx_stats_fp_entity         ON stats_fishing_port(area_code, year_code);
CREATE INDEX idx_stats_fp_metric_year    ON stats_fishing_port(metric_key, year_code);
CREATE INDEX idx_stats_fp_pref_code      ON stats_fishing_port(prefecture_code, metric_key);

-- ─── データ移行 ──────────────────────────────────────────────────────

INSERT INTO stats_prefecture (metric_key, area_code, area_name, year_code, year_name, value, unit, rank, created_at)
  SELECT metric_key, area_code, area_name, year_code, year_name, value, unit, rank, created_at
  FROM stats WHERE area_type = 'prefecture';

INSERT INTO stats_port (metric_key, area_code, area_name, year_code, year_name, value, unit, rank, created_at)
  SELECT metric_key, area_code, area_name, year_code, year_name, value, unit, rank, created_at
  FROM stats WHERE area_type = 'port';

INSERT INTO stats_fishing_port (metric_key, area_code, area_name, year_code, year_name, value, unit, rank, created_at)
  SELECT metric_key, area_code, area_name, year_code, year_name, value, unit, rank, created_at
  FROM stats WHERE area_type = 'fishing_port';

INSERT INTO stats_city (metric_key, area_code, area_name, prefecture_code, year_code, year_name, value, unit, rank, created_at)
  SELECT metric_key, area_code, area_name, substr(area_code, 1, 2), year_code, year_name, value, unit, rank, created_at
  FROM stats WHERE area_type = 'city';
-- rank_pref は populate-ssds-city-stats.ts の次回実行時に算出して更新

-- ─── 旧テーブル削除 ──────────────────────────────────────────────────

DROP TABLE stats;
