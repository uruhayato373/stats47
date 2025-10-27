-- ランキンググループ機能の追加
-- 作成日: 2025-01-XX
-- 目的: 複数のランキング項目をグループ化して管理

-- 1. ランキンググループテーブル
CREATE TABLE IF NOT EXISTS ranking_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_key TEXT UNIQUE NOT NULL,           -- 'manufacturing-output'
  subcategory_id TEXT NOT NULL,             -- 'manufacturing'
  name TEXT NOT NULL,                       -- '製造品出荷'
  description TEXT,                         -- グループの説明
  icon TEXT,                                -- グループアイコン（オプション）
  display_order INTEGER DEFAULT 0,          -- サブカテゴリ内での表示順
  is_collapsed BOOLEAN DEFAULT 0,          -- デフォルトで折り畳むか
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_ranking_groups_subcategory 
  ON ranking_groups(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ranking_groups_display_order 
  ON ranking_groups(subcategory_id, display_order);

-- 2. ランキンググループとアイテムの関連テーブル
CREATE TABLE IF NOT EXISTS ranking_group_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  ranking_item_id INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,         -- グループ内での表示順
  is_featured BOOLEAN DEFAULT 0,           -- 注目項目フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(group_id, ranking_item_id),
  FOREIGN KEY (group_id) REFERENCES ranking_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (ranking_item_id) REFERENCES ranking_items(id) ON DELETE CASCADE
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_ranking_group_items_group 
  ON ranking_group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_ranking_group_items_item 
  ON ranking_group_items(ranking_item_id);
CREATE INDEX IF NOT EXISTS idx_ranking_group_items_order 
  ON ranking_group_items(group_id, display_order);
