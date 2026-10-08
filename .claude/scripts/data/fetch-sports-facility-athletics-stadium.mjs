#!/usr/bin/env node
/**
 * 陸上競技場数 (公共スポーツ施設・都道府県別) の投入スクリプト。
 *
 * 出典: スポーツ庁「体育・スポーツ施設現況調査」(平成30年度・令和3年度・令和6年度)
 *   表「都道府県別・市区町村人口規模別・調査種別 設置箇所数」の「陸上競技場」シート (e-Stat 政府統計コード 00402101)
 *   https://www.mext.go.jp/sports/b_menu/toukei/chousa04/shisetsu/kekka/1368165.htm
 *   列「公共スポーツ施設 計」(= 公立社会教育施設に付帯するスポーツ施設 + 社会体育施設)。
 *   学校体育施設・大学高専・民間 (民間は推計を含む) は含まない。
 *   ★この調査は「野球場・ソフトボール場」を合算で公表しており、野球場単独の都道府県値は一次資料に無い。
 *
 * 手順:
 *   1. e-Stat のファイルダウンロード (statInfId) から3回分の xlsx を取得
 *   2. 「陸上競技場」シートの 都道府県行(47) x 「公共スポーツ施設/計」列を抽出 ('-' は0)
 *   3. 検算 (各回): 47県の合計 == 「総数」行の公共計 / 各県で 公共計 = 公立社会教育施設付帯 + 社会体育施設
 *   4. .local/r2/app/stats/<key>/values.json へ書き出し
 *
 * 実行: node .claude/scripts/data/fetch-sports-facility-athletics-stadium.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import ExcelJS from "exceljs";
import { fetchBuffer, toFullPrefName, writeStatsValues, PREF_NAMES } from "./lib/stats-values-writer.mjs";

const DL = (id) => `https://www.e-stat.go.jp/stat-search/file-download?statInfId=${id}&fileKind=0`;
const EDITIONS = [
  { year: "2018", label: "平成30年度", statInfId: "000031942524" },
  { year: "2021", label: "令和3年度", statInfId: "000040052542" },
  { year: "2024", label: "令和6年度", statInfId: "000040451156" },
];
const METRIC_KEY = "athletics-stadium-count-public";
const SHEET_NAME_RE = /^陸上競技場/;

const cell = (c) => (c && typeof c === "object" && "result" in c ? c.result : c && c.richText ? c.richText.map((t) => t.text).join("") : c);
const clean = (v) => String(cell(v) ?? "").replace(/[\s　]/g, "");
const num = (v) => {
  const x = cell(v);
  if (typeof x === "number") return x;
  const s = String(x ?? "").trim();
  if (s === "-" || s === "－" || s === "―") return 0;
  throw new Error(`数値でない値: ${JSON.stringify(s)}`);
};

function findSheet(wb) {
  const ws = wb.worksheets.find((w) => SHEET_NAME_RE.test(clean(w.getCell(4, 1).value)));
  if (!ws) throw new Error("陸上競技場シートが見つかりません");
  return ws;
}

function findColumns(ws) {
  // row6=大区分 / row7=小区分 のヘッダから「公共スポーツ施設」の 計 / 公立社会教育施設に付帯するスポーツ施設 / 社会体育施設 列を解決
  let total = -1, attached = -1, social = -1;
  for (let c = 2; c <= ws.columnCount; c++) {
    const top = clean(ws.getCell(6, c).value);
    const sub = clean(ws.getCell(7, c).value);
    if (top === "公共スポーツ施設") {
      if (sub === "計") total = c;
      else if (sub.startsWith("公立社会教育施設")) attached = c;
      else if (sub === "社会体育施設") social = c;
    }
  }
  if (total < 0 || attached < 0 || social < 0) throw new Error(`公共スポーツ施設の列を解決できません (${total},${attached},${social})`);
  return { total, attached, social };
}

async function parseEdition({ year, label, statInfId }) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await fetchBuffer(DL(statInfId)));
  const ws = findSheet(wb);
  const cols = findColumns(ws);
  const rows = new Map();
  let nationalTotal = null;
  for (let r = 9; r <= ws.rowCount; r++) {
    const name = clean(ws.getCell(r, 2).value);
    if (name === "総数") { nationalTotal = num(ws.getCell(r, cols.total).value); continue; }
    const pref = toFullPrefName(name);
    if (!pref || rows.has(pref)) continue;
    const total = num(ws.getCell(r, cols.total).value);
    const attached = num(ws.getCell(r, cols.attached).value);
    const social = num(ws.getCell(r, cols.social).value);
    if (total !== attached + social) throw new Error(`${year} ${pref}: 公共計 ${total} != 付帯 ${attached} + 社会体育 ${social}`);
    rows.set(pref, total);
  }
  if (rows.size !== 47 || PREF_NAMES.some((n) => !rows.has(n))) throw new Error(`${year}: 都道府県 ${rows.size}/47`);
  const sum = [...rows.values()].reduce((a, b) => a + b, 0);
  if (nationalTotal === null || sum !== nationalTotal) throw new Error(`${year}: 47県合計 ${sum} != 総数行 ${nationalTotal}`);
  console.log(`[verify] ${label}(${year}): 47県の合計 ${sum} = 総数行 ${nationalTotal} / 各県で公共計=付帯+社会体育`);
  return [...rows].map(([areaName, value]) => ({ areaName, yearCode: year, value }));
}

async function main() {
  const rows = [];
  for (const e of EDITIONS) rows.push(...(await parseEdition(e)));
  writeStatsValues({ metricKey: METRIC_KEY, unit: "施設", rows });
}

main().catch((e) => { console.error(e); process.exit(1); });
