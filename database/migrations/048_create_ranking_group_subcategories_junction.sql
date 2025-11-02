-- Migration: Create many-to-many relationship between ranking_groups and subcategories
-- Date: 2025-11-02
-- Description: Replace single subcategory_id with junction table to allow groups to belong to multiple subcategories

-- 外部キー制約を一時的に無効化
PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- ============================================================================
-- Step 1: Create junction table for many-to-many relationship
-- ============================================================================

CREATE TABLE IF NOT EXISTS ranking_group_subcategories (
  group_key TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_key, subcategory_id)
);

-- ============================================================================
-- Step 2: Create indexes for efficient queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ranking_group_subcategories_group ON ranking_group_subcategories(group_key);
CREATE INDEX IF NOT EXISTS idx_ranking_group_subcategories_subcategory ON ranking_group_subcategories(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ranking_group_subcategories_display_order ON ranking_group_subcategories(subcategory_id, display_order);

-- ============================================================================
-- Step 3: Migrate existing data from ranking_groups.subcategory_id
-- ============================================================================

-- Insert all existing (group_key, subcategory_id) pairs into junction table
INSERT OR IGNORE INTO ranking_group_subcategories (group_key, subcategory_id, display_order, created_at)
SELECT 
  group_key,
  subcategory_id,
  display_order,
  created_at
FROM ranking_groups
WHERE subcategory_id IS NOT NULL;

-- ============================================================================
-- Step 4: Remove subcategory_id column from ranking_groups
-- ============================================================================

-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- Step 4.1: Temporarily set ranking_items.group_key to NULL to avoid foreign key constraints
-- Create a backup of group_key mappings (store ranking_key:area_type -> group_key mapping)
CREATE TABLE IF NOT EXISTS group_key_backup AS
SELECT 
  ranking_key || ':' || area_type as item_key,
  group_key as backup_group_key
FROM ranking_items
WHERE group_key IS NOT NULL;

-- Step 4.2: Temporarily set group_key to NULL
UPDATE ranking_items SET group_key = NULL WHERE group_key IS NOT NULL;

-- Step 4.3: Create new table without subcategory_id
CREATE TABLE IF NOT EXISTS ranking_groups_new (
  group_key TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  label TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 4.4: Copy data from old table to new table (excluding subcategory_id)
INSERT OR IGNORE INTO ranking_groups_new (
  group_key,
  group_name,
  label,
  display_order,
  created_at,
  updated_at
)
SELECT 
  group_key,
  group_name,
  label,
  display_order,
  created_at,
  updated_at
FROM ranking_groups;

-- Step 4.5: Drop old table
DROP TABLE IF EXISTS ranking_groups;

-- Step 4.6: Rename new table to original name
ALTER TABLE ranking_groups_new RENAME TO ranking_groups;

-- Step 4.7: Restore group_key values in ranking_items
UPDATE ranking_items 
SET group_key = (
  SELECT backup_group_key 
  FROM group_key_backup 
  WHERE group_key_backup.item_key = ranking_items.ranking_key || ':' || ranking_items.area_type
)
WHERE EXISTS (
  SELECT 1 FROM group_key_backup 
  WHERE group_key_backup.item_key = ranking_items.ranking_key || ':' || ranking_items.area_type
);

-- Step 4.8: Drop backup table
DROP TABLE IF EXISTS group_key_backup;

COMMIT;

-- 外部キー制約を再有効化
PRAGMA foreign_keys = ON;
