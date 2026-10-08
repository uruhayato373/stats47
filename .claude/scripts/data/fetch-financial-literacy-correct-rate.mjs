#!/usr/bin/env node
/**
 * 金融リテラシー調査(2022年) 正誤問題25問の正答率 (都道府県別) の投入スクリプト。
 *
 * 出典: 金融広報中央委員会(知るぽると)「金融リテラシー調査(2022年)」統計表の一括ファイル 22lite_toukeir.xlsx
 *   https://www.shiruporuto.jp/public/document/container/literacy_chosa/2022/
 *   シート「86 都道府県比較表 (1)」(正誤問題25問の正答率 順位表) と 都道府県別シート「39 北海道」〜「85 沖縄県」の
 *   「(2) 金融知識・判断力に関する特徴」表の「合計」行。
 *   利用条件: 知るぽるとの利用条件は商用目的の転載・複製に事前承諾を求める。公開の判断はオーナー決定
 *   (2026-10-08「一次統計を踏まえ、教材の論点を参考に独自コンテンツとして展開する」)。承諾確認は未了で、
 *   指摘があれば取り下げる。
 *
 * 手順:
 *   1. ランディングページ (2022年) から統計表の一括 xlsx の直リンクを解決して取得
 *   2. 比較表(1)から 47 都道府県の正答率 + 全国平均 を抽出
 *   3. 検算: 47 都道府県シートの「合計(25問)」行の都道府県値と、全国値(全国平均) が比較表の値と一致 (許容 0.001)
 *   4. .local/r2/app/stats/<key>/values.json へ書き出し (小数第2位)
 *
 * 実行: node .claude/scripts/data/fetch-financial-literacy-correct-rate.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import ExcelJS from "exceljs";
import { fetchBuffer, toFullPrefName, writeStatsValues, roundTo, assertClose, PREF_NAMES } from "./lib/stats-values-writer.mjs";

const PAGE_URL = "https://www.shiruporuto.jp/public/document/container/literacy_chosa/2022/";
const METRIC_KEY = "financial-literacy-correct-rate";
const YEAR = "2022";

const cell = (c) => (c && typeof c === "object" && "result" in c ? c.result : c && c.richText ? c.richText.map((t) => t.text).join("") : c);
const clean = (v) => String(cell(v) ?? "").replace(/[\s　]/g, "");

async function main() {
  const html = (await fetchBuffer(PAGE_URL)).toString("utf8");
  const m = html.match(/href="([^"]*22lite_toukeir\.xlsx)"/);
  if (!m) throw new Error("統計表の一括 xlsx の直リンクを解決できません");
  const url = new URL(m[1], PAGE_URL).href;
  console.log(`[fetch] ${url}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await fetchBuffer(url));

  // 比較表(1): row6〜 : col2=都道府県 col3=データ。最後に「全国平均」
  const cmp = wb.worksheets.find((w) => w.name.startsWith("86 都道府県比較表 (1)"));
  if (!cmp) throw new Error("比較表(1)がありません");
  if (!clean(cmp.getCell(4, 1).value).includes("正誤問題25問の正答率")) throw new Error("比較表(1)の先頭列が『正誤問題25問の正答率』ではありません");
  const table = new Map();
  let national = null;
  for (let r = 6; r <= cmp.rowCount; r++) {
    const name = clean(cmp.getCell(r, 2).value);
    const val = cell(cmp.getCell(r, 3).value);
    if (name === "全国平均") { national = Number(val); continue; }
    const pref = toFullPrefName(name);
    if (pref && typeof val === "number") table.set(pref, val);
  }
  if (table.size !== 47 || PREF_NAMES.some((n) => !table.has(n))) throw new Error(`比較表の都道府県 ${table.size}/47`);
  if (!(national > 0)) throw new Error("全国平均を読めません");

  // 検算: 都道府県別シート(39〜85)の「(2)金融知識・判断力」表 合計(25問)行
  const checked = new Set();
  for (const ws of wb.worksheets) {
    const mm = ws.name.match(/^(\d+)\s+(.+)$/);
    if (!mm || Number(mm[1]) < 39 || Number(mm[1]) > 85) continue;
    const pref = toFullPrefName(mm[2]);
    if (!pref) continue;
    let found = false;
    for (let r = 18; r <= 40; r++) {
      if (clean(ws.getCell(r, 2).value) === "合計" && Number(cell(ws.getCell(r, 4).value)) === 25) {
        assertClose(Number(cell(ws.getCell(r, 7).value)), table.get(pref), 0.001, `${pref} 都道府県シートの合計 vs 比較表`);
        assertClose(Number(cell(ws.getCell(r, 5).value)), national, 0.001, `${pref} シートの全国値 vs 全国平均`);
        found = true;
        break;
      }
    }
    if (!found) throw new Error(`${pref}: 都道府県シートに合計(25問)行がありません`);
    checked.add(pref);
  }
  if (checked.size !== 47) throw new Error(`都道府県シートの突合 ${checked.size}/47`);
  console.log(`[verify] OK: 47都道府県シートの正答率(25問)が比較表(1)と一致 / 全国 ${roundTo(national, 2)}% が全シートで一致`);

  const rows = PREF_NAMES.map((areaName) => ({ areaName, yearCode: YEAR, value: roundTo(table.get(areaName), 2) }));
  writeStatsValues({ metricKey: METRIC_KEY, unit: "％", rows });
}

main().catch((e) => { console.error(e); process.exit(1); });
