PRAGMA foreign_keys = OFF;

-- page_components + page_component_assignments を統合した新テーブル
CREATE TABLE "page_components_new" (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  page_type               TEXT NOT NULL,
  page_key                TEXT NOT NULL,
  chart_key               TEXT NOT NULL,
  section                 TEXT,
  sort_order              INTEGER DEFAULT 0,
  component_type          TEXT NOT NULL,
  title                   TEXT NOT NULL,
  component_props         TEXT NOT NULL,
  source_name             TEXT,
  source_link             TEXT,
  ranking_link            TEXT,
  tags                    TEXT,
  grid_column_span        INTEGER DEFAULT 12,
  grid_column_span_tablet INTEGER,
  grid_column_span_sm     INTEGER,
  data_source             TEXT DEFAULT 'ranking',
  source_id               TEXT REFERENCES sources(id),
  is_active               INTEGER DEFAULT 1,
  created_at              TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at              TEXT DEFAULT CURRENT_TIMESTAMP
);

-- assignments × components を JOIN して移行（複数ページに割り当てられた chart_key は重複行になる）
INSERT INTO page_components_new
  (page_type, page_key, chart_key, section, sort_order,
   component_type, title, component_props, source_name, source_link,
   ranking_link, tags, grid_column_span, grid_column_span_tablet,
   grid_column_span_sm, data_source, source_id, is_active,
   created_at, updated_at)
SELECT
  a.page_type, a.page_key, a.chart_key, a.section, a.sort_order,
  c.component_type, c.title, c.component_props, c.source_name, c.source_link,
  c.ranking_link, c.tags, c.grid_column_span, c.grid_column_span_tablet,
  c.grid_column_span_sm, c.data_source, c.source_id, c.is_active,
  a.created_at, c.updated_at
FROM page_component_assignments a
INNER JOIN page_components c ON a.chart_key = c.chart_key;

DROP TABLE page_component_assignments;
DROP TABLE page_components;
ALTER TABLE page_components_new RENAME TO page_components;

CREATE INDEX idx_page_components_page         ON page_components(page_type, page_key);
CREATE UNIQUE INDEX idx_page_components_unique ON page_components(page_type, page_key, chart_key);
CREATE INDEX idx_page_components_component_type ON page_components(component_type);
CREATE INDEX idx_page_components_source_id    ON page_components(source_id);

PRAGMA foreign_keys = ON;
