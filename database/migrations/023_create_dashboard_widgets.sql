-- ダッシュボードウィジェットテーブル
-- 各ダッシュボードのウィジェット定義を管理
-- 作成日: 2025-01-XX

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_config_id INTEGER NOT NULL,
  widget_type TEXT NOT NULL CHECK(widget_type IN ('metric', 'line-chart', 'bar-chart', 'area-chart', 'table')),
  widget_key TEXT NOT NULL,
  title TEXT NOT NULL,
  config TEXT, -- JSON形式
  data_source_type TEXT NOT NULL CHECK(data_source_type IN ('ranking', 'estat', 'mock', 'custom')),
  data_source_key TEXT NOT NULL,
  grid_col_span INTEGER NOT NULL DEFAULT 1,
  grid_row_span INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_config_id) REFERENCES dashboard_configs(id) ON DELETE CASCADE,
  UNIQUE(dashboard_config_id, widget_key)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_config 
  ON dashboard_widgets(dashboard_config_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_order 
  ON dashboard_widgets(dashboard_config_id, display_order);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_visible 
  ON dashboard_widgets(is_visible);

