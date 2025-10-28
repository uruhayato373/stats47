-- ウィジェットテンプレートテーブル
-- 再利用可能なウィジェット定義を管理
-- 作成日: 2025-01-XX

CREATE TABLE IF NOT EXISTS widget_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  default_config TEXT, -- JSON形式
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_widget_templates_key 
  ON widget_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_widget_templates_type 
  ON widget_templates(widget_type);

