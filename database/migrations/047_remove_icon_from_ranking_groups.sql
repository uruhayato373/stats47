-- Migration: Remove icon column from ranking_groups table
-- Date: 2025-11-02
-- Description: Remove icon column from ranking_groups table as it's no longer needed

BEGIN TRANSACTION;

-- ============================================================================
-- Remove icon column from ranking_groups table
-- ============================================================================

-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- Step 1: Create new table without icon column
CREATE TABLE IF NOT EXISTS ranking_groups_new (
  group_key TEXT PRIMARY KEY,
  subcategory_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  label TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data from old table to new table (excluding icon)
INSERT INTO ranking_groups_new (
  group_key,
  subcategory_id,
  group_name,
  label,
  display_order,
  created_at,
  updated_at
)
SELECT 
  group_key,
  subcategory_id,
  group_name,
  label,
  display_order,
  created_at,
  updated_at
FROM ranking_groups;

-- Step 3: Drop old table
DROP TABLE IF EXISTS ranking_groups;

-- Step 4: Rename new table to original name
ALTER TABLE ranking_groups_new RENAME TO ranking_groups;

-- Step 5: Recreate indexes (if any)
-- Note: ranking_groups doesn't have explicit indexes in the schema,
-- but if any were created, they would need to be recreated here

COMMIT;

