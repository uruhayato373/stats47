#!/usr/bin/env node
/**
 * fetch-city-local-finance.cjs
 *
 * e-Stat SSDS 市区町村版 (statsDataId=0000020204, 廃置分合処理済) から
 * local-finance 市区町村ダッシュボード用に 4 指標を取得して stats_city に投入する。
 *
 * 対象 metric_key (= 既存 prefecture 版と並列に新規作成):
 *   real-balance-ratio-city          (D2202 実質収支比率)
 *   current-balance-ratio-city       (D2203 経常収支比率)
 *   real-public-debt-service-ratio-city (D2211 実質公債費比率)
 *   future-burden-ratio-city         (D2212 将来負担比率)
 *
 * 既存 (fetch 不要):
 *   fiscal-strength-index (city, 57,613 行)
 *   per-taxpayer-taxable-income (city, 56,913 行)
 *
 * Usage:
 *   node .claude/scripts/estat/fetch-city-local-finance.cjs [--dry-run] [--limit-cat01 D2202]
 *
 * .claude/todo/05_機能バックログ.md #292+
 */

"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const Database = require("better-sqlite3");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");

// 4 cat01 → metric_key 対応
const METRICS = [
  {
    cdCat01: "D2202",
    metricKey: "real-balance-ratio-city",
    title: "実質収支比率（市町村財政）",
    unit: "％",
  },
  {
    cdCat01: "D2203",
    metricKey: "current-balance-ratio-city",
    title: "経常収支比率（市町村財政）",
    unit: "％",
  },
  {
    cdCat01: "D2211",
    metricKey: "real-public-debt-service-ratio-city",
    title: "実質公債費比率（市町村財政）",
    unit: "％",
  },
  {
    cdCat01: "D2212",
    metricKey: "future-burden-ratio-city",
    title: "将来負担比率（市町村財政）",
    unit: "％",
  },
];

const STATS_DATA_ID = "0000020204";
const SOURCE_ID = "estat:0000020204";

// ─── CLI ───
function parseArgs(argv) {
  const args = { dryRun: false, limitCat01: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--limit-cat01") args.limitCat01 = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log("Usage: fetch-city-local-finance.cjs [--dry-run] [--limit-cat01 D2202]");
      process.exit(0);
    } else throw new Error(`Unknown: ${a}`);
  }
  return args;
}

// ─── env ───
function loadAppId() {
  if (!fs.existsSync(ENV_PATH)) throw new Error(".env.local not found");
  const lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^NEXT_PUBLIC_ESTAT_APP_ID=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("NEXT_PUBLIC_ESTAT_APP_ID not set");
}

// ─── HTTP ───
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON parse failed: ${e.message}`));
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchAllForCat01(appId, cdCat01) {
  const all = [];
  let startPosition = 1;
  const limit = 100000; // max
  for (let page = 0; page < 20; page++) {
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${appId}&statsDataId=${STATS_DATA_ID}&cdCat01=${cdCat01}&limit=${limit}&startPosition=${startPosition}`;
    const data = await httpGet(url);
    const stat = data.GET_STATS_DATA?.STATISTICAL_DATA;
    if (!stat) {
      const err = data.GET_STATS_DATA?.RESULT?.ERROR_MSG || "no stat";
      throw new Error(`fetch failed: ${err}`);
    }
    const values = stat.DATA_INF?.VALUE || [];
    const arr = Array.isArray(values) ? values : [values];
    all.push(...arr);

    const resultInf = stat.RESULT_INF || {};
    const nextKey = resultInf.NEXT_KEY;
    if (!nextKey) break;
    startPosition = nextKey;
  }
  return all;
}

// ─── Area / Time normalization ───

function normalizeAreaCode(estatAreaCode) {
  // e-Stat city codes are 5 digits already (e.g., "01100" 札幌市)
  // stats47 stats_city.area_code uses same 5-digit format
  return estatAreaCode;
}

function normalizeYearCode(estatTimeCode) {
  // e-Stat time codes: 1980100000 → 1980
  // stats_city year_code: 1980
  return estatTimeCode.slice(0, 4);
}

function prefectureCodeFromArea(areaCode) {
  // First 2 digits = prefecture code (01-47)
  return areaCode.slice(0, 2);
}

// ─── DB ops ───

function ensureSource(db) {
  const existing = db.prepare(`SELECT id FROM sources WHERE id = ?`).get(SOURCE_ID);
  if (existing) return false;
  db.prepare(
    `INSERT INTO sources (id, source_kind, external_id, parent_source_id, name, organization, url)
     VALUES (?, 'estat_table', ?, 'estat', ?, ?, ?)`,
  ).run(
    SOURCE_ID,
    STATS_DATA_ID,
    "Ｄ　行政基盤（市区町村・廃置分合処理済）",
    "総務省",
    "https://www.e-stat.go.jp/dbview?sid=" + STATS_DATA_ID,
  );
  return true;
}

function ensureMetric(db, metric) {
  const existing = db
    .prepare(`SELECT key FROM metrics WHERE key = ?`)
    .get(metric.metricKey);
  if (existing) {
    return false;
  }

  // category_key を pref 版の同等 metric から拝借
  const prefEquivalent = metric.metricKey.replace(/-city$/, "");
  const ref = db
    .prepare(`SELECT category_key, survey_id, group_key FROM metrics WHERE key = ?`)
    .get(prefEquivalent);

  const categoryKey = ref?.category_key || "administrativefinancial";
  // surveys テーブル空のため FK 違反回避で NULL を入れる
  const surveyId = null;
  const groupKey = ref?.group_key || null;

  const sourceConfig = JSON.stringify({
    source: {
      name: "社会・人口統計体系（市区町村データ・廃置分合処理済）",
      url: "https://www.stat.go.jp/data/ssds/index.htm",
    },
    statsDataId: STATS_DATA_ID,
    cdCat01: metric.cdCat01,
  });

  db.prepare(
    `INSERT INTO metrics (key, title, unit, source_id, category_key, survey_id, group_key, source_config_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    metric.metricKey,
    metric.title,
    metric.unit,
    SOURCE_ID,
    categoryKey,
    surveyId,
    groupKey,
    sourceConfig,
  );
  return true;
}

function insertCityRows(db, metricKey, rows, unit, areaNameMap) {
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO stats_city
      (metric_key, area_code, area_name, prefecture_code, year_code, year_name, value, unit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const insertMany = db.transaction((items) => {
    for (const r of items) {
      stmt.run(
        metricKey,
        r.areaCode,
        r.areaName,
        r.prefectureCode,
        r.yearCode,
        r.yearName,
        r.value,
        unit,
      );
    }
  });

  // Map to stats_city row shape
  const items = rows
    .map((v) => {
      const value = parseFloat(v.$);
      if (!isFinite(value)) return null;
      const areaCode = normalizeAreaCode(v["@area"]);
      const yearCode = normalizeYearCode(v["@time"]);
      const yearName = `${yearCode}年度`;
      const prefectureCode = prefectureCodeFromArea(areaCode);
      const areaName = areaNameMap.get(areaCode) || "";
      return {
        areaCode,
        areaName,
        prefectureCode,
        yearCode,
        yearName,
        value,
      };
    })
    .filter(Boolean);

  insertMany(items);
  return items.length;
}

function buildAreaNameMap(db) {
  const map = new Map();
  // cities.name は既に「北海道 札幌市」のように pref 接頭辞付き
  const rows = db.prepare(`SELECT code, name FROM cities`).all();
  for (const r of rows) {
    map.set(r.code, r.name);
  }
  return map;
}

// ─── main ───
async function main() {
  const args = parseArgs(process.argv);
  const appId = loadAppId();

  if (!fs.existsSync(DB_PATH)) {
    console.error(`DB not found: ${DB_PATH}`);
    process.exit(2);
  }

  const db = new Database(DB_PATH);
  const areaNameMap = buildAreaNameMap(db);
  console.log(`city area name map: ${areaNameMap.size} entries`);

  // sources 行を先に確認・作成
  const sourceCreated = ensureSource(db);
  console.log(`source ${SOURCE_ID}: ${sourceCreated ? "created" : "exists"}`);

  const targetMetrics = args.limitCat01
    ? METRICS.filter((m) => m.cdCat01 === args.limitCat01)
    : METRICS;

  console.log(`targets: ${targetMetrics.map((m) => `${m.cdCat01}/${m.metricKey}`).join(", ")}`);

  for (const metric of targetMetrics) {
    console.log(`\n=== ${metric.metricKey} (${metric.cdCat01}) ===`);

    // 1. metrics 行確認・作成
    const created = ensureMetric(db, metric);
    console.log(`  metrics row: ${created ? "created" : "exists"}`);

    if (args.dryRun) {
      console.log(`  [dry-run] fetch skip`);
      continue;
    }

    // 2. e-Stat fetch
    const rows = await fetchAllForCat01(appId, metric.cdCat01);
    console.log(`  fetched: ${rows.length} rows`);

    // 3. stats_city 投入
    const inserted = insertCityRows(db, metric.metricKey, rows, metric.unit, areaNameMap);
    console.log(`  inserted to stats_city: ${inserted}`);

    // sanity check
    const dbCount = db
      .prepare(`SELECT COUNT(*) AS c FROM stats_city WHERE metric_key = ?`)
      .get(metric.metricKey);
    console.log(`  DB count: ${dbCount.c}`);
  }

  db.close();
  console.log(`\n✓ done`);
}

main().catch((e) => {
  console.error(`Fatal: ${e.stack || e.message}`);
  process.exit(2);
});
