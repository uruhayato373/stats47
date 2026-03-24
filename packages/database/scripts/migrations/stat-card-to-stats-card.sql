-- stat-card を stats-card に統一するマイグレーション
-- ローカル D1 (Static DB) の dashboard_components で component_type を更新し、CHECK 制約を新仕様に合わせる。

PRAGMA foreign_keys=OFF;

CREATE TABLE dashboard_components_new (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL,
  component_type TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  grid_column_span INTEGER DEFAULT 4,
  grid_column_span_tablet INTEGER,
  grid_column_span_sm INTEGER,
  grid_column_span_mobile INTEGER,
  title TEXT,
  component_props TEXT,
  ranking_link TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_link TEXT,
  data_source TEXT DEFAULT 'estat',
  chart_type TEXT,
  FOREIGN KEY (dashboard_id) REFERENCES dashboard_configs(id) ON DELETE CASCADE,
  CHECK (component_type IN ('stats-card', 'trend-chart', 'stacked-bar-chart', 'category-bar-chart', 'sunburst', 'treemap', 'bar-chart-race', 'multi-stats-card', 'definitions-card')),
  CHECK (grid_column_span BETWEEN 1 AND 12),
  CHECK (grid_column_span_tablet IS NULL OR grid_column_span_tablet BETWEEN 1 AND 12),
  CHECK (grid_column_span_sm IS NULL OR grid_column_span_sm BETWEEN 1 AND 12),
  CHECK (grid_column_span_mobile IS NULL OR grid_column_span_mobile BETWEEN 1 AND 12)
);

INSERT INTO dashboard_components_new (
  id,
  dashboard_id,
  component_type,
  display_order,
  grid_column_span,
  grid_column_span_tablet,
  grid_column_span_sm,
  grid_column_span_mobile,
  title,
  component_props,
  ranking_link,
  is_active,
  created_at,
  updated_at,
  source_link,
  data_source,
  chart_type
)
SELECT
  id,
  dashboard_id,
  CASE WHEN component_type = 'stat-card' THEN 'stats-card' ELSE component_type END,
  display_order,
  grid_column_span,
  grid_column_span_tablet,
  grid_column_span_sm,
  grid_column_span_mobile,
  title,
  component_props,
  ranking_link,
  is_active,
  created_at,
  updated_at,
  source_link,
  data_source,
  chart_type
FROM dashboard_components;

DROP TABLE dashboard_components;

ALTER TABLE dashboard_components_new RENAME TO dashboard_components;

CREATE INDEX idx_dashboard_components_dashboard_id ON dashboard_components(dashboard_id);
CREATE INDEX idx_dashboard_components_component_type ON dashboard_components(component_type);
CREATE INDEX idx_dashboard_components_display_order ON dashboard_components(display_order);
CREATE INDEX idx_dashboard_components_is_active ON dashboard_components(is_active);
CREATE INDEX idx_dashboard_components_ranking_link ON dashboard_components(ranking_link);

PRAGMA foreign_keys=ON;
