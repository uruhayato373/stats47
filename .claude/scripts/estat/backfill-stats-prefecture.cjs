#!/usr/bin/env node
/**
 * 既存 metric の D1 stats_prefecture を e-Stat から全年度バックフィル。
 *
 * 既存実装 ingest-indicator.mjs は単年度向け。本スクリプトは過去事故 cdTimeFrom 禁止規約
 * (.claude/rules/estat-api.md) に従い、全年度を 1 リクエストで取得してメモリ上で 47県 × 全year に
 * 展開、upsert する。
 *
 * Usage:
 *   node .claude/scripts/estat/backfill-stats-prefecture.cjs <metric_key> [<metric_key> ...]
 *   node .claude/scripts/estat/backfill-stats-prefecture.cjs --all-priority
 *   node .claude/scripts/estat/backfill-stats-prefecture.cjs --dry-run <metric_key>
 *
 * metric_key の statsDataId / cdCat01 は metrics.source_config_json から自動取得する。
 */

const path = require("node:path");
const fs = require("node:fs");
require("dotenv").config({
  path: path.resolve(__dirname, "../../../.env.local"),
});
const Database = require("better-sqlite3");

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("NEXT_PUBLIC_ESTAT_APP_ID required");
  process.exit(1);
}

const D1_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

const PRIORITY = [
  "total-fertility-rate",
  "suicides-per-100k",
  "manufacturing-shipment-amount",
  "agricultural-output",
  "marriages-per-total-population",
  "divorces-per-total-population",
  "households-on-public-assistance",
  "traffic-accident-deaths-per-100k",
  "total-overnight-guests",
  "total-overnight-guests-foreign",
];

const PREF_AREA_RE = /^(0[1-9]|[1-3]\d|4[0-7])000$/;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { metricKeys: [], dryRun: false, sleepMs: 5000, all: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") opts.dryRun = true;
    else if (args[i] === "--all-priority") opts.all = true;
    else if (args[i] === "--sleep-ms") opts.sleepMs = parseInt(args[++i], 10);
    else opts.metricKeys.push(args[i]);
  }
  if (opts.all) opts.metricKeys = PRIORITY.slice();
  if (opts.metricKeys.length === 0) {
    console.error("metric_key を 1 個以上、または --all-priority を指定");
    process.exit(1);
  }
  return opts;
}

async function fetchAllYears(statsDataId, cdCat01) {
  const sp = new URLSearchParams({
    appId: APP_ID,
    lang: "J",
    statsDataId,
    cdCat01,
    lvArea: "2",
    limit: "100000",
  });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${sp}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const status = json.GET_STATS_DATA?.RESULT?.STATUS;
  if (status !== 0) {
    throw new Error(`API STATUS=${status}: ${json.GET_STATS_DATA?.RESULT?.ERROR_MSG}`);
  }
  return json.GET_STATS_DATA?.STATISTICAL_DATA;
}

function buildAreaMap(stat) {
  const cls = [].concat(stat.CLASS_INF?.CLASS_OBJ || []);
  const area = cls.find((o) => o["@id"] === "area");
  const m = new Map();
  if (area) for (const c of [].concat(area.CLASS || [])) m.set(c["@code"], c["@name"]);
  return m;
}

function buildTimeMap(stat) {
  const cls = [].concat(stat.CLASS_INF?.CLASS_OBJ || []);
  const time = cls.find((o) => o["@id"] === "time");
  const m = new Map();
  if (time) for (const c of [].concat(time.CLASS || [])) m.set(c["@code"], c["@name"]);
  return m;
}

function buildUnit(stat) {
  const cls = [].concat(stat.CLASS_INF?.CLASS_OBJ || []);
  for (const o of cls) {
    if (!o.CLASS) continue;
    for (const c of [].concat(o.CLASS)) {
      if (c["@unit"]) return c["@unit"];
    }
  }
  return "";
}

function pickValuesByYear(stat, areaMap, timeMap) {
  const values = [].concat(stat.DATA_INF?.VALUE || []);
  /** @type {Map<string, Array<{areaCode: string, areaName: string, yearCode: string, yearName: string, value: number, unit: string}>>} */
  const byYear = new Map();
  for (const v of values) {
    const areaCode = v["@area"];
    if (!PREF_AREA_RE.test(areaCode)) continue;
    const yearCode = v["@time"];
    const num = Number(v.$);
    if (!isFinite(num)) continue;
    const rec = {
      areaCode,
      areaName: areaMap.get(areaCode) || "",
      yearCode,
      yearName: timeMap.get(yearCode) || yearCode,
      value: num,
      unit: v["@unit"] || "",
    };
    if (!byYear.has(yearCode)) byYear.set(yearCode, []);
    byYear.get(yearCode).push(rec);
  }
  return byYear;
}

function rankWithinYear(rows) {
  rows.sort((a, b) => b.value - a.value);
  let rank = 1;
  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && rows[i].value !== rows[i - 1].value) rank = i + 1;
    rows[i].rank = rank;
  }
  return rows;
}

async function processMetric(db, metricKey, opts) {
  const row = db
    .prepare(
      "SELECT key, source_id, source_config_json FROM metrics WHERE key = ?",
    )
    .get(metricKey);
  if (!row) {
    console.error(`[${metricKey}] metric not found in D1`);
    return { metricKey, status: "not-found", before: 0, after: 0, added: 0 };
  }
  const cfg = JSON.parse(row.source_config_json || "{}");
  const { statsDataId, cdCat01 } = cfg;
  if (!statsDataId || !cdCat01) {
    console.error(`[${metricKey}] statsDataId/cdCat01 missing in source_config_json`);
    return { metricKey, status: "config-missing", before: 0, after: 0, added: 0 };
  }

  const before = db
    .prepare(
      "SELECT COUNT(DISTINCT year_code) AS y FROM stats_prefecture WHERE metric_key = ?",
    )
    .get(metricKey).y;

  console.log(`[${metricKey}] fetching e-Stat statsDataId=${statsDataId} cdCat01=${cdCat01} (before=${before}年)`);
  const stat = await fetchAllYears(statsDataId, cdCat01);
  const areaMap = buildAreaMap(stat);
  const timeMap = buildTimeMap(stat);
  const defaultUnit = buildUnit(stat);
  const byYear = pickValuesByYear(stat, areaMap, timeMap);

  let totalRows = 0;
  for (const rows of byYear.values()) {
    rankWithinYear(rows);
    totalRows += rows.length;
  }

  console.log(`[${metricKey}] received ${byYear.size}年, total ${totalRows}行`);

  if (opts.dryRun) {
    const years = [...byYear.keys()].sort();
    console.log(`[${metricKey}] DRY-RUN: would upsert years ${years[0]}..${years[years.length-1]}`);
    return { metricKey, status: "dry-run", before, after: before, added: 0, fetchedYears: byYear.size };
  }

  // Replace strategy: 削除→挿入で確実に最新値を反映
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM stats_prefecture WHERE metric_key = ?").run(metricKey);
    const ins = db.prepare(
      `INSERT INTO stats_prefecture (metric_key, area_code, area_name, year_code, year_name, value, unit, rank, source_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const rows of byYear.values()) {
      for (const r of rows) {
        ins.run(
          metricKey,
          r.areaCode,
          r.areaName,
          r.yearCode,
          r.yearName,
          r.value,
          r.unit || defaultUnit,
          r.rank,
          row.source_id,
        );
      }
    }
  });
  tx();

  const after = db
    .prepare(
      "SELECT COUNT(DISTINCT year_code) AS y FROM stats_prefecture WHERE metric_key = ?",
    )
    .get(metricKey).y;

  console.log(`[${metricKey}] ✓ done: ${before}年 → ${after}年 (+${after - before})`);
  return { metricKey, status: "ok", before, after, added: after - before };
}

async function main() {
  const opts = parseArgs();
  const db = new Database(D1_PATH);
  const results = [];
  for (let i = 0; i < opts.metricKeys.length; i++) {
    const mk = opts.metricKeys[i];
    try {
      const r = await processMetric(db, mk, opts);
      results.push(r);
    } catch (e) {
      console.error(`[${mk}] FAILED: ${e.message}`);
      results.push({ metricKey: mk, status: "error", error: e.message });
    }
    if (i < opts.metricKeys.length - 1) {
      await new Promise((r) => setTimeout(r, opts.sleepMs));
    }
  }
  db.close();
  console.log("\n## Summary");
  for (const r of results) {
    if (r.status === "ok") {
      console.log(`  ✓ ${r.metricKey}: ${r.before}年 → ${r.after}年 (+${r.added})`);
    } else {
      console.log(`  ${r.status === "dry-run" ? "🧪" : "✗"} ${r.metricKey}: ${r.status} ${r.error || ""}`);
    }
  }
}

main();
