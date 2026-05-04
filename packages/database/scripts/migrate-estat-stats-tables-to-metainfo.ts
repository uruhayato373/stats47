#!/usr/bin/env tsx
/**
 * estat_stats_tables (candidate 8,399 行) → estat_metainfo への migration (Commit 3)
 *
 * status='candidate' の行を estat_metainfo に INSERT (status='candidate', is_active=false)。
 * registered 行は既に 0023 migration で merge 済みなので ON CONFLICT DO NOTHING でスキップ。
 *
 * Usage: npx tsx packages/database/scripts/migrate-estat-stats-tables-to-metainfo.ts [--dry-run]
 */

import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";

const DRY_RUN = process.argv.includes("--dry-run");
const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
const db = new Database(dbPath);

interface CandidateRow {
  stats_data_id: string;
  title: string;
  stat_name: string | null;
  gov_org: string | null;
  category_key: string | null;
  stats_field: string | null;
  area_type: string | null;
  cycle: string | null;
  survey_date: string | null;
  updated_date: string | null;
  class_inf: string | null;
  status: string;
  created_at: string | null;
}

const beforeMetainfo = (
  db.prepare("SELECT COUNT(*) AS c FROM estat_metainfo").get() as {
    c: number;
  }
).c;
const beforeStatsTables = (
  db
    .prepare("SELECT COUNT(*) AS c FROM estat_stats_tables WHERE status = 'candidate'")
    .get() as { c: number }
).c;

console.log(`Before: estat_metainfo=${beforeMetainfo}, candidates to insert=${beforeStatsTables}`);

const candidates = db
  .prepare(
    "SELECT stats_data_id, title, stat_name, gov_org, category_key, stats_field, area_type, cycle, survey_date, updated_date, class_inf, status, created_at FROM estat_stats_tables WHERE status = 'candidate'"
  )
  .all() as CandidateRow[];

const insert = db.prepare(`
  INSERT INTO estat_metainfo (
    stats_data_id, stat_name, title, area_type,
    cycle, survey_date,
    is_active, status,
    gov_org, category_key, stats_field, class_inf, updated_date,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, 0, 'candidate', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(stats_data_id) DO NOTHING
`);

let inserted = 0;
let skipped = 0;
const txn = db.transaction(() => {
  for (const r of candidates) {
    const areaType =
      r.area_type === "national" || r.area_type === "prefecture" || r.area_type === "city"
        ? r.area_type
        : "national";
    if (!DRY_RUN) {
      const result = insert.run(
        r.stats_data_id,
        r.stat_name ?? r.title,
        r.title,
        areaType,
        r.cycle,
        r.survey_date,
        r.gov_org,
        r.category_key,
        r.stats_field,
        r.class_inf,
        r.updated_date,
        r.created_at
      );
      if (result.changes > 0) inserted++;
      else skipped++;
    }
  }
});

if (DRY_RUN) {
  console.log(`[DRY RUN] would attempt INSERT for ${candidates.length} rows`);
} else {
  txn();
  const afterMetainfo = (
    db.prepare("SELECT COUNT(*) AS c FROM estat_metainfo").get() as {
      c: number;
    }
  ).c;
  const candidateCount = (
    db
      .prepare("SELECT COUNT(*) AS c FROM estat_metainfo WHERE status = 'candidate'")
      .get() as { c: number }
  ).c;
  const registeredCount = (
    db
      .prepare("SELECT COUNT(*) AS c FROM estat_metainfo WHERE status = 'registered'")
      .get() as { c: number }
  ).c;
  console.log(
    `\n✅ inserted=${inserted}, skipped (conflict)=${skipped}\nAfter: estat_metainfo total=${afterMetainfo} (candidate=${candidateCount}, registered=${registeredCount})`
  );
  if (afterMetainfo !== beforeMetainfo + inserted) {
    throw new Error(
      `行数検証失敗: before(${beforeMetainfo}) + inserted(${inserted}) != after(${afterMetainfo})`
    );
  }
}

db.close();
