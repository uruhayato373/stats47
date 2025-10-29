-- Migration: Remove unused category properties
-- Date: 2025-01-28
-- Description: categoriesとsubcategoriesテーブルから未使用のhrefとisActiveプロパティを削除

-- 1. subcategories テーブルから href カラムを削除
-- SQLiteではカラムの直接削除ができないため、テーブル再作成が必要

-- 1-1. 新しいsubcategoriesテーブルを作成（hrefなし）
CREATE TABLE IF NOT EXISTS subcategories_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 1-2. データを移行（is_activeカラムは除外）
INSERT INTO subcategories_new (id, subcategory_key, name, category_id, display_order, created_at, updated_at)
SELECT id, subcategory_key, name, category_id, display_order, created_at, updated_at
FROM subcategories;

-- 1-3. 古いテーブルを削除して新しいテーブルにリネーム
DROP TABLE IF EXISTS subcategories;
ALTER TABLE subcategories_new RENAME TO subcategories;

-- 2. subcategories テーブルの is_active インデックスを削除
DROP INDEX IF EXISTS idx_subcategories_active;

-- 3. categories テーブルから is_active カラムを削除
CREATE TABLE IF NOT EXISTS categories_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3-2. データを移行
INSERT INTO categories_new (id, category_key, name, icon, display_order, created_at, updated_at)
SELECT id, category_key, name, icon, display_order, created_at, updated_at
FROM categories;

-- 3-3. 古いテーブルを削除して新しいテーブルにリネーム
DROP TABLE IF EXISTS categories;
ALTER TABLE categories_new RENAME TO categories;

-- 4. categories テーブルの is_active インデックスを削除
DROP INDEX IF EXISTS idx_categories_active;

-- 5. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_categories_key ON categories(category_key);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

CREATE INDEX IF NOT EXISTS idx_subcategories_key ON subcategories(subcategory_key);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);

