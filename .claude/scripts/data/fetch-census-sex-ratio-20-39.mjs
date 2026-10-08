#!/usr/bin/env node
/**
 * 国勢調査の 20〜39 歳人口の性比 (男÷女×100) を都道府県別に作り、
 * `.local/r2/app/stats/sex-ratio-age-20-39/values.json` へ書く。
 *
 * 入力: 社会・人口統計体系 (e-Stat 0000010101) の 5 歳階級別人口 8 系列 (男女 × 20-24/25-29/30-34/35-39)。
 *   A120501/A120502 (20〜24)・A120601/A120602 (25〜29)・A120701/A120702 (30〜34)・A120801/A120802 (35〜39)。
 *   既存 metric theme-population-pyramid-<age>-<male|female> の観測値 (R2 app/stats) をそのまま使う。
 *   入力が無いときは先に `npx tsx apps/web/scripts/page-data-batch.ts --metric <key>` で 8 本を取り込む。
 *
 * 採用年: 国勢調査年の 2015 と 2020 のみ。両年は総務省統計局「令和2年国勢調査 人口等基本集計 結果の概要」
 *   (https://www.stat.go.jp/data/kokusei/2020/kekka/pdf/outline_01.pdf) の「補完前の集計結果(原数値)」
 *   5 歳階級別人口の全国値と、47 県合計が完全一致することを確認した年。他の年は同様の照合を取れていないので載せない。
 *
 * 検算 (崩れたら書かずに止まる): 47 県が欠測なく揃う / 年齢階級ごとの男女計の 47 県合計 = 公表全国値 (完全一致)。
 *
 * 実行: node .claude/scripts/data/fetch-census-sex-ratio-20-39.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, writeStatsValues, roundTo, assertClose, PREF_NAMES } from "./lib/stats-values-writer.mjs";

const AGES = ["20-24", "25-29", "30-34", "35-39"];
/** 国勢調査 結果の概要「補完前の集計結果(原数値)」年齢(5歳階級)別人口・男女計の全国値 */
const NATIONAL = {
  "2015": { "20-24": 5968127, "25-29": 6409612, "30-34": 7290878, "35-39": 8316157 },
  "2020": { "20-24": 5931306, "25-29": 6031964, "30-34": 6484594, "35-39": 7311567 },
};

function readSeries(age, sex) {
  const key = `theme-population-pyramid-${age}-${sex}`;
  const p = path.join(PROJECT_ROOT, ".local/r2/app/stats", key, "values.json");
  if (!fs.existsSync(p)) throw new Error(`入力が無い: ${p} (page-data-batch で ${key} を先に取り込む)`);
  return JSON.parse(fs.readFileSync(p, "utf8")).rows;
}

const pop = {}; // year -> sex -> pref -> sum
for (const age of AGES) {
  for (const sex of ["male", "female"]) {
    for (const r of readSeries(age, sex)) {
      if (!NATIONAL[r.yearCode]) continue;
      const slot = ((pop[r.yearCode] ??= {})[sex] ??= {});
      slot[r.areaName] = (slot[r.areaName] ?? 0) + r.value;
      ((pop[r.yearCode].byAge ??= {})[age] ??= 0);
      pop[r.yearCode].byAge[age] += r.value;
    }
  }
}

const rows = [];
for (const [year, nat] of Object.entries(NATIONAL)) {
  for (const age of AGES) assertClose(pop[year].byAge[age], nat[age], 0, `${year} ${age} 男女計 47県合計 vs 公表全国値`);
  console.log(`[verify] ${year}: 4階級とも 47県合計 = 公表全国値 (補完前)`);
  for (const name of PREF_NAMES) {
    const m = pop[year].male?.[name];
    const f = pop[year].female?.[name];
    if (!(m > 0 && f > 0)) throw new Error(`${year} ${name}: 男女いずれかが欠測 (${m}/${f})`);
    rows.push({ areaName: name, yearCode: year, value: roundTo((m / f) * 100, 1) });
  }
}
writeStatsValues({ metricKey: "sex-ratio-age-20-39", unit: "（女=100）", rows, yearName: (y) => `${y}年` });
