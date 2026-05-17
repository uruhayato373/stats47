#!/usr/bin/env node
/**
 * e-Stat 市区町村 ETL (PoC)
 *
 * 1 statsDataId について:
 *  1. e-Stat getStatsData (lvArea=3, paging) で全件取得
 *  2. flat JSON 化 [{areaCode, areaName, prefectureCode, year, value, ...catN}]
 *  3. gzip 圧縮 → .local/r2/app/estat-city/<id>/all.json.gz
 *  4. (呼び出し側) packages/r2-storage/src/scripts/sync-upload.ts で R2 push
 *  5. D1 city_indicators テーブルに行 INSERT (テーブル無ければ CREATE)
 *
 * Usage:
 *   node .claude/scripts/estat/etl-city-stats.mjs <statsDataId>
 */

import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { ProxyAgent } from "undici";
import BetterSqlite3 from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
config({ path: path.join(PROJECT_ROOT, ".env.local") });

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("❌ NEXT_PUBLIC_ESTAT_APP_ID 未設定");
  process.exit(1);
}

const statsDataId = process.argv[2];
if (!statsDataId) {
  console.error("usage: node etl-city-stats.mjs <statsDataId>");
  process.exit(1);
}

const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};

const R2_PATH = `app/estat-city/${statsDataId}/all.json.gz`;
const LOCAL_FILE = path.join(PROJECT_ROOT, ".local/r2", R2_PATH);
fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });

// ---------------------------------------------------------
// e-Stat fetch
// ---------------------------------------------------------

async function fetchStatsData(startPosition = 1, limit = 100000) {
  const params = new URLSearchParams({
    appId: APP_ID,
    lang: "J",
    statsDataId,
    lvArea: "3",
    limit: String(limit),
    startPosition: String(startPosition),
  });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params}`;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, fetchOpts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json;
    } catch (e) {
      console.warn(`  retry ${i + 1}/3:`, e.message);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("e-Stat fetch failed after 3 retries");
}

function pickString(v) {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "$" in v) return String(v.$);
  return null;
}

async function fetchAllStatsData() {
  const collected = [];
  let firstResp = null;
  let startPosition = 1;
  while (true) {
    const json = await fetchStatsData(startPosition);
    if (!firstResp) firstResp = json;
    const stats = json?.GET_STATS_DATA?.STATISTICAL_DATA;
    if (!stats) {
      console.error("unexpected response:", JSON.stringify(json).slice(0, 300));
      break;
    }
    const values = stats.DATA_INF?.VALUE;
    const arr = Array.isArray(values) ? values : values ? [values] : [];
    collected.push(...arr);
    const resultInf = stats.RESULT_INF || json.GET_STATS_DATA.RESULT?.RESULT_INF;
    const total = resultInf?.TOTAL_NUMBER ?? collected.length;
    const next = resultInf?.NEXT_KEY;
    console.log(`  fetched ${collected.length}/${total}, next=${next ?? "<end>"}`);
    if (!next) break;
    startPosition = next;
    await new Promise((r) => setTimeout(r, 300));
  }
  return { firstResp, values: collected };
}

// ---------------------------------------------------------
// CLASS_INF lookup (areaName, year, cat name)
// ---------------------------------------------------------

function buildClassMaps(stats) {
  const classObjs = stats?.CLASS_INF?.CLASS_OBJ;
  const arr = Array.isArray(classObjs) ? classObjs : classObjs ? [classObjs] : [];
  const maps = {};
  const dimSummary = [];
  for (const obj of arr) {
    const id = obj["@id"];
    const name = obj["@name"];
    const classes = Array.isArray(obj.CLASS) ? obj.CLASS : obj.CLASS ? [obj.CLASS] : [];
    const map = {};
    for (const c of classes) {
      map[c["@code"]] = c["@name"];
    }
    maps[id] = map;
    dimSummary.push({ id, name, count: classes.length });
  }
  return { maps, dimSummary };
}

// ---------------------------------------------------------
// flat row conversion
// ---------------------------------------------------------

function isCityCode(code) {
  return /^\d{5}$/.test(code) && !code.endsWith("000");
}

function flatten(values, maps) {
  const rows = [];
  for (const v of values) {
    const areaCode = String(v["@area"] ?? "");
    if (!isCityCode(areaCode)) continue; // 市区町村のみ
    const row = {
      areaCode,
      areaName: maps.area?.[areaCode] ?? "",
      prefectureCode: areaCode.slice(0, 2) + "000",
      year: String(v["@time"] ?? ""),
      yearName: maps.time?.[v["@time"]] ?? null,
      value: v["$"] !== undefined && v["$"] !== "" ? Number(v["$"]) : null,
      unit: v["@unit"] ?? null,
    };
    // dynamic cat dimensions
    for (const k of Object.keys(v)) {
      if (k.startsWith("@cat")) {
        const dimId = k.slice(1); // 'cat01'
        const code = v[k];
        row[dimId] = code;
        row[`${dimId}Name`] = maps[dimId]?.[code] ?? null;
      } else if (k === "@tab") {
        row.tab = v[k];
        row.tabName = maps.tab?.[v[k]] ?? null;
      }
    }
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------
// D1 city_indicators table
// ---------------------------------------------------------

function ensureCityIndicatorsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS city_indicators (
      stats_data_id   TEXT PRIMARY KEY,
      category_key    TEXT,
      gov_org         TEXT,
      title           TEXT NOT NULL,
      dim_cat01_count INTEGER,
      dim_time_count  INTEGER,
      dim_area_count  INTEGER,
      dim_summary     TEXT,
      r2_path         TEXT NOT NULL,
      r2_size_bytes   INTEGER,
      r2_split_kind   TEXT DEFAULT 'single',
      total_rows      INTEGER,
      first_year      TEXT,
      last_year       TEXT,
      status          TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'fetched', 'failed')),
      fetched_at      TEXT,
      error_message   TEXT,
      created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at      TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_city_indicators_status ON city_indicators(status);
    CREATE INDEX IF NOT EXISTS idx_city_indicators_category ON city_indicators(category_key);
    CREATE INDEX IF NOT EXISTS idx_city_indicators_total_rows ON city_indicators(total_rows DESC);
  `);
}

// ---------------------------------------------------------
// main
// ---------------------------------------------------------

async function main() {
  console.log(`🚀 PoC ETL: statsDataId=${statsDataId}`);
  const t0 = Date.now();

  console.log("\n📡 e-Stat getStatsData fetch...");
  const { firstResp, values } = await fetchAllStatsData();
  const stats = firstResp?.GET_STATS_DATA?.STATISTICAL_DATA;
  const tableInf = stats?.TABLE_INF;
  const title =
    pickString(tableInf?.TITLE) ??
    pickString(tableInf?.STATISTICS_NAME) ??
    "(no title)";
  const govOrg = pickString(tableInf?.GOV_ORG) ?? null;

  console.log(`  生 VALUE: ${values.length}`);
  console.log(`  title: ${title.slice(0, 80)}`);

  const { maps, dimSummary } = buildClassMaps(stats);
  console.log(`  CLASS_OBJ dims: ${dimSummary.map((d) => `${d.id}=${d.count}`).join(", ")}`);

  console.log("\n🔄 flat 変換 (市区町村のみ)...");
  const rows = flatten(values, maps);
  console.log(`  市区町村行: ${rows.length}`);

  const years = [...new Set(rows.map((r) => r.year))].sort();
  console.log(`  年度: ${years[0]} 〜 ${years[years.length - 1]} (${years.length} 種)`);

  console.log("\n📦 gzip + ローカル R2 ステージング...");
  const gzipped = zlib.gzipSync(JSON.stringify(rows), { level: 9 });
  fs.writeFileSync(LOCAL_FILE, gzipped);
  console.log(`  ${LOCAL_FILE}`);
  console.log(`  size: ${(gzipped.length / 1024).toFixed(1)} KB`);

  console.log("\n💾 D1 city_indicators 登録...");
  const db = new BetterSqlite3(DB_PATH);
  ensureCityIndicatorsTable(db);

  const cat01 = dimSummary.find((d) => d.id === "cat01")?.count ?? null;
  const timeCount = dimSummary.find((d) => d.id === "time")?.count ?? null;
  const areaCount = dimSummary.find((d) => d.id === "area")?.count ?? null;

  // existing estat_metainfo の category_key を参照
  const existing = db
    .prepare("SELECT category_key FROM estat_metainfo WHERE stats_data_id = ?")
    .get(statsDataId);
  const categoryKey = existing?.category_key ?? null;

  db.prepare(
    `INSERT INTO city_indicators
       (stats_data_id, category_key, gov_org, title,
        dim_cat01_count, dim_time_count, dim_area_count, dim_summary,
        r2_path, r2_size_bytes, r2_split_kind,
        total_rows, first_year, last_year,
        status, fetched_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'fetched', ?, ?)
     ON CONFLICT(stats_data_id) DO UPDATE SET
       title=excluded.title,
       dim_cat01_count=excluded.dim_cat01_count,
       dim_time_count=excluded.dim_time_count,
       dim_area_count=excluded.dim_area_count,
       dim_summary=excluded.dim_summary,
       r2_path=excluded.r2_path,
       r2_size_bytes=excluded.r2_size_bytes,
       total_rows=excluded.total_rows,
       first_year=excluded.first_year,
       last_year=excluded.last_year,
       status='fetched',
       fetched_at=excluded.fetched_at,
       updated_at=excluded.updated_at`
  ).run(
    statsDataId,
    categoryKey,
    govOrg,
    title,
    cat01,
    timeCount,
    areaCount,
    JSON.stringify(dimSummary),
    R2_PATH,
    gzipped.length,
    "single",
    rows.length,
    years[0] ?? null,
    years[years.length - 1] ?? null,
    new Date().toISOString(),
    new Date().toISOString()
  );
  db.close();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("\n━━━ 完了 ━━━");
  console.log(`  rows=${rows.length} bytes=${gzipped.length} elapsed=${elapsed}s`);
  console.log(`  R2 ステージング: ${R2_PATH}`);
  console.log(`  次: npx tsx packages/r2-storage/src/scripts/sync-upload.ts --prefix app/estat-city`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
