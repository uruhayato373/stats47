#!/usr/bin/env node
/**
 * 成人1人あたり酒類販売(消費)数量 (都道府県別) の投入スクリプト。
 *
 * 出典: 国税庁「酒のしおり」(令和7年7月・令和6年6月版) 表「成人1人当たりの酒類販売(消費)数量表(都道府県別)」
 *   https://www.nta.go.jp/taxes/sake/shiori-gaikyo/shiori/2025/index.htm
 *   (主として「国税庁統計年報書」(4月〜翌年3月)による。成人人口=20歳未満を除く「人口推計」(総務省統計局))
 *   ★沖縄県は一次資料の表に含まれない (表の注: 全国平均は沖縄県分を含まない) ため 46 都道府県。
 *
 * 手順:
 *   1. 各版の index ページから excel/0014-3.xlsx の直リンクを解決して取得
 *   2. シート「13 令和N年度成人１人当たりの酒類販売（消費）数量…」(都道府県行 x 酒類14区分+合計) を読む
 *   3. 検算 (令和5年度=2023年度、2025年版):
 *      - 同ブックの「都道府県別販売（消費数量）」(Kl) と「算出」の成人人口(千人)から再計算した
 *        1人あたり量 (Kl / 千人 = L/人) が公表の1人あたり表と 46県 x 14区分 で一致 (許容 0.0015)
 *      - 公表「合計」が14区分の和と一致 / 全国計(Kl)の公表値が46県の和と一致
 *   4. 検算 (令和4年度=2022年度、2024年版): 量の元表を持たないため、各県の「合計」=14区分の和 (許容 0.02L) と
 *      全国平均が県の最小〜最大の範囲内であることを確認
 *   5. .local/r2/app/stats/<key>/values.json へ書き出し (3桁丸め)
 *
 * 実行: node .claude/scripts/data/fetch-nta-alcohol-per-adult.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import ExcelJS from "exceljs";
import { fetchBuffer, toFullPrefName, writeStatsValues, roundTo, assertClose } from "./lib/stats-values-writer.mjs";

const ORIGIN = "https://www.nta.go.jp";
const EDITIONS = [
  { edition: "2025", index: `${ORIGIN}/taxes/sake/shiori-gaikyo/shiori/2025/index.htm` },
  { edition: "2024", index: `${ORIGIN}/taxes/sake/shiori-gaikyo/shiori/2024/index.htm` },
];
const FILE_RE = /href="([^"]*\/excel\/0014-3\.xlsx)"/;

// 公表表の列 (1始まり)。col3.. = 清酒, 合成清酒, 連続式蒸留焼酎, 単式蒸留焼酎, みりん, ビール, 果実酒, 甘味果実酒,
// ウイスキー, ブランデー, 発泡酒, リキュール, スピリッツ等, その他の醸造酒等, 合計(col17)
const CATS = ["清酒", "合成清酒", "連続式蒸留焼酎", "単式蒸留焼酎", "みりん", "ビール", "果実酒", "甘味果実酒", "ウイスキー", "ブランデー", "発泡酒", "リキュール", "スピリッツ等", "その他の醸造酒等"];
const col = (name) => 3 + CATS.indexOf(name);
const TOTAL_COL = 17;

const TARGETS = {
  "alcohol-sales-per-adult-total": (r) => r[TOTAL_COL],
  "alcohol-sales-per-adult-beer": (r) => r[col("ビール")],
  "alcohol-sales-per-adult-sake": (r) => r[col("清酒")],
  "alcohol-sales-per-adult-shochu": (r) => r[col("連続式蒸留焼酎")] + r[col("単式蒸留焼酎")],
  "alcohol-sales-per-adult-wine": (r) => r[col("果実酒")],
  "alcohol-sales-per-adult-whisky": (r) => r[col("ウイスキー")],
};

const cellAt = (row, k) => (k < 1 ? undefined : cellVal(row.getCell(k).value));
const cellVal = (c) => (c && typeof c === "object" && "result" in c ? c.result : c && c.richText ? c.richText.map((t) => t.text).join("") : c);

async function loadWorkbook(index) {
  const html = (await fetchBuffer(index)).toString("latin1");
  const m = html.match(FILE_RE);
  if (!m) throw new Error(`0014-3.xlsx の直リンクを解決できません: ${index}`);
  const url = new URL(m[1], ORIGIN).href;
  console.log(`[fetch] ${url}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await fetchBuffer(url));
  return { wb, url };
}

function perAdultSheet(wb) {
  const ws = wb.worksheets.find((w) => /^13 令和.*成人/.test(w.name));
  if (!ws) throw new Error("令和年度の成人1人当たり表シートが見つかりません");
  const era = ws.name.normalize("NFKC").match(/令和(\d+)年度/);
  if (!era) throw new Error(`シート名から年度を解決できません: ${ws.name}`);
  const year = 2018 + Number(era[1]);
  const rows = new Map(); // 県 -> 数値配列 (index = 列番号)
  let national = null;
  ws.eachRow((row, i) => {
    if (i < 6) return;
    const nameCell = String(cellVal(row.getCell(2).value) ?? "").replace(/[\s　]/g, "");
    if (nameCell === "全国平均") {
      national = Array.from({ length: TOTAL_COL + 1 }, (_, k) => cellAt(row, k));
      return;
    }
    const pref = toFullPrefName(nameCell);
    if (!pref) return; // 計 / 注記
    const vals = [];
    for (let k = 0; k <= TOTAL_COL; k++) vals[k] = cellAt(row, k);
    if (vals.slice(3, TOTAL_COL + 1).some((v) => typeof v !== "number")) throw new Error(`数値でない値: ${pref}`);
    rows.set(pref, vals);
  });
  if (!national) throw new Error("全国平均行が見つかりません");
  return { year, rows, national, sheetName: ws.name };
}

const SUM_TOLERANCE = 0.02; // 国税庁の合計と区分和は最大 0.012L (福井県 2023) ずれる。1L 未満の丸め差として許容

function checkRowSums(rows, label) {
  let maxDiff = 0;
  for (const [pref, r] of rows) {
    const sum = CATS.reduce((s, c) => s + r[col(c)], 0);
    maxDiff = Math.max(maxDiff, Math.abs(sum - r[TOTAL_COL]));
    assertClose(sum, r[TOTAL_COL], SUM_TOLERANCE, `${label} ${pref} 合計=14区分の和`);
  }
  return maxDiff;
}

/** 2025年版 (令和5年度) のみ: 販売数量(Kl)と成人人口(千人)から再計算して公表値と突合。 */
function checkAgainstVolumes(wb, published) {
  const vs = wb.getWorksheet("都道府県別販売（消費数量）");
  const calc = wb.getWorksheet("算出");
  if (!vs || !calc) throw new Error("検算用シート(都道府県別販売（消費数量）/算出)がありません");
  const adults = new Map();
  calc.eachRow((row, i) => {
    if (i < 3) return;
    const pref = toFullPrefName(String(cellVal(row.getCell(1).value) ?? ""));
    if (pref) adults.set(pref, Number(cellVal(row.getCell(2).value)));
  });
  // 販売数量表の列: col4=清酒 ... col14=発泡酒, col15=スピリッツ等, col16=リキュール, col17=その他, col18=合計
  // (1人あたり表とは スピリッツ等/リキュール の並びが逆)
  const volCols = Object.fromEntries(CATS.map((c, k) => [c, 4 + k]));
  volCols["スピリッツ等"] = 15;
  volCols["リキュール"] = 16;
  const volumes = new Map();
  let nationalVol = null;
  vs.eachRow((row, i) => {
    if (i < 5) return;
    const label = String(cellVal(row.getCell(2).value) ?? "").replace(/[\s　]/g, "");
    const lead = String(cellVal(row.getCell(1).value) ?? "").replace(/[\s　]/g, "");
    if (lead.startsWith("全国計")) { nationalVol = Array.from({ length: 19 }, (_, k) => Number(cellAt(row, k))); return; }
    const pref = toFullPrefName(label);
    if (pref) volumes.set(pref, Array.from({ length: 19 }, (_, k) => Number(cellAt(row, k))));
  });
  if (volumes.size !== 46 || adults.size < 46) throw new Error(`検算用データ不足: 販売数量${volumes.size}県 / 成人人口${adults.size}県`);
  let maxDiff = 0;
  for (const [pref, r] of published) {
    const v = volumes.get(pref);
    const pop = adults.get(pref);
    if (!v || !pop) throw new Error(`検算用データ欠落: ${pref}`);
    for (const c of CATS) {
      const recomputed = v[volCols[c]] / pop;
      maxDiff = Math.max(maxDiff, Math.abs(recomputed - r[col(c)]));
      assertClose(recomputed, r[col(c)], 0.0015, `${pref} ${c} 再計算(Kl/千人)`);
    }
    assertClose(v[18] / pop, r[TOTAL_COL], 0.0015, `${pref} 合計 再計算`);
  }
  // 全国計 (Kl) が 46県の和と一致
  for (const c of CATS) {
    const sum = [...volumes.values()].reduce((s, v) => s + v[volCols[c]], 0);
    assertClose(sum, nationalVol[volCols[c]], 1.5, `全国計(Kl) ${c} = 46県の和`);
  }
  console.log(`[verify] 令和5年度: 46県 x 15区分の再計算が公表と一致 (最大差 ${maxDiff.toFixed(5)} L) / 全国計(Kl)が46県の和と一致`);
}

async function main() {
  const rowsByKey = Object.fromEntries(Object.keys(TARGETS).map((k) => [k, []]));
  const seenYears = new Set();
  for (const { edition, index } of EDITIONS) {
    const { wb } = await loadWorkbook(index);
    const { year, rows, national, sheetName } = perAdultSheet(wb);
    if (seenYears.has(year)) continue;
    seenYears.add(year);
    if (rows.size !== 46) throw new Error(`${year}: 都道府県 ${rows.size} 県 (期待 46: 沖縄は表に無い)`);
    if (rows.has("沖縄県")) throw new Error("沖縄県が含まれている (想定外)");
    const sumDiff = checkRowSums(rows, String(year));
    const totals = [...rows.values()].map((r) => r[TOTAL_COL]);
    if (national[TOTAL_COL] < Math.min(...totals) || national[TOTAL_COL] > Math.max(...totals)) throw new Error(`${year}: 全国平均が県の範囲外`);
    if (edition === "2025") checkAgainstVolumes(wb, rows);
    else console.log(`[verify] ${year}年度: 46県の合計=14区分の和 (最大差 ${sumDiff.toFixed(4)} L)、全国平均が県の範囲内 (量の元表なしのため再計算検算は無し)`);
    for (const [key, fn] of Object.entries(TARGETS)) {
      for (const [pref, r] of rows) rowsByKey[key].push({ areaName: pref, yearCode: String(year), value: roundTo(fn(r), 3) });
    }
    console.log(`[parse] ${edition}年版 シート「${sheetName}」→ ${year}年度 ${rows.size}県`);
  }
  for (const [key, rows] of Object.entries(rowsByKey)) writeStatsValues({ metricKey: key, unit: "l", rows, expectedAreas: 46 });
}

main().catch((e) => { console.error(e); process.exit(1); });
