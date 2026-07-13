#!/usr/bin/env node
/**
 * SSDS (社会・人口統計体系) 都道府県テーブルの全 cat01 (=指標) を列挙し、既存 config と突合して
 * 「未使用の cdCat01 = クリーンに追加できる都道府県ランキング候補」を洗い出す。
 *
 * SSDS は 1 cdCat01 = 1 完成した都道府県指標 (クロス集計不要) なので、生 survey テーブルより
 * 遥かに機械的に config 化できる。これが「増やせるだけ増やす」の本命ソース。
 *
 * getMetaInfo の cat01 は全値が要るため fetch-estat-meta (12件cap) と別実装。
 * e-Stat APP_ID は CI 専任 (secrets)。R2/D1 非書込 read-only。
 *
 * Usage: node .claude/scripts/estat/enumerate-ssds-indicators.mjs
 * 出力:
 *   .claude/state/estat/ssds-candidates.json          (未使用 cdCat01 一覧: statsDataId/cdCat01/name/unit)
 *   .claude/state/estat/ssds-candidates-summary.json  (件数サマリ)
 */

import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ProxyAgent } from "undici";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
config({ path: path.join(PROJECT_ROOT, ".env.local") });

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("❌ NEXT_PUBLIC_ESTAT_APP_ID 未設定 (CI: secrets)");
  process.exit(1);
}

// SSDS 都道府県データの統計表 (既存 config が使う 0000010101-112 / 0000010201-213 系)。
// 存在しない ID は getMetaInfo が error を返すのでスキップする。
const SSDS_PREF_TABLES = [];
for (let i = 1; i <= 13; i++) SSDS_PREF_TABLES.push(`00000101${String(i).padStart(2, "0")}`);
for (let i = 1; i <= 13; i++) SSDS_PREF_TABLES.push(`00000102${String(i).padStart(2, "0")}`);

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};
const BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";
const DELAY_MS = 500;

const OUT_CANDIDATES = path.join(PROJECT_ROOT, ".claude/state/estat/ssds-candidates.json");
const OUT_SUMMARY = path.join(PROJECT_ROOT, ".claude/state/estat/ssds-candidates-summary.json");

function pickString(v) {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "$" in v) return String(v.$);
  return null;
}
const asArray = (x) => (!x ? [] : Array.isArray(x) ? x : [x]);

/** 既存 config の (statsDataId, cdCat01) ペア集合 */
function existingPairs() {
  const dir = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics");
  const set = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".ts") || f === "index.ts") continue;
    const t = fs.readFileSync(path.join(dir, f), "utf8");
    const sid = t.match(/"statsDataId":\s*"([^"]+)"/);
    const cat = t.match(/"cdCat01":\s*"([^"]+)"/);
    if (sid && cat) set.add(`${sid[1]}|${cat[1]}`);
  }
  return set;
}

async function fetchCat01(statsDataId) {
  const params = new URLSearchParams({ appId: APP_ID, lang: "J", statsDataId });
  const res = await fetch(`${BASE_URL}?${params.toString()}`, fetchOpts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const meta = json?.GET_META_INFO?.METADATA_INF;
  if (!meta) return { error: json?.GET_META_INFO?.RESULT?.ERROR_MSG ?? "no meta" };
  const title = pickString(meta.TABLE_INF?.TITLE) ?? pickString(meta.TABLE_INF?.STATISTICS_NAME) ?? "";
  const classObjs = asArray(meta.CLASS_INF?.CLASS_OBJ);
  const cat01 = classObjs.find((c) => c["@id"] === "cat01");
  const values = asArray(cat01?.CLASS).map((v) => ({
    cdCat01: v["@code"],
    name: v["@name"],
    unit: v["@unit"] ?? null,
    level: v["@level"] ?? null,
  }));
  return { title, cat01Name: cat01?.["@name"] ?? null, values };
}

async function main() {
  const existing = existingPairs();
  console.log(`既存 (statsDataId,cdCat01) ペア: ${existing.size}`);
  const candidates = [];
  const perTable = [];
  let totalIndicators = 0;
  for (const sid of SSDS_PREF_TABLES) {
    let r;
    try {
      r = await fetchCat01(sid);
    } catch (e) {
      console.log(`  ${sid}: ❌ ${e.message}`);
      await new Promise((x) => setTimeout(x, DELAY_MS));
      continue;
    }
    if (r.error) {
      console.log(`  ${sid}: (なし: ${r.error})`);
      await new Promise((x) => setTimeout(x, DELAY_MS));
      continue;
    }
    // 総数/計 のような集計値 (統計指標でない) を除外: 名前が「総数」等だけのものは稀。SSDS cat01 は原則 1指標。
    const inds = r.values.filter((v) => v.cdCat01 && !/^総数$|^計$/.test(v.name ?? ""));
    totalIndicators += inds.length;
    const newOnes = inds.filter((v) => !existing.has(`${sid}|${v.cdCat01}`));
    perTable.push({ statsDataId: sid, title: r.title.slice(0, 40), indicators: inds.length, newCandidates: newOnes.length });
    for (const v of newOnes) candidates.push({ statsDataId: sid, ...v });
    console.log(`  ${sid}: ${r.title.slice(0, 32)} | 指標 ${inds.length} / 未使用 ${newOnes.length}`);
    await new Promise((x) => setTimeout(x, DELAY_MS));
  }

  // 単位別の内訳 (率/円/人 等。config 化しやすさの目安)
  const byUnit = {};
  for (const c of candidates) {
    const u = c.unit || "(単位なし)";
    byUnit[u] = (byUnit[u] || 0) + 1;
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    ssdsTablesProbed: SSDS_PREF_TABLES.length,
    ssdsTablesFound: perTable.length,
    totalSsdsIndicators: totalIndicators,
    existingPairs: existing.size,
    newCandidates: candidates.length,
    topUnits: Object.entries(byUnit).sort((a, b) => b[1] - a[1]).slice(0, 20),
    perTable,
  };
  fs.mkdirSync(path.dirname(OUT_CANDIDATES), { recursive: true });
  fs.writeFileSync(OUT_CANDIDATES, JSON.stringify(candidates, null, 1));
  fs.writeFileSync(OUT_SUMMARY, JSON.stringify(summary, null, 2));
  console.log("\n━━━ 結果 ━━━");
  console.log(JSON.stringify({ ...summary, perTable: `(${perTable.length} tables)` }, null, 2));
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
