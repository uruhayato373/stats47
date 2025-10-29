-- Migration: Refactor category schema to use category_key and category_name
-- Date: 2025-01-30
-- Description: categoriesとsubcategoriesテーブルを、category_key/subcategory_keyとcategory_name/subcategory_nameを分離する構造に変更

-- ============================================================================
-- 0. 準備: マッピングテーブルとバックアップの作成
-- ============================================================================

-- 既存のテーブルをバックアップ
CREATE TABLE IF NOT EXISTS categories_old AS SELECT * FROM categories;
CREATE TABLE IF NOT EXISTS subcategories_old AS SELECT * FROM subcategories;

-- category_idからcategory_keyへのマッピングテーブルを作成（変更前のデータから）
CREATE TEMPORARY TABLE category_id_to_key AS
SELECT id, category_key FROM categories;

-- 新しいcategoriesテーブルを作成
CREATE TABLE IF NOT EXISTS categories_new (
  category_key TEXT PRIMARY KEY,
  category_name TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 既存データを移行（category_keyをcategory_keyに、nameをcategory_nameに）
-- 現在の構造: id (PK), category_key, name
-- 新しい構造: category_key (PK), category_name
INSERT INTO categories_new (category_key, category_name, icon, display_order, created_at, updated_at)
SELECT 
  category_key,     -- 既存のcategory_keyを新しい主キーに
  name AS category_name,  -- 既存のnameを新しい表示名に
  icon,
  display_order,
  created_at,
  updated_at
FROM categories_old
WHERE category_key IS NOT NULL;

-- 古いテーブルを削除
DROP TABLE IF EXISTS categories;

-- 新しいテーブルにリネーム
ALTER TABLE categories_new RENAME TO categories;

-- ============================================================================
-- 2. subcategories テーブルの変更
-- ============================================================================

-- 新しいsubcategoriesテーブルを作成
CREATE TABLE IF NOT EXISTS subcategories_new (
  subcategory_key TEXT PRIMARY KEY,
  subcategory_name TEXT NOT NULL,
  category_key TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_key) REFERENCES categories(category_key) ON DELETE CASCADE
);

-- 既存データを移行（subcategory_keyをsubcategory_keyに、nameをsubcategory_nameに、category_idをcategory_keyに変換）
-- 現在の構造: id (PK), subcategory_key, name, category_id (INTEGER)
-- 新しい構造: subcategory_key (PK), subcategory_name, category_key (TEXT)
-- category_idからcategory_keyへの変換が必要（マッピングテーブルを使用）
INSERT INTO subcategories_new (subcategory_key, subcategory_name, category_key, display_order, created_at, updated_at)
SELECT 
  sc.subcategory_key,           -- 既存のsubcategory_keyを新しい主キーに
  sc.name AS subcategory_name,  -- 既存のnameを新しい表示名に
  m.category_key,              -- category_idからcategory_keyに変換
  sc.display_order,
  sc.created_at,
  sc.updated_at
FROM subcategories_old sc
INNER JOIN category_id_to_key m ON sc.category_id = m.id
WHERE sc.subcategory_key IS NOT NULL;

-- 古いテーブルを削除
DROP TABLE IF EXISTS subcategories;

-- 新しいテーブルにリネーム
ALTER TABLE subcategories_new RENAME TO subcategories;

-- ============================================================================
-- 3. インデックスの再作成
-- ============================================================================

-- categoriesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- subcategoriesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_subcategories_category_key ON subcategories(category_key);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);

-- ============================================================================
-- 4. バックアップテーブルと一時テーブルの削除
-- ============================================================================

DROP TABLE IF EXISTS categories_old;
DROP TABLE IF EXISTS subcategories_old;
DROP TABLE IF EXISTS category_id_to_key;

