#!/usr/bin/env node
/**
 * e-Stat「統計項目の定義」「指標計算式」(社会・人口統計体系の 13 分野) を取得し、項目符号ごとの
 * 「時点又は期間」「調査名」と、指標コードごとの計算式の基礎項目を JSON に控える。
 *
 * なぜ要るか: SSDS の指標の年の区切り (yearFormat) を出典の期間から決める根拠が、リポジトリに無かった
 * (SSDS-YEARFORMAT-SOURCE-01)。判定は lib/ssds-year-format.mjs、突き合わせは check-ssds-year-format.ts。
 *
 * 使い方 (e-Stat が定義を改めたとき・新しい項目が「定義ページに項目が無い」と出たとき):
 *   node .claude/scripts/estat/build-ssds-definitions.mjs
 *
 * 出力: data/estat/ssds-year-format/definitions.json (台帳 id: estat.ssds-definitions)
 * read-only の取得 (公開 HTML 26 ページ・API キー不要) とローカルへの書き出しだけ。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { datasetPath } from "../../../config/datasets.mjs";
import { FIELDS, definitionUrl, formulaUrl, parseIndicatorFormulas, parseItemDefinitions } from "./lib/ssds-year-format.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUTPUT = path.join(PROJECT_ROOT, datasetPath("estat.ssds-definitions"));
/** e-Stat へ続けて取りに行く間隔 */
const FETCH_INTERVAL_MS = 1000;

async function fetchHtml(url) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (definitions snapshot)" } });
  if (!response.ok) throw new Error(`${url} が HTTP ${response.status} を返した`);
  return response.text();
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** 4,000 件を超える配列を 1 件 1 行で書く (差分を読めるようにする) */
const rows = (entries) => (entries.length === 0 ? "[]" : `[\n${entries.map((entry) => `    ${JSON.stringify(entry)}`).join(",\n")}\n  ]`);

const sources = [];
const items = [];
const ranges = [];
const indicators = [];
for (const field of FIELDS) {
  const definitions = parseItemDefinitions(await fetchHtml(definitionUrl(field)));
  await wait(FETCH_INTERVAL_MS);
  const formulas = parseIndicatorFormulas(await fetchHtml(formulaUrl(field)));
  await wait(FETCH_INTERVAL_MS);
  // ページの作りが変わって 1 件も読めなくなったら、空の控えで判定を全滅させずに止める
  if (definitions.items.length === 0 || formulas.length === 0) {
    throw new Error(`分野 ${field} から項目 ${definitions.items.length} 件・指標 ${formulas.length} 件しか読めなかった (ページの作りが変わった可能性)`);
  }
  sources.push({ field, definitionUrl: definitionUrl(field), formulaUrl: formulaUrl(field), items: definitions.items.length, indicators: formulas.length });
  items.push(...definitions.items);
  ranges.push(...definitions.ranges);
  indicators.push(...formulas);
  console.log(`  ${field}: 項目 ${definitions.items.length} 件 / 指標 ${formulas.length} 件`);
}

const body = `{
  "schemaVersion": 1,
  "title": "社会・人口統計体系 統計項目の定義 (時点又は期間・調査名) と指標計算式の控え",
  "fetchedAt": ${JSON.stringify(new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date()))},
  "sources": ${rows(sources)},
  "items": ${rows(items)},
  "ranges": ${rows(ranges)},
  "indicators": ${rows(indicators)}
}
`;
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, body);
console.log(`\n${path.relative(PROJECT_ROOT, OUTPUT)}: 項目 ${items.length} 件 / 範囲 ${ranges.length} 件 / 指標 ${indicators.length} 件`);
