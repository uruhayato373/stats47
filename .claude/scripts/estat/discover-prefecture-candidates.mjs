#!/usr/bin/env node
/**
 * e-Stat 都道府県レベル統計表の Discovery (完全DBレス版)
 *
 * `collectArea=2` (都道府県) で getStatsList を paging 全取得し、
 * 既存 metric config (`packages/data-configs/src/metrics/*.ts`) の statsDataId と突合して
 * 「まだランキング化していない都道府県テーブル」を candidate として JSON 出力する。
 *
 * discover-city-stats.mjs (collectArea=3・D1 INSERT 版) の DBレス転用:
 *   - collectArea を 2 (都道府県) に変更
 *   - D1 estat_metainfo への INSERT を廃止し、既存 config との差集合を JSON 出力
 *
 * D1 非依存。CI (vars.NEXT_PUBLIC_ESTAT_APP_ID) / ローカル (.env.local) 両対応。
 *
 * Usage:
 *   node .claude/scripts/estat/discover-prefecture-candidates.mjs [--dry-run] [--limit N]
 *   --dry-run : JSON を書かず件数集計のみ
 *   --limit N : 最初の N テーブルで停止 (動作確認用)
 *
 * 出力:
 *   .claude/state/estat/prefecture-candidates.json          (未カバー candidate 一覧)
 *   .claude/state/estat/prefecture-candidates-summary.json  (件数サマリ)
 */

import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ProxyAgent } from "undici";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");

// ローカルは .env.local から、CI は env から (dotenv は既存キーを上書きしない)
config({ path: path.join(PROJECT_ROOT, ".env.local") });

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("❌ NEXT_PUBLIC_ESTAT_APP_ID が未設定 (ローカル: .env.local / CI: secrets)");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const HARD_LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? "0", 10) : 0;

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};

const BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList";
const BATCH_SIZE = 10000; // e-Stat limit 上限 100000。安全のため 10000 でページング
const DELAY_MS = 300;

const OUT_DIR = path.join(PROJECT_ROOT, ".claude/state/estat");
const OUT_CANDIDATES = path.join(OUT_DIR, "prefecture-candidates.json");
const OUT_SUMMARY = path.join(OUT_DIR, "prefecture-candidates-summary.json");

async function fetchPage(startPosition) {
  const params = new URLSearchParams({
    appId: APP_ID,
    lang: "J",
    collectArea: "2", // 都道府県
    limit: String(BATCH_SIZE),
    startPosition: String(startPosition),
  });
  const res = await fetch(`${BASE_URL}?${params.toString()}`, fetchOpts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const datalist = json?.GET_STATS_LIST?.DATALIST_INF;
  if (!datalist) {
    const errMsg = json?.GET_STATS_LIST?.RESULT?.ERROR_MSG;
    if (errMsg && /該当するデータが存在しません|該当データはありませんでした/.test(errMsg)) {
      return { tables: [], total: 0, nextKey: null };
    }
    throw new Error(`unexpected response: ${JSON.stringify(json).slice(0, 200)}`);
  }
  const tables = datalist.TABLE_INF
    ? Array.isArray(datalist.TABLE_INF)
      ? datalist.TABLE_INF
      : [datalist.TABLE_INF]
    : [];
  return {
    tables,
    total: datalist.NUMBER,
    nextKey: datalist.RESULT_INF?.NEXT_KEY ?? null,
  };
}

function pickString(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$" in value) return String(value.$);
  return null;
}

function mapTable(t) {
  return {
    statsDataId: String(t["@id"]),
    statName: pickString(t.STAT_NAME) ?? "",
    title: pickString(t.TITLE) ?? pickString(t.STATISTICS_NAME) ?? "",
    govOrg: pickString(t.GOV_ORG) ?? null,
    cycle: pickString(t.CYCLE) ?? null,
    surveyDate: pickString(t.SURVEY_DATE) ?? null,
    updatedDate: pickString(t.UPDATED_DATE) ?? null,
  };
}

/** 既存 config (`packages/data-configs/src/metrics/*.ts`) の statsDataId 集合 */
function existingStatsDataIds() {
  const dir = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics");
  const set = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".ts") || f === "index.ts") continue;
    const t = fs.readFileSync(path.join(dir, f), "utf8");
    const re = /"statsDataId":\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(t))) set.add(m[1]);
  }
  return set;
}

async function main() {
  console.log("📡 e-Stat 都道府県 discovery (collectArea=2, DBレス)");
  console.log(`   mode: ${DRY_RUN ? "DRY RUN" : "WRITE"}`);

  const existing = existingStatsDataIds();
  console.log(`   既存 config の statsDataId: ${existing.size} 種\n`);

  const seen = new Map(); // statsDataId -> table (e-Stat 側の重複排除)
  let startPosition = 1;
  let total = 0;
  let pageNum = 0;

  while (true) {
    pageNum++;
    const start = Date.now();
    const { tables, total: t, nextKey } = await fetchPage(startPosition);
    total = t;
    console.log(
      `  page ${pageNum}: startPos=${startPosition} got=${tables.length} total=${total} uniq=${seen.size} (${Date.now() - start}ms)`,
    );
    for (const raw of tables) {
      const row = mapTable(raw);
      if (!seen.has(row.statsDataId)) seen.set(row.statsDataId, row);
    }
    if (HARD_LIMIT > 0 && seen.size >= HARD_LIMIT) {
      console.log(`  ⚠️ HARD_LIMIT ${HARD_LIMIT} 到達、停止`);
      break;
    }
    if (tables.length === 0 || !nextKey) break;
    startPosition = nextKey;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  const allTables = [...seen.values()];
  const candidates = allTables.filter((x) => !existing.has(x.statsDataId));
  const covered = allTables.length - candidates.length;

  // 府省 / 統計名 別の内訳 (どの分野に伸びしろがあるか)
  const byOrg = {};
  const byStat = {};
  for (const c of candidates) {
    const o = c.govOrg || "unknown";
    byOrg[o] = (byOrg[o] || 0) + 1;
    const s = c.statName || "unknown";
    byStat[s] = (byStat[s] || 0) + 1;
  }
  const top = (obj, n) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);

  const summary = {
    generatedAt: new Date().toISOString(),
    collectArea: "2 (都道府県)",
    estatTotalPrefectureTables: total,
    uniquePrefectureTables: allTables.length,
    existingConfigStatsDataIds: existing.size,
    alreadyCoveredTables: covered,
    newCandidateTables: candidates.length,
    topGovOrgs: top(byOrg, 15),
    topStatNames: top(byStat, 25),
  };

  if (!DRY_RUN) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_CANDIDATES, JSON.stringify(candidates, null, 1));
    fs.writeFileSync(OUT_SUMMARY, JSON.stringify(summary, null, 2));
    console.log(`\n  → ${path.relative(PROJECT_ROOT, OUT_CANDIDATES)} (${candidates.length} 件)`);
    console.log(`  → ${path.relative(PROJECT_ROOT, OUT_SUMMARY)}`);
  }

  console.log("\n━━━ 結果 ━━━");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
