-- ダッシュボード設定テーブル
-- サブカテゴリごとのダッシュボード設定を管理
-- 作成日: 2025-01-XX

CREATE TABLE IF NOT EXISTS dashboard_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,
  area_type TEXT NOT NULL CHECK(area_type IN ('national', 'prefecture')),
  layout_type TEXT NOT NULL DEFAULT 'grid' CHECK(layout_type IN ('grid', 'stacked', 'custom')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, area_type)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_subcategory 
  ON dashboard_configs(subcategory_id, area_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_active 
  ON dashboard_configs(is_active);

