#!/usr/bin/env node
/**
 * R2 cache (values.json) から stats_prefecture へ復元する。
 * backfill 失敗で乗じて消えた年度の復活用。
 *
 * Usage: node restore-from-r2-cache.cjs <metric_key> [<metric_key> ...]
 */
const path = require("node:path");
const fs = require("node:fs");
const Database = require("better-sqlite3");

const D1_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);
const R2_ROOT = path.resolve(__dirname, "../../../.local/r2/app/ranking");

const metricKeys = process.argv.slice(2);
if (metricKeys.length === 0) {
  console.error("metric_key required");
  process.exit(1);
}

const db = new Database(D1_PATH);
for (const mk of metricKeys) {
  const file = path.join(R2_ROOT, mk, "values.json");
  if (!fs.existsSync(file)) {
    console.error(`[${mk}] R2 cache not found at ${file}`);
    continue;
  }
  const v = JSON.parse(fs.readFileSync(file, "utf8"));
  const before = db
    .prepare("SELECT COUNT(DISTINCT year_code) AS y FROM stats_prefecture WHERE metric_key = ?")
    .get(mk).y;
  const upsert = db.prepare(`
    INSERT INTO stats_prefecture (metric_key, area_code, area_name, year_code, year_name, value, unit, rank)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(metric_key, area_code, year_code) DO UPDATE SET
      value = excluded.value,
      rank = excluded.rank,
      area_name = excluded.area_name,
      year_name = excluded.year_name,
      unit = excluded.unit
  `);
  let rowsTouched = 0;
  const tx = db.transaction(() => {
    for (const part of v.partitions) {
      for (const r of part.values) {
        upsert.run(
          mk,
          r.areaCode,
          r.areaName || "",
          r.yearCode,
          r.yearName || r.yearCode,
          r.value,
          r.unit || "",
          r.rank ?? null,
        );
        rowsTouched++;
      }
    }
  });
  tx();
  const after = db
    .prepare("SELECT COUNT(DISTINCT year_code) AS y FROM stats_prefecture WHERE metric_key = ?")
    .get(mk).y;
  console.log(`[${mk}] ${before}年 → ${after}年 (${rowsTouched} rows upserted)`);
}
db.close();
