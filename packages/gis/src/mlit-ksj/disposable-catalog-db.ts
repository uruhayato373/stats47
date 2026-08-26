import type Database from "better-sqlite3";

/**
 * Create the disposable GIS catalog cache from its current schema contract.
 *
 * The cache is not an SSOT. A clean CI checkout must therefore be able to
 * rebuild it without relying on historical Drizzle migration journal entries.
 */
export function ensureDisposableGisCatalog(
  db: Database.Database,
): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gis_datasets (
      data_id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      name_en TEXT NOT NULL,
      category TEXT NOT NULL,
      geometry_type TEXT NOT NULL,
      coverage TEXT NOT NULL,
      license TEXT NOT NULL,
      r2_version TEXT,
      file_count INTEGER,
      total_size_bytes INTEGER,
      converted_at TEXT,
      r2_prefix TEXT,
      attribution TEXT,
      status TEXT NOT NULL DEFAULT 'registered'
        CHECK (status IN ('available', 'registered', 'imported', 'deprecated')),
      last_imported_at INTEGER,
      memo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      stats47_category TEXT,
      latest_version TEXT,
      estimated_size TEXT,
      is_ranking_target INTEGER NOT NULL DEFAULT 0,
      ranking_config TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_gis_datasets_status
      ON gis_datasets(status);
    CREATE INDEX IF NOT EXISTS idx_gis_datasets_ranking_target
      ON gis_datasets(is_ranking_target);
  `);
}
