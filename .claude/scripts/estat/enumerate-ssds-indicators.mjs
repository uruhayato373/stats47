#!/usr/bin/env node
/**
 * SSDS (社会・人口統計体系) 都道府県テーブルの全 cat01 (=指標) を列挙し、既存 config と突合して
 * 「未使用の cdCat01 = クリーンに追加できる都道府県ランキング候補」を洗い出す。
 *
 * SSDS は 1 cdCat01 = 1 完成した都道府県指標 (クロス集計不要) なので、生 survey テーブルより
 * 遥かに機械的に config 化できる。これが「増やせるだけ増やす」の本命ソース。
 *
 * 入力は e-Stat メタデータ完全カタログ (公開 R2 `estat-catalog/`。月次で全表の getMetaInfo を保有) で、
 * e-Stat API を直接呼ばない (ESTAT-CATALOG-SSDS-DERIVE-01・2026-11-24)。対象の表は索引
 * `index/tables/00200502.json` の集計地域区分 2 (都道府県) で削除されていない行、cat01 は `meta/<statsDataId>.json`。
 * それまでは 0000010101〜13・0000010201〜13 を手で並べて getMetaInfo を叩いていた (表の増減に追従しない)。
 * 出力は毎回全量で書き直す生成物で、手で編集しない。
 *
 * Usage: node .claude/scripts/estat/enumerate-ssds-indicators.mjs
 *   R2_PUBLIC_FETCH_URL で公開 R2 の読み元を上書きできる (catalog.mjs pull と同じ)。
 * 出力:
 *   data/estat/ssds-candidates.json          (未使用 cdCat01 一覧: statsDataId/cdCat01/name/unit)
 *   data/estat/ssds-candidates-summary.json  (件数サマリ)
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { datasetDir } from "../../../config/datasets.mjs";
import { assertDatasetShape } from "../../../packages/ops/src/datasets/dataset-shape.mjs";
import { R2_PUBLIC_BASE_URL } from "../../../packages/types/mirror/site-config.cjs";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");

/** 社会・人口統計体系の政府統計コードと、都道府県の集計地域区分 */
const SSDS_STAT_CODE = "00200502";
const PREFECTURE_COLLECT_AREA = "2";
const publicBase = () => process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;

async function getCatalogJson(key) {
  const res = await fetch(`${publicBase()}/estat-catalog/${key}`);
  if (!res.ok) throw new Error(`estat-catalog/${key}: HTTP ${res.status}`);
  return res.json();
}

const OUT_CANDIDATES = path.join(PROJECT_ROOT, `${datasetDir("estat.candidates")}/ssds-candidates.json`);
const OUT_SUMMARY = path.join(PROJECT_ROOT, `${datasetDir("estat.candidates")}/ssds-candidates-summary.json`);

function pickString(v) {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "$" in v) return String(v.$);
  return null;
}
const asArray = (x) => (!x ? [] : Array.isArray(x) ? x : [x]);

/** 既存 config の (statsDataId, cdCat01) ペア集合 */
function existingPairs() {
  const dir = path.join(PROJECT_ROOT, datasetDir("metrics.definitions"));
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

/** カタログの meta (getMetaInfo の応答をそのまま保有) から cat01 を取り出す。 */
async function fetchCat01(statsDataId) {
  const doc = await getCatalogJson(`meta/${statsDataId}.json`);
  const json = doc?.response;
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
  return { title, cat01Name: cat01?.["@name"] ?? null, values, fetchedAt: doc.fetchedAt ?? null };
}

/** カタログの索引から、SSDS の都道府県の表 (削除されていないもの) を statsDataId 順に返す。 */
async function ssdsPrefectureTables() {
  const rows = await getCatalogJson(`index/tables/${SSDS_STAT_CODE}.json`);
  const ids = rows
    .filter((r) => String(r.collectArea) === PREFECTURE_COLLECT_AREA && !r.removedAt)
    .map((r) => r.statsDataId)
    .sort();
  if (ids.length === 0) throw new Error(`estat-catalog の索引に SSDS (${SSDS_STAT_CODE}) の都道府県の表が無い`);
  return ids;
}

async function main() {
  const existing = existingPairs();
  console.log(`既存 (statsDataId,cdCat01) ペア: ${existing.size}`);
  const candidates = [];
  const perTable = [];
  let totalIndicators = 0;
  const tables = await ssdsPrefectureTables();
  for (const sid of tables) {
    // 1 表でも読めなければ止める (欠けた表の候補が消えた台帳を書かない)
    const r = await fetchCat01(sid);
    if (r.error) throw new Error(`${sid}: カタログの meta が正常応答でない (${r.error})`);
    // 総数/計 のような集計値 (統計指標でない) を除外: 名前が「総数」等だけのものは稀。SSDS cat01 は原則 1指標。
    const inds = r.values.filter((v) => v.cdCat01 && !/^総数$|^計$/.test(v.name ?? ""));
    totalIndicators += inds.length;
    const newOnes = inds.filter((v) => !existing.has(`${sid}|${v.cdCat01}`));
    perTable.push({ statsDataId: sid, title: r.title.slice(0, 40), indicators: inds.length, newCandidates: newOnes.length });
    for (const v of newOnes) candidates.push({ statsDataId: sid, ...v });
    console.log(`  ${sid}: ${r.title.slice(0, 32)} | 指標 ${inds.length} / 未使用 ${newOnes.length} (meta ${r.fetchedAt ?? "?"})`);
  }

  // 単位別の内訳 (率/円/人 等。config 化しやすさの目安)
  const byUnit = {};
  for (const c of candidates) {
    const u = c.unit || "(単位なし)";
    byUnit[u] = (byUnit[u] || 0) + 1;
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    source: `estat-catalog (index/tables/${SSDS_STAT_CODE}.json の集計地域区分 ${PREFECTURE_COLLECT_AREA} + meta/<statsDataId>.json)`,
    ssdsTablesProbed: tables.length,
    ssdsTablesFound: perTable.length,
    totalSsdsIndicators: totalIndicators,
    existingPairs: existing.size,
    newCandidates: candidates.length,
    topUnits: Object.entries(byUnit).sort((a, b) => b[1] - a[1]).slice(0, 20),
    perTable,
  };
  // 書く前に台帳 estat.candidates の Schema で形を確かめる (要約の ssds-candidates-summary.json はこの台帳の外)
  assertDatasetShape("estat.candidates", candidates);
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
