-- Migration: Remove id columns and rename keys for categories and subcategories
-- Date: 2025-01-30
-- Description: categoriesとsubcategoriesテーブルからidカラムを削除し、category_key/subcategory_keyをcategory_name/subcategory_nameに変更

-- 1. 既存のテーブルをバックアップ用にリネーム
CREATE TABLE IF NOT EXISTS categories_old AS SELECT * FROM categories;
CREATE TABLE IF NOT EXISTS subcategories_old AS SELECT * FROM subcategories;

-- 2. 新しいcategoriesテーブルを作成（id削除、category_key→category_name）
CREATE TABLE IF NOT EXISTS categories_new (
  category_name TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 既存データを移行（category_keyをcategory_nameとして使用）
INSERT INTO categories_new (category_name, name, icon, display_order, created_at, updated_at)
SELECT category_key, name, icon, display_order, created_at, updated_at
FROM categories_old;

-- 4. 古いcategoriesテーブルを削除
DROP TABLE IF EXISTS categories;

-- 5. 新しいcategoriesテーブルにリネーム
ALTER TABLE categories_new RENAME TO categories;

-- 6. 新しいsubcategoriesテーブルを作成（id削除、subcategory_key→subcategory_name、category_id→category_name）
CREATE TABLE IF NOT EXISTS subcategories_new (
  subcategory_name TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_name) REFERENCES categories(category_name) ON DELETE CASCADE
);

-- 7. category_idとcategory_keyのマッピング用テーブルを作成
CREATE TEMPORARY TABLE id_to_name AS
SELECT id, category_key FROM categories_old;

-- 8. 既存データを移行（subcategory_keyをsubcategory_nameに、category_idをcategory_nameに変換）
INSERT INTO subcategories_new (subcategory_name, name, category_name, display_order, created_at, updated_at)
SELECT 
  sc.subcategory_key,
  sc.name,
  c.category_key,  -- category_idをcategory_nameに変換
  sc.display_order,
  sc.created_at,
  sc.updated_at
FROM subcategories_old sc
INNER JOIN id_to_name c ON sc.category_id = c.id;

-- 9. 古いsubcategoriesテーブルを削除
DROP TABLE IF EXISTS subcategories;

-- 10. 新しいsubcategoriesテーブルにリネーム
ALTER TABLE subcategories_new RENAME TO subcategories;

-- 11. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_name);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);

-- 12. 一時テーブルを削除
DROP TABLE IF EXISTS categories_old;
DROP TABLE IF EXISTS subcategories_old;
DROP TABLE IF EXISTS id_to_name;

