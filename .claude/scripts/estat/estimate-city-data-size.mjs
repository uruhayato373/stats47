#!/usr/bin/env node
/**
 * e-Stat 市区町村データの D1 行数 / バイト数試算
 *
 * 1. e-Stat getStatsList (collectArea=3) で全 statsDataId を取得
 * 2. 各 statsDataId に getMetaInfo を叩き CLASS_INF を取得 (キャッシュ済はスキップ)
 * 3. CLASS_INF から cdCat01 数 × time 数 × area 数を計算
 * 4. 1 行あたり 116 bytes (stats_city 実測 217MB/1.87M 行) で容量推定
 * 5. レポート出力 (top 10 大型 statsDataId + 合計)
 *
 * キャッシュ:
 *   .claude/state/estat-city-meta-cache/<statsDataId>.json
 *
 * Usage:
 *   node .claude/scripts/estat/estimate-city-data-size.mjs [--limit N] [--delay MS]
 */

import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProxyAgent } from "undici";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");

config({ path: path.join(PROJECT_ROOT, ".env.local") });

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("❌ NEXT_PUBLIC_ESTAT_APP_ID 未設定");
  process.exit(1);
}

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const HARD_LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? "0", 10) : 0;
const delayIdx = args.indexOf("--delay");
const DELAY_MS = delayIdx !== -1 ? parseInt(args[delayIdx + 1] ?? "300", 10) : 300;

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};

const CACHE_DIR = path.join(PROJECT_ROOT, ".claude/state/estat-city-meta-cache");
const SNAPSHOT = path.join(PROJECT_ROOT, ".claude/state/estat-city-discovery.json");
const REPORT = path.join(PROJECT_ROOT, ".claude/state/estat-city-estimate-report.json");
fs.mkdirSync(CACHE_DIR, { recursive: true });

const BYTES_PER_ROW = 116; // stats_city: 217MB / 1.87M = 116 B/row
const D1_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
const CITY_AREA_COUNT = 1913; // 市区町村数 (上限)

function pickString(v) {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "$" in v) return String(v.$);
  return null;
}

async function fetchStatsList() {
  if (fs.existsSync(SNAPSHOT)) {
    const j = JSON.parse(fs.readFileSync(SNAPSHOT, "utf-8"));
    console.log(`📂 既存 snapshot 使用: ${j.length} 件`);
    return j;
  }
  console.log("📡 getStatsList (collectArea=3) で全件取得中...");
  const params = new URLSearchParams({
    appId: APP_ID,
    lang: "J",
    collectArea: "3",
    limit: "10000",
    startPosition: "1",
  });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?${params}`;
  const res = await fetch(url, fetchOpts);
  const json = await res.json();
  const tables = json?.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF;
  const arr = Array.isArray(tables) ? tables : tables ? [tables] : [];
  const summary = arr.map((t) => ({
    statsDataId: String(t["@id"]),
    statName: pickString(t.STAT_NAME) ?? "",
    title: pickString(t.TITLE) ?? pickString(t.STATISTICS_NAME) ?? "",
    govOrg: pickString(t.GOV_ORG) ?? null,
  }));
  fs.writeFileSync(SNAPSHOT, JSON.stringify(summary, null, 2));
  console.log(`💾 snapshot saved: ${summary.length} 件 → ${SNAPSHOT}`);
  return summary;
}

async function fetchMeta(statsDataId) {
  const cachePath = path.join(CACHE_DIR, `${statsDataId}.json`);
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  }
  const params = new URLSearchParams({
    appId: APP_ID,
    lang: "J",
    statsDataId,
  });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?${params}`;
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, fetchOpts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const classObjs = json?.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
      const result = { statsDataId, classObjs: classObjs ?? null, fetchedAt: new Date().toISOString() };
      fs.writeFileSync(cachePath, JSON.stringify(result));
      return result;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}

/**
 * CLASS_INF から行数を推定
 * 行数 = (cat01 〜 catN 全部の積) × area(市区町村) × time
 * 注意: area は lvArea=3 のみ数える。time は全期間。
 */
function estimateRowsFromClassObjs(classObjs) {
  if (!classObjs) return { rows: 0, dims: {} };
  const arr = Array.isArray(classObjs) ? classObjs : [classObjs];
  let factor = 1;
  const dims = {};
  let areaCount = null;
  let timeCount = null;
  for (const obj of arr) {
    const id = obj["@id"];
    const classes = Array.isArray(obj.CLASS) ? obj.CLASS : obj.CLASS ? [obj.CLASS] : [];
    const count = classes.length;
    if (id === "area") {
      // 市区町村だけカウント (5桁で末尾000以外、もしくは @level=3)
      const cityClasses = classes.filter((c) => {
        const lvl = c["@level"];
        const code = String(c["@code"] ?? "");
        if (lvl === "3") return true; // 明示
        if (lvl) return false; // 都道府県・全国レベル
        // level 指定なし → code パターンで判定 (5桁で末尾 000 以外)
        return /^\d{5}$/.test(code) && !code.endsWith("000");
      });
      areaCount = cityClasses.length || Math.min(count, CITY_AREA_COUNT);
      dims.area = { total: count, cityOnly: areaCount };
    } else if (id === "time") {
      timeCount = count;
      dims.time = count;
    } else {
      // cat01, cat02, ... tab など
      factor *= count;
      dims[id] = count;
    }
  }
  if (areaCount === null) areaCount = CITY_AREA_COUNT; // area dim 未指定なら上限
  if (timeCount === null) timeCount = 1; // time 不明なら 1
  const rows = factor * areaCount * timeCount;
  return { rows, dims, areaCount, timeCount, catFactor: factor };
}

async function main() {
  const list = await fetchStatsList();
  const target = HARD_LIMIT > 0 ? list.slice(0, HARD_LIMIT) : list;
  console.log(`\n🎯 試算対象: ${target.length} 件 (delay=${DELAY_MS}ms / 推定所要 ${Math.ceil(target.length * DELAY_MS / 60000)} 分)\n`);

  const results = [];
  let totalRows = 0;
  let cached = 0;
  let fetched = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < target.length; i++) {
    const item = target[i];
    const cachePath = path.join(CACHE_DIR, `${item.statsDataId}.json`);
    const wasCached = fs.existsSync(cachePath);
    try {
      const meta = await fetchMeta(item.statsDataId);
      const est = estimateRowsFromClassObjs(meta.classObjs);
      results.push({ ...item, ...est });
      totalRows += est.rows;
      if (wasCached) cached++;
      else fetched++;
    } catch (e) {
      failed++;
      results.push({ ...item, error: e.message ?? String(e), rows: 0 });
    }
    if ((i + 1) % 100 === 0 || i + 1 === target.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(
        `  [${i + 1}/${target.length}] cached=${cached} fetched=${fetched} failed=${failed} totalRows=${totalRows.toLocaleString()} (elapsed ${elapsed}s)`
      );
    }
    if (!wasCached) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const totalBytes = totalRows * BYTES_PER_ROW;
  results.sort((a, b) => (b.rows ?? 0) - (a.rows ?? 0));
  const report = {
    generatedAt: new Date().toISOString(),
    totalCandidates: target.length,
    totalEstimatedRows: totalRows,
    totalEstimatedBytes: totalBytes,
    totalEstimatedGB: (totalBytes / 1024 / 1024 / 1024).toFixed(2),
    d1LimitGB: 10,
    fitInD1: totalBytes <= D1_LIMIT_BYTES,
    bytesPerRow: BYTES_PER_ROW,
    fetched,
    cached,
    failed,
    top10: results.slice(0, 10).map((r) => ({
      statsDataId: r.statsDataId,
      title: r.title?.slice(0, 80),
      rows: r.rows,
      dims: r.dims,
    })),
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

  console.log("\n━━━ 試算結果 ━━━");
  console.log(`  対象: ${report.totalCandidates} 件`);
  console.log(`  推定総行数: ${totalRows.toLocaleString()}`);
  console.log(`  推定容量: ${(totalBytes / 1024 / 1024).toFixed(0)} MB (${report.totalEstimatedGB} GB)`);
  console.log(`  D1 上限 (10 GB) 内?: ${report.fitInD1 ? "✅ YES" : "❌ NO"}`);
  console.log(`  失敗: ${failed}`);
  console.log(`  レポート: ${REPORT}`);
  console.log("");
  console.log("=== Top 10 巨大 statsDataId ===");
  for (const r of report.top10) {
    console.log(`  ${r.rows.toLocaleString().padStart(15)} rows | ${r.statsDataId} | ${r.title}`);
  }
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
