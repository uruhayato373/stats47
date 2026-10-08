#!/usr/bin/env node
/**
 * 令和6年(2024)国民健康・栄養調査 第4部「都道府県別結果」から、BMI と男性の習慣的喫煙者割合
 * (都道府県別・年齢調整値) を取り出して `.local/r2/app/stats/<key>/values.json` へ書く。
 *
 * 出典: 厚生労働省「令和6年国民健康・栄養調査報告」第4部 都道府県別結果 (PDF, SHA-256 固定)
 *   https://www.mhlw.go.jp/content/001675215.pdf
 *   版一覧: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html
 *   第66表 BMI の平均値 (20〜69歳男性・40〜69歳女性、年齢調整値)
 *   第70表 現在習慣的に喫煙している者の割合 (20歳以上男性、年齢調整値)
 *
 * 出力 metric:
 *   bmi-male-20to69-age-adjusted     第66表 男性 平均値 (kg/m²)
 *   bmi-female-40to69-age-adjusted   第66表 女性 平均値 (kg/m²)
 *   smoking-rate-male-age-adjusted   第70表 男性 割合 (%)
 *
 * 検算 (どれか一つでも崩れたら書かずに止まる):
 *   - PDF の SHA-256 が固定値と一致 / 表見出しが想定どおり / 年齢調整の注記 (平均年齢) が想定どおり
 *   - 47 県が欠測・重複なく並ぶ / 各県で 95%CI 下限 <= 平均 <= 上限
 *   - 県別人数の合計 = 表の全国人数 (BMI 男性/女性、喫煙) = 公表値と一致
 *   - 人数で重み付けした県平均が表の全国値の許容内 (年齢調整・無回答処理で厳密一致はしない)
 *
 * 95%CI と人数は values.json には入らない (配信は平均値のみ)。標本調査なので順位差を有意差と読まないこと。
 *
 * 実行: node .claude/scripts/data/fetch-nhns-2024-prefecture.mjs   (要 pdftotext)
 * 正典: .claude/rules/data-provenance-standards.md
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fetchBuffer, makeWorkDir, writeStatsValues, roundTo, PREF_NAMES } from "./lib/stats-values-writer.mjs";

const PDF_URL = "https://www.mhlw.go.jp/content/001675215.pdf";
const PDF_SHA256 = "ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1";
const YEAR_CODE = "2024";
const YEAR_NAME = "2024年10〜11月";

/** pdftotext -layout の 1 ページ分から「県名 + 数値列」の行を取る。 */
function parseRows(pageText, nTokens) {
  const rows = new Map();
  for (const line of pageText.split("\n")) {
    const m = line.match(/^\s*(北海道|.{2,3}[都府県]|全国)\s+(.+?)\s*$/);
    if (!m) continue;
    const name = m[1];
    const tokens = m[2].trim().split(/\s+/);
    if (tokens.length !== nTokens) continue;
    const nums = tokens.map((t) => Number(t.replace(/,/g, "")));
    if (nums.some((n) => !Number.isFinite(n))) continue;
    if (rows.has(name)) throw new Error(`県名の重複: ${name}`);
    rows.set(name, nums);
  }
  return rows;
}

/** 1 系列 (人数, 平均, 下限, 上限) を検算して返す。 */
function checkSeries(label, rows, offset, { nationalN, nationalMean, weightedTol }) {
  const prefs = PREF_NAMES.map((n) => {
    const r = rows.get(n);
    if (!r) throw new Error(`${label}: ${n} の行がありません`);
    const [n_, mean, lo, hi] = r.slice(offset, offset + 4);
    if (!(Number.isInteger(n_) && n_ > 0)) throw new Error(`${label} ${n}: 人数が不正 ${n_}`);
    if (!(lo <= mean && mean <= hi)) throw new Error(`${label} ${n}: 95%CI が平均を含まない ${lo}/${mean}/${hi}`);
    return { name: n, n: n_, mean };
  });
  const nat = rows.get("全国");
  if (!nat) throw new Error(`${label}: 全国行がありません`);
  const [natN, natMean] = nat.slice(offset, offset + 4);
  const sumN = prefs.reduce((s, p) => s + p.n, 0);
  if (sumN !== natN) throw new Error(`${label}: 県別人数の合計 ${sumN} != 全国人数 ${natN}`);
  if (natN !== nationalN) throw new Error(`${label}: 全国人数 ${natN} != 期待 ${nationalN}`);
  if (natMean !== nationalMean) throw new Error(`${label}: 全国平均 ${natMean} != 期待 ${nationalMean}`);
  const weighted = prefs.reduce((s, p) => s + p.mean * p.n, 0) / sumN;
  if (Math.abs(weighted - natMean) > weightedTol) {
    throw new Error(`${label}: 人数加重平均 ${weighted.toFixed(3)} が全国値 ${natMean} から ${weightedTol} 超ずれ`);
  }
  console.log(`[verify] ${label}: 47県 / 人数合計 ${sumN}=全国 ${natN} / 全国平均 ${natMean} / 人数加重平均 ${weighted.toFixed(2)} (許容 ${weightedTol})`);
  return { prefs, national: natMean };
}

async function main() {
  const dir = makeWorkDir("nhns2024");
  const pdfPath = path.join(dir, "nhns2024.pdf");
  const buf = await fetchBuffer(PDF_URL);
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== PDF_SHA256) throw new Error(`PDF の SHA-256 が固定値と不一致: ${sha}`);
  fs.writeFileSync(pdfPath, buf);
  const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  const pages = text.split("\f");

  const pageOf = (re) => {
    const i = pages.findIndex((p) => re.test(p));
    if (i < 0) throw new Error(`表が見つかりません: ${re}`);
    return { text: pages[i], pdfPage: i + 1 };
  };

  // --- 第66表 BMI ---
  const t66 = pageOf(/第\s*66\s*表\s+BMI\s*の平均値/);
  if (!/男性（20[‑-]69\s*歳）/.test(t66.text) || !/女性（40[‑-]69\s*歳）/.test(t66.text)) throw new Error("第66表の対象年齢の見出しが想定外");
  if (!/男性\s*50\s*歳，女性\s*56\s*歳/.test(t66.text)) throw new Error("第66表の年齢調整の平均年齢(男50/女56)が想定外");
  if (!t66.text.includes("kg/m2")) throw new Error("第66表の単位が kg/m2 ではない");
  const r66 = parseRows(t66.text, 8);
  const bmiMale = checkSeries("BMI男性", r66, 0, { nationalN: 3795, nationalMean: 23.9, weightedTol: 0.3 });
  const bmiFemale = checkSeries("BMI女性", r66, 4, { nationalN: 3435, nationalMean: 22.3, weightedTol: 0.3 });

  // --- 第70表 男性喫煙 ---
  const t70 = pageOf(/第\s*70\s*表\s+現在習慣的に喫煙している者の割合/);
  if (!/男性（20\s*歳以上）/.test(t70.text)) throw new Error("第70表の対象の見出しが想定外");
  if (!/平均年齢\s*（59\s*歳）|平均年齢（59\s*歳）/.test(t70.text.replace(/\s+/g, "")) && !t70.text.includes("59 歳")) throw new Error("第70表の年齢調整の平均年齢(59歳)が想定外");
  const r70 = parseRows(t70.text, 4);
  const smoke = checkSeries("喫煙男性", r70, 0, { nationalN: 9012, nationalMean: 24.2, weightedTol: 1.0 });

  const out = [
    { key: "bmi-male-20to69-age-adjusted", unit: "kg/m²", series: bmiMale, decimals: 1, page: t66.pdfPage },
    { key: "bmi-female-40to69-age-adjusted", unit: "kg/m²", series: bmiFemale, decimals: 1, page: t66.pdfPage },
    { key: "smoking-rate-male-age-adjusted", unit: "%", series: smoke, decimals: 1, page: t70.pdfPage },
  ];
  for (const o of out) {
    const rows = o.series.prefs.map((p) => ({ areaName: p.name, yearCode: YEAR_CODE, value: roundTo(p.mean, o.decimals) }));
    writeStatsValues({ metricKey: o.key, unit: o.unit, rows, yearName: () => YEAR_NAME });
    console.log(`[info] ${o.key}: 全国(表) ${o.series.national} / pdfPage ${o.page}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
