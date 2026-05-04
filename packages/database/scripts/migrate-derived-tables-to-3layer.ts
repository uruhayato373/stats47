/**
 * 旧派生テーブル → 新 3 層テーブル へのデータ migration (PR-5 Commit 2)
 *
 * - area_profile_rankings → area_profiles (indicator_id FK + entity_type='prefecture')
 * - correlation_analysis → correlations (indicator_x_id / indicator_y_id FK)
 * - ranking_ai_content → ai_content (indicator_id 単独 PK)
 * - ranking_tags → indicator_tags
 *
 * area_type を持たない 3 テーブル (area_profile_rankings / correlation_analysis /
 * ranking_ai_content) は area_type='prefecture' を仮定して indicators にマップする。
 * ranking_tags は (ranking_key, area_type) の area_type をそのまま使う。
 *
 * 実行方法:
 *   npx tsx packages/database/scripts/migrate-derived-tables-to-3layer.ts
 *
 * 冪等: 各 INSERT は既に新テーブルが空のときのみ動く想定。再実行する場合は手動で
 * DROP してから実行すること。
 */

import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

const db = new Database(DB_PATH);
db.pragma("foreign_keys = OFF"); // batch INSERT 中は無効化（FK は事前 JOIN で保証）

function createNewTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS area_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('prefecture','city','port','fishing_port')),
      entity_code TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      indicator_id INTEGER NOT NULL REFERENCES indicators(id),
      year_code TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('strength','weakness')),
      rank INTEGER NOT NULL,
      value_numeric REAL NOT NULL,
      unit TEXT NOT NULL,
      percentile REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_area_profiles_entity_indicator_type
      ON area_profiles (entity_type, entity_code, indicator_id, type);
    CREATE INDEX IF NOT EXISTS idx_area_profiles_entity ON area_profiles (entity_type, entity_code);
    CREATE INDEX IF NOT EXISTS idx_area_profiles_indicator ON area_profiles (indicator_id);
    CREATE INDEX IF NOT EXISTS idx_area_profiles_rank ON area_profiles (rank);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS correlations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicator_x_id INTEGER NOT NULL REFERENCES indicators(id),
      indicator_y_id INTEGER NOT NULL REFERENCES indicators(id),
      year_x TEXT NOT NULL,
      year_y TEXT NOT NULL,
      pearson_r REAL NOT NULL,
      partial_r_population REAL,
      partial_r_area REAL,
      partial_r_aging REAL,
      partial_r_density REAL,
      scatter_data_json TEXT NOT NULL,
      calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_correlations_pair_year
      ON correlations (indicator_x_id, indicator_y_id, year_x, year_y);
    CREATE INDEX IF NOT EXISTS idx_correlations_indicator_x ON correlations (indicator_x_id);
    CREATE INDEX IF NOT EXISTS idx_correlations_indicator_y ON correlations (indicator_y_id);
    CREATE INDEX IF NOT EXISTS idx_correlations_year_x ON correlations (year_x);
    CREATE INDEX IF NOT EXISTS idx_correlations_year_y ON correlations (year_y);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_content (
      indicator_id INTEGER PRIMARY KEY REFERENCES indicators(id),
      year_code TEXT NOT NULL,
      faq TEXT,
      regional_analysis TEXT,
      insights TEXT,
      ai_model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_proofread INTEGER DEFAULT 0,
      proofread_at TEXT,
      editorial_source TEXT DEFAULT 'ai-generated',
      reviewed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ai_content_is_active ON ai_content (is_active);
    CREATE INDEX IF NOT EXISTS idx_ai_content_is_proofread ON ai_content (is_proofread);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS indicator_tags (
      indicator_id INTEGER NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
      tag_key TEXT NOT NULL REFERENCES tags(tag_key),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (indicator_id, tag_key)
    );
    CREATE INDEX IF NOT EXISTS idx_indicator_tags_tag_key ON indicator_tags (tag_key);
    CREATE INDEX IF NOT EXISTS idx_indicator_tags_indicator ON indicator_tags (indicator_id);
  `);
}

function migrateAreaProfiles(): number {
  const result = db.prepare(`
    INSERT INTO area_profiles (entity_type, entity_code, entity_name, indicator_id, year_code, type, rank, value_numeric, unit, percentile, created_at)
    SELECT 'prefecture', apr.area_code, apr.area_name, i.id, apr.year, apr.type, apr.rank, apr.value, apr.unit, apr.percentile, apr.created_at
    FROM area_profile_rankings apr
    JOIN indicators i ON i.key = apr.ranking_key AND i.area_type = 'prefecture'
  `).run();
  return result.changes;
}

function migrateCorrelations(): number {
  const result = db.prepare(`
    INSERT INTO correlations (indicator_x_id, indicator_y_id, year_x, year_y, pearson_r, partial_r_population, partial_r_area, partial_r_aging, partial_r_density, scatter_data_json, calculated_at)
    SELECT ix.id, iy.id, ca.year_x, ca.year_y, ca.pearson_r, ca.partial_r_population, ca.partial_r_area, ca.partial_r_aging, ca.partial_r_density, ca.scatter_data, ca.calculated_at
    FROM correlation_analysis ca
    JOIN indicators ix ON ix.key = ca.ranking_key_x AND ix.area_type = 'prefecture'
    JOIN indicators iy ON iy.key = ca.ranking_key_y AND iy.area_type = 'prefecture'
  `).run();
  return result.changes;
}

function migrateAiContent(): number {
  const result = db.prepare(`
    INSERT INTO ai_content (indicator_id, year_code, faq, regional_analysis, insights, ai_model, prompt_version, generated_at, is_active, is_proofread, proofread_at, editorial_source, reviewed_by, created_at, updated_at)
    SELECT i.id, rac.year_code, rac.faq, rac.regional_analysis, rac.insights, rac.ai_model, rac.prompt_version, rac.generated_at, rac.is_active, rac.is_proofread, rac.proofread_at, rac.editorial_source, rac.reviewed_by, rac.created_at, rac.updated_at
    FROM ranking_ai_content rac
    JOIN indicators i ON i.key = rac.ranking_key AND i.area_type = rac.area_type
  `).run();
  return result.changes;
}

function migrateIndicatorTags(): number {
  const result = db.prepare(`
    INSERT INTO indicator_tags (indicator_id, tag_key, created_at)
    SELECT i.id, rt.tag_key, rt.created_at
    FROM ranking_tags rt
    JOIN indicators i ON i.key = rt.ranking_key AND i.area_type = rt.area_type
  `).run();
  return result.changes;
}

console.log("=== 3 層派生テーブル migration 開始 ===");

createNewTables();
console.log("✓ 新テーブル CREATE 完了");

const apCount = migrateAreaProfiles();
console.log(`area_profiles: ${apCount} 行 INSERT (旧 area_profile_rankings: 17,678)`);

const corrCount = migrateCorrelations();
console.log(`correlations: ${corrCount} 行 INSERT (旧 correlation_analysis: 1,674,544)`);

const aiCount = migrateAiContent();
console.log(`ai_content: ${aiCount} 行 INSERT (旧 ranking_ai_content: 1,943, orphan 2 行 skip)`);

const tagCount = migrateIndicatorTags();
console.log(`indicator_tags: ${tagCount} 行 INSERT (旧 ranking_tags: 3,638)`);

db.close();

console.log("=== 完了 ===");
