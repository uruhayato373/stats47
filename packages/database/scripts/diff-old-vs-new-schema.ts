/**
 * 3 層化スキーマ移行 (PR-3) の並行運用検証スクリプト
 *
 * 旧 ranking_items / ranking_data と新 indicators / observations の整合性を
 * 行数 + サンプル値の両面で確認する。
 *
 * 実行方法:
 *   npx tsx packages/database/scripts/diff-old-vs-new-schema.ts
 *
 * 検証項目:
 * 1. ranking_items 行数 vs indicators 行数（ranking_items が indicators の subset であること）
 * 2. ranking_items の (key, area_type) が全て indicators に存在すること
 * 3. ranking_data 100 サンプルが observations と数値一致すること
 */

import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

function run(): CheckResult[] {
  const db = new Database(DB_PATH, { readonly: true });
  const results: CheckResult[] = [];

  // 1. 行数比較
  const rankingItemsCount = (
    db.prepare("SELECT COUNT(*) as c FROM ranking_items").get() as { c: number }
  ).c;
  const indicatorsCount = (
    db.prepare("SELECT COUNT(*) as c FROM indicators").get() as { c: number }
  ).c;
  results.push({
    name: "row count: ranking_items <= indicators",
    pass: rankingItemsCount <= indicatorsCount,
    detail: `ranking_items=${rankingItemsCount} indicators=${indicatorsCount}`,
  });

  // 2. ranking_items の (key, area_type) の indicators への包含
  const missing = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM ranking_items ri
         WHERE NOT EXISTS (
           SELECT 1 FROM indicators i
           WHERE i.key = ri.ranking_key AND i.area_type = ri.area_type
         )`
      )
      .get() as { c: number }
  ).c;
  results.push({
    name: "all ranking_items present in indicators",
    pass: missing === 0,
    detail: `missing=${missing}`,
  });

  // 3. ranking_data vs observations の値一致 (sample 100)
  const sample = db
    .prepare(
      `SELECT
         ri.ranking_key,
         rd.area_code,
         rd.year_code,
         rd.value as old_v,
         o.value_numeric as new_v
       FROM ranking_data rd
       JOIN ranking_items ri
         ON ri.ranking_key = rd.category_code AND ri.area_type = rd.area_type
       JOIN indicators i
         ON i.key = ri.ranking_key AND i.area_type = ri.area_type
       JOIN observations o
         ON o.indicator_id = i.id
        AND o.entity_type = rd.area_type
        AND o.entity_code = rd.area_code
        AND o.year_code = rd.year_code
       LIMIT 100`
    )
    .all() as Array<{
    ranking_key: string;
    area_code: string;
    year_code: string;
    old_v: number;
    new_v: number;
  }>;

  const mismatches = sample.filter(
    (r) => Math.abs((r.old_v ?? 0) - (r.new_v ?? 0)) > 0.0001
  );
  results.push({
    name: "value parity (sample 100 ranking_data vs observations)",
    pass: mismatches.length === 0,
    detail: `sampled=${sample.length} mismatches=${mismatches.length}`,
  });

  if (mismatches.length > 0) {
    console.log("--- mismatches (first 5) ---");
    mismatches.slice(0, 5).forEach((m) => console.log(JSON.stringify(m)));
  }

  db.close();
  return results;
}

const results = run();
let allPass = true;
console.log("=== 3-layer schema diff (PR-3) ===");
results.forEach((r) => {
  const mark = r.pass ? "✓" : "✗";
  console.log(`${mark} ${r.name} — ${r.detail}`);
  if (!r.pass) allPass = false;
});

process.exit(allPass ? 0 : 1);
