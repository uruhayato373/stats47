-- Migration: Create categories and subcategories tables
-- Date: 2025-01-28
-- Description: カテゴリとサブカテゴリをデータベース化

-- 1. categories テーブル作成
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. subcategories テーブル作成
CREATE TABLE IF NOT EXISTS subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  href TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 3. インデックス作成
CREATE INDEX IF NOT EXISTS idx_categories_key ON categories(category_key);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

CREATE INDEX IF NOT EXISTS idx_subcategories_key ON subcategories(subcategory_key);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);

