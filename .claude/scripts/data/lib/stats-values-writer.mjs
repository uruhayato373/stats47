/**
 * 手動投入 (fetcherKey:"manual") metric の観測値を `.local/r2/app/stats/<key>/values.json` へ書く共通部品。
 *
 * - 行の形・rank 規則は page-data-batch / fetch-chutairen-club-membership.mjs と揃える
 *   (value 降順・同値同順位・年ごとに rank を振る)。
 * - 本番 R2 への反映 (diff-push-r2) は呼び元が別途行う。ここはローカル書き出しのみ。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREF_NAMES, PREF_AREA_CODES } from "../../lib/prefectures.cjs";

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
export { PREF_NAMES, PREF_AREA_CODES };
export const CODE_BY_NAME = Object.fromEntries(PREF_NAMES.map((n, i) => [n, PREF_AREA_CODES[i]]));

/** 「北海道」「青森」「東京」等の短縮表記を正式名へ。正式名はそのまま返す。 */
export function toFullPrefName(raw) {
  const s = String(raw).replace(/[\s　]/g, "");
  if (CODE_BY_NAME[s]) return s;
  const hit = PREF_NAMES.find((n) => n !== "北海道" && n.slice(0, -1) === s);
  return hit ?? null;
}

export async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (stats47 data-ingester)" } });
  if (!res.ok) throw new Error(`fetch failed: ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} -> ${res.status}`);
  return res.json();
}

/** OS 一時領域に作業ディレクトリを作る (リポジトリに一時ファイルを置かない)。 */
export function makeWorkDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
}

export function roundTo(value, decimals) {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * @param {{metricKey:string, unit:string, yearName?:(y:string)=>string,
 *          rows:{areaName:string, yearCode:string, value:number}[], expectedAreas?:number}} p
 */
export function writeStatsValues({ metricKey, unit, rows, yearName = (y) => y, expectedAreas = 47 }) {
  const byYear = new Map();
  for (const r of rows) {
    if (!CODE_BY_NAME[r.areaName]) throw new Error(`${metricKey}: 未知の都道府県 ${r.areaName}`);
    if (!Number.isFinite(r.value)) throw new Error(`${metricKey}: 非有限値 ${r.areaName} ${r.yearCode}`);
    if (!byYear.has(r.yearCode)) byYear.set(r.yearCode, []);
    byYear.get(r.yearCode).push(r);
  }
  const out = [];
  for (const year of [...byYear.keys()].sort()) {
    const list = byYear.get(year);
    if (new Set(list.map((r) => r.areaName)).size !== list.length) throw new Error(`${metricKey} ${year}: 県の重複`);
    const sorted = [...list].sort((a, b) => b.value - a.value);
    const rank = new Map();
    sorted.forEach((r, i) => {
      rank.set(r.areaName, i > 0 && r.value === sorted[i - 1].value ? rank.get(sorted[i - 1].areaName) : i + 1);
    });
    for (const name of PREF_NAMES) {
      const r = list.find((x) => x.areaName === name);
      if (!r) continue;
      out.push({
        areaCode: CODE_BY_NAME[name],
        areaName: name,
        yearCode: year,
        yearName: yearName(year),
        value: r.value,
        unit,
        rank: rank.get(name),
      });
    }
  }
  const years = [...byYear.keys()].sort();
  const areaCount = new Set(out.map((r) => r.areaCode)).size;
  const payload = {
    metricKey,
    entityKind: "prefecture",
    rows: out,
    meta: {
      rowCount: out.length,
      yearRange: [years[0], years[years.length - 1]],
      areaCount,
      generatedAt: new Date().toISOString(),
    },
  };
  const outPath = path.join(PROJECT_ROOT, ".local/r2/app/stats", metricKey, "values.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  const latest = out.filter((r) => r.yearCode === years[years.length - 1]).sort((a, b) => a.rank - b.rank);
  console.log(
    `[write] ${metricKey}: ${out.length}行 / ${areaCount}県 / ${years.join(",")} / 最新年 1位 ${latest[0].areaName} ${latest[0].value} 最下位 ${latest[latest.length - 1].areaName} ${latest[latest.length - 1].value}`,
  );
  if (areaCount !== expectedAreas) console.warn(`[warn] ${metricKey}: ${areaCount}県 (期待 ${expectedAreas})`);
  return { outPath, out, latest };
}

export function assertClose(actual, expected, tol, label) {
  if (!(Math.abs(actual - expected) <= tol)) throw new Error(`検算失敗 ${label}: 実測 ${actual} / 期待 ${expected} (許容 ${tol})`);
}
