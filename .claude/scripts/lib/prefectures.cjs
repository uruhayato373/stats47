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
const path = require("node:path");
const { datasetPath } = require("../../../config/datasets.mjs");

const PREFECTURES = require(path.resolve(__dirname, "../../..", datasetPath("areas.prefectures")));

const PREF_AREA_CODES = PREFECTURES.map((p) => p.prefCode);
const PREF_NAMES = PREFECTURES.map((p) => p.prefName);

module.exports = {
  PREFECTURES,
  PREF_AREA_CODES,
  PREF_NAMES,
};
