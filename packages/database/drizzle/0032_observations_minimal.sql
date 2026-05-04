-- Minimize observations: identity + value only
-- Remove denorm columns (entity_name, year_name, unit, category_name, value_text)
-- Rename: entity_type→area_type, entity_code→area_code, value_numeric→value
-- Same rename for area_profiles (keep area_name + unit as snapshot cache)

PRAGMA foreign_keys = OFF;

-- observations: drop denorm + rename
ALTER TABLE observations DROP COLUMN value_text;
ALTER TABLE observations RENAME COLUMN entity_type TO area_type;
ALTER TABLE observations RENAME COLUMN entity_code TO area_code;
ALTER TABLE observations RENAME COLUMN value_numeric TO value;
ALTER TABLE observations DROP COLUMN entity_name;
ALTER TABLE observations DROP COLUMN year_name;
ALTER TABLE observations DROP COLUMN unit;
ALTER TABLE observations DROP COLUMN category_name;

-- area_profiles: rename only (area_name + unit are snapshot cache, keep them)
ALTER TABLE area_profiles RENAME COLUMN entity_type TO area_type;
ALTER TABLE area_profiles RENAME COLUMN entity_code TO area_code;
ALTER TABLE area_profiles RENAME COLUMN entity_name TO area_name;
ALTER TABLE area_profiles RENAME COLUMN value_numeric TO value;

-- Rebuild indexes with new column names
DROP INDEX IF EXISTS idx_observations_entity;
DROP INDEX IF EXISTS idx_area_profiles_entity;
DROP INDEX IF EXISTS idx_area_profiles_entity_metric_type;

CREATE INDEX idx_observations_entity ON observations(area_type, area_code, year_code);
CREATE INDEX idx_area_profiles_entity ON area_profiles(area_type, area_code);
CREATE UNIQUE INDEX idx_area_profiles_entity_metric_type
  ON area_profiles(area_type, area_code, metric_id, type);

PRAGMA foreign_keys = ON;
