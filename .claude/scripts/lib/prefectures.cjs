"use strict";

/**
 * 47 都道府県の一覧を Node スクリプトへ渡す共通モジュール。
 *
 * 値の正本は台帳 areas.prefectures (data/areas/master/prefectures.json。JIS 順・prefCode は 5 桁 "01000".."47000")。
 * .mjs からも名前付き import で読める (例: PREF_AREA_CODES を lib/prefectures.cjs から取り出す)。
 *   - PREFECTURES      JSON の全要素 (prefCode / prefName / romaji …)
 *   - PREF_AREA_CODES  5 桁コード 47 件 ("01000".."47000")
 *   - PREF_NAMES       正式名 47 件 ("北海道" "青森県" … "沖縄県")
 *   - 変換と判定      to2DigitPrefCode / to5DigitPrefCode / prefectureAreaCodeOf / isNationalAreaCode /
 *                     isOkinawaAreaCode / NATIONAL_AREA_CODE / PREFECTURE_COUNT (packages/area/src/utils/area-code.ts の鏡)
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

/** e-Stat の全国行 areaCode (packages/area/src/utils/area-code.ts の鏡) */
const NATIONAL_AREA_CODE = "00000";
/** 都道府県の数 (台帳の件数と一致) */
const PREFECTURE_COUNT = PREFECTURES.length;

/**
 * 地域コードを 2 桁の都道府県コードにする (packages/area の to2DigitPrefCode の鏡。同じ入力で一致することをテストで固定)
 * @param {string | number} code
 */
function to2DigitPrefCode(code) {
  const s = String(code).trim();
  if (s.length <= 2) return s.padStart(2, "0");
  if (s.length === 4) return s.padStart(5, "0").slice(0, 2);
  return s.slice(0, 2);
}

/** @param {string | number} code 市区町村コードなら所属する県の 5 桁 */
function to5DigitPrefCode(code) {
  return `${to2DigitPrefCode(code)}000`;
}

/** @param {string | number} code */
function prefectureAreaCodeOf(code) {
  return to5DigitPrefCode(code);
}

/** @param {string | number} code */
function isNationalAreaCode(code) {
  return String(code).trim() === NATIONAL_AREA_CODE;
}

/** @param {string | number} code */
function isOkinawaAreaCode(code) {
  return to2DigitPrefCode(code) === "47";
}

/** @param {string} code */
function isPrefectureAreaCode(code) {
  return prefectureCodes.has(String(code));
}

/** @param {string} code */
function isCityAreaCode(code) {
  return /^\d{5}$/.test(code) && prefectureCodes.has(code.slice(0, 2) + '000') && !code.endsWith('000');
}

module.exports = {
  NATIONAL_AREA_CODE,
  PREFECTURE_COUNT,
  to2DigitPrefCode,
  to5DigitPrefCode,
  prefectureAreaCodeOf,
  isNationalAreaCode,
  isOkinawaAreaCode,
  isPrefectureAreaCode,
  isCityAreaCode,
  PREFECTURES,
  PREF_AREA_CODES,
  PREF_NAMES,
};
