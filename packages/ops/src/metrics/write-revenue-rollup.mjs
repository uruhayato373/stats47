/**
 * 収益の明細 (data/revenue/daily) から、週・月・年の集計 data/revenue/rollup/{weekly,monthly,yearly}.json を書く。
 *
 * 集計の計算は revenue-rollup.mjs の rollup() に任せ、ここは読み込みと書き出しだけを持つ。
 * - 明細が 1 件も無い環境では何も書かずに終わる (空の集計で既存の生成物を消さない)
 * - 取得範囲の外の日がある期間は revenueYen / orders が null のまま書く (欠測を 0 にしない)
 * - 生成物なので手で編集しない。同じ明細からは同じファイルができる (生成時刻を持たない)
 *
 * 使い方: node packages/ops/src/metrics/write-revenue-rollup.mjs
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../../config/datasets.mjs";
import { rollup } from "./revenue-rollup.mjs";

const GRAINS = /** @type {const} */ ([
  { grain: "week", file: "weekly.json" },
  { grain: "month", file: "monthly.json" },
  { grain: "year", file: "yearly.json" },
]);

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(here, "../../../..");

/** 明細の全ファイルを読む。置き場が無い・空なら [] */
export function readDailyDocs(root = DEFAULT_ROOT) {
  const dir = join(root, datasetDir("revenue.daily"));
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
}

/**
 * 明細から書き出すファイルの内容を作る (純関数)。明細が無ければ空の配列。
 * @param {Array<any>} docs
 * @returns {Array<{file:string, body:{schemaVersion:1, grain:string, rows:Array<object>}}>}
 */
export function buildRollupFiles(docs) {
  if (docs.length === 0) return [];
  return GRAINS.map(({ grain, file }) => ({ file, body: { schemaVersion: 1, grain, rows: rollup(docs, grain) } }));
}

/**
 * @param {{root?:string}} [opts]
 * @returns {{written:string[]}} 書いたファイルの相対パス。明細が無ければ空
 */
export function writeRevenueRollup({ root = DEFAULT_ROOT } = {}) {
  const files = buildRollupFiles(readDailyDocs(root));
  if (files.length === 0) return { written: [] };
  const outDir = join(root, datasetDir("revenue.rollup"));
  mkdirSync(outDir, { recursive: true });
  const written = [];
  for (const { file, body } of files) {
    writeFileSync(join(outDir, file), `${JSON.stringify(body, null, 2)}\n`);
    written.push(join(datasetDir("revenue.rollup"), file));
  }
  return { written };
}

const invokedAsScript = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const { written } = writeRevenueRollup();
  console.log(written.length === 0 ? "[revenue-rollup] 明細が無いので何も書かなかった" : `[revenue-rollup] 書いた: ${written.join(", ")}`);
}
