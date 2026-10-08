#!/usr/bin/env node
/**
 * 厚生労働省「熱中症による死亡数 人口動態統計(確定数)より」の「都道府県別にみた熱中症による死亡数の
 * 年次推移(平成25年〜令和6年)」xlsx から、都道府県別の熱中症死亡数 (総数) を取り出して
 * `.local/r2/app/stats/heatstroke-deaths/values.json` へ書く。
 *
 * 出典: https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/tokusyu/necchusho24/index.html
 *   実ファイル: .../necchusho24/xls/R06necchusho.xlsx (SHA-256 固定) シート「都道府県別」
 *   値は住所地ベースの死亡数。表中の「-」は該当数字なし = 0 として扱う。
 *
 * 検算 (どれか一つでも崩れたら書かずに止まる):
 *   - xlsx の SHA-256 が固定値と一致 / 年見出しが 2024..2013 の 12 年分
 *   - 47 県が各年に欠測・重複なく並ぶ / 県ごとに 男 + 女 = 総数
 *   - 全国 = 男 + 女、47 県の総数合計 <= 全国 (全国は住所地が外国・不詳を含む注記) で差が小さい
 *   - 全国の総数がシート「年齢別」の総数行 (別表) と全年で一致
 *
 * 実行: node .claude/scripts/data/fetch-heatstroke-deaths-mhlw.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { fetchBuffer, toFullPrefName, writeStatsValues, PREF_NAMES } from "./lib/stats-values-writer.mjs";

const XLSX_URL = "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/tokusyu/necchusho24/xls/R06necchusho.xlsx";
const XLSX_SHA256 = "b59c31b00f45cb70d47bb2e83a761c6beb7b241dc57160524f6f618b35afefc4";
const METRIC_KEY = "heatstroke-deaths";
const YEARS = Array.from({ length: 12 }, (_, i) => String(2024 - i));
/** 全国と 47 県合計の許容差 (住所地が外国・不詳の分)。2013-2024 の実測は 0〜数人。 */
const RESIDUAL_MAX = 10;

function cellVal(v) {
  if (v && typeof v === "object" && Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("");
  if (v && typeof v === "object" && "result" in v) return v.result;
  return v;
}
const norm = (s) => String(s ?? "").normalize("NFKC").replace(/[\s　]/g, "");
function toCount(v, where) {
  const x = cellVal(v);
  if (typeof x === "number") return x;
  const s = norm(x);
  if (s === "-" || s === "－" || s === "‐" || s === "―") return 0;
  const n = Number(s.replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new Error(`数値でないセル ${where}: ${JSON.stringify(x)}`);
  return n;
}

const buf = await fetchBuffer(XLSX_URL);
const sha = createHash("sha256").update(buf).digest("hex");
if (sha !== XLSX_SHA256) throw new Error(`xlsx の SHA-256 が固定値と不一致: ${sha}`);
const wb = new ExcelJS.Workbook();
await wb.xlsx.load(buf);

// --- 都道府県別シート ---
const ws = wb.getWorksheet("都道府県別");
if (!ws) throw new Error("シート「都道府県別」がありません");
const yearRow = ws.getRow(5);
const subRow = ws.getRow(6);
const cols = []; // {year, total, male, female} の列番号
for (let c = 2; c <= ws.columnCount; c += 3) {
  const y = norm(cellVal(yearRow.getCell(c).value)).match(/\((\d{4})\)/)?.[1];
  const heads = [c, c + 1, c + 2].map((k) => norm(cellVal(subRow.getCell(k).value)));
  if (!y || heads.join("|") !== "総数|男|女") throw new Error(`見出しが想定外: col ${c} ${y} ${heads}`);
  cols.push({ year: y, total: c, male: c + 1, female: c + 2 });
}
if (cols.map((x) => x.year).join() !== YEARS.join()) throw new Error(`年見出しが想定外: ${cols.map((x) => x.year)}`);

const national = {};
const prefs = new Map(); // 県 -> {year -> {t,m,f}}
ws.eachRow((row, i) => {
  if (i < 7) return;
  const label = norm(cellVal(row.getCell(1).value)).replace(/^\d+/, "").replace(/[0-9)）]+$/, "");
  const isNational = label.startsWith("全国");
  const pref = isNational ? null : toFullPrefName(label);
  if (!isNational && !pref) return; // 注記
  const rec = {};
  for (const c of cols) {
    rec[c.year] = {
      t: toCount(row.getCell(c.total).value, `${label} ${c.year} 総数`),
      m: toCount(row.getCell(c.male).value, `${label} ${c.year} 男`),
      f: toCount(row.getCell(c.female).value, `${label} ${c.year} 女`),
    };
  }
  if (isNational) Object.assign(national, rec);
  else {
    if (prefs.has(pref)) throw new Error(`県の重複: ${pref}`);
    prefs.set(pref, rec);
  }
});
if (prefs.size !== 47) throw new Error(`県数 ${prefs.size} != 47`);
for (const n of PREF_NAMES) if (!prefs.has(n)) throw new Error(`${n} の行がありません`);

// --- 年齢別シートの総数行 (全国の独立照合) ---
const wa = wb.getWorksheet("年齢別");
if (!wa) throw new Error("シート「年齢別」がありません");
const ageHead = wa.getRow(6);
const ageTotal = wa.getRow(7);
if (norm(cellVal(ageTotal.getCell(1).value)) !== "総数") throw new Error("年齢別シート 7 行目が総数行ではありません");
const ageByYear = {};
for (let c = 2; c <= wa.columnCount; c++) {
  const y = norm(cellVal(ageHead.getCell(c).value)).match(/\((\d{4})\)/)?.[1];
  if (y) ageByYear[y] = toCount(ageTotal.getCell(c).value, `年齢別 総数 ${y}`);
}

// --- 検算 ---
const rows = [];
for (const y of YEARS) {
  let sum = 0;
  for (const [name, rec] of prefs) {
    const r = rec[y];
    if (r.m + r.f !== r.t) throw new Error(`${name} ${y}: 男 ${r.m} + 女 ${r.f} != 総数 ${r.t}`);
    sum += r.t;
    rows.push({ areaName: name, yearCode: y, value: r.t });
  }
  const nat = national[y];
  if (nat.m + nat.f !== nat.t) throw new Error(`全国 ${y}: 男女の合計が総数と不一致`);
  const residual = nat.t - sum;
  if (residual < 0 || residual > RESIDUAL_MAX) throw new Error(`${y}: 全国 ${nat.t} と 47 県合計 ${sum} の差 ${residual} が許容外`);
  if (ageByYear[y] !== nat.t) throw new Error(`${y}: 都道府県別シートの全国 ${nat.t} != 年齢別シートの総数 ${ageByYear[y]}`);
  console.log(`[verify] ${y}: 47県合計 ${sum} / 全国 ${nat.t} (差 ${residual} = 外国・不詳) / 年齢別シート総数 ${ageByYear[y]} 一致`);
}

writeStatsValues({ metricKey: METRIC_KEY, unit: "人", rows, yearName: (y) => `${y}年` });
