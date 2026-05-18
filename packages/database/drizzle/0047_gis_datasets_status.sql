-- gis_datasets に進捗管理用の status 列と監査列を追加
--
-- Phase 1 of GIS dataset management refactor (plan: stateless-stargazing-teapot).
-- status を 4 値 (available/registered/imported/deprecated) で管理し、pipeline 実行が
-- D1 を UPDATE できるようにする (last_imported_at)。registry.ts は本 migration では触らない。
--
-- 既存 42 行の backfill:
--   - is_downloaded=1 → status='imported' (39 行)
--   - is_downloaded=0 → status='registered' (3 行、default のまま)
--
-- created_at / updated_at は ADD COLUMN で CURRENT_TIMESTAMP default が使えない (SQLite 制約)
-- ため NULL 許容で追加し、既存行は strftime で backfill。新規 INSERT 時は drizzle schema 側の
-- default(sql`CURRENT_TIMESTAMP`) が適用される。

ALTER TABLE gis_datasets ADD COLUMN status TEXT NOT NULL DEFAULT 'registered'
  CHECK (status IN ('available', 'registered', 'imported', 'deprecated'));
ALTER TABLE gis_datasets ADD COLUMN last_imported_at INTEGER;
ALTER TABLE gis_datasets ADD COLUMN memo TEXT;
ALTER TABLE gis_datasets ADD COLUMN created_at TEXT;
ALTER TABLE gis_datasets ADD COLUMN updated_at TEXT;

UPDATE gis_datasets SET status = 'imported' WHERE is_downloaded = 1;
UPDATE gis_datasets SET
  created_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

CREATE INDEX IF NOT EXISTS idx_gis_datasets_status ON gis_datasets(status);
