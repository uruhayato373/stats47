"use strict";

/**
 * 47 都道府県の一覧を Node スクリプトへ渡す共通モジュール。
 *
 * 値の正本は台帳 areas.prefectures (data/areas/master/prefectures.json。JIS 順・prefCode は 5 桁 "01000".."47000")。
 * .mjs からも名前付き import で読める (例: PREF_AREA_CODES を lib/prefectures.cjs から取り出す)。
 *   - PREFECTURES      JSON の全要素 (prefCode / prefName / romaji …)
 *   - PREF_AREA_CODES  5 桁コード 47 件 ("01000".."47000")
 *   - PREF_NAMES       正式名 47 件 ("北海道" "青森県" … "沖縄県")
 * 短縮名 (「東京」等) や独自順序が必要な箇所はこの一覧を使わず、各スクリプト側で定義する。
 */
const fs = require("node:fs");
const path = require("node:path");

// 台帳の置き場の正本はカタログ config/datasets.mjs の areas.prefectures の行。
// このファイルから ESM を require() では読まない。internal-link-lint.mjs のように、ESM の import でこのファイルと
// datasets.mjs の両方を読むスクリプトで ERR_REQUIRE_CYCLE_MODULE になった (2026-11-14 週次監査 internal-links・
// Node v20.19.0)。require(esm) をやめれば import の順序に依らない。行の文字列だけを読む。
const CATALOG = "config/datasets.mjs";
const CATALOG_ROW = /\bd\(\s*"areas\.prefectures"\s*,\s*"([^"]+)"/;

// 起点 (モジュールの場所、無ければ起動ディレクトリ) から上へ、relativePath の実体を探す。
// Turbopack は __dirname を /ROOT に置き換えるため、モジュールの場所に実体が無いことがある。
function findUp(relativePath) {
  const modulePath = path.resolve(__dirname, "../../..", relativePath);
  if (fs.existsSync(modulePath)) return modulePath;
  let directory = process.cwd();
  while (true) {
    const candidate = path.join(directory, relativePath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

function prefecturesPath() {
  const catalog = findUp(CATALOG);
  const row = catalog && CATALOG_ROW.exec(fs.readFileSync(catalog, "utf8"));
  const prefectures = row && findUp(row[1]);
  if (!prefectures) throw new Error("areas.prefectures の台帳を解決できません");
  return prefectures;
}
const PREFECTURES = JSON.parse(
  fs.readFileSync(prefecturesPath(), "utf8"),
);

const PREF_AREA_CODES = PREFECTURES.map((p) => p.prefCode);
const PREF_NAMES = PREFECTURES.map((p) => p.prefName);

const prefectureCodes = new Set(PREF_AREA_CODES);

/** @param {string} code */
function isPrefectureAreaCode(code) {
  return prefectureCodes.has(String(code));
}

/** @param {string} code */
function isCityAreaCode(code) {
  return /^\d{5}$/.test(code) && prefectureCodes.has(code.slice(0, 2) + '000') && !code.endsWith('000');
}

module.exports = {
  isPrefectureAreaCode,
  isCityAreaCode,
  PREFECTURES,
  PREF_AREA_CODES,
  PREF_NAMES,
};
