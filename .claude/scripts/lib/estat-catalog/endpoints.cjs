"use strict";

/**
 * e-Stat API のエンドポイント URL (副作用なし・依存なし)。
 *
 * api.mjs は import 時に .env.local を dotenv で読み込み undici も引くため、URL だけが欲しい
 * スクリプトが api.mjs を import すると環境変数の読み込みが副作用として増える。
 * URL 定数だけをここに分け、api.mjs も同じ値をここから取る (.mjs / .cjs / tsx のどこからでも読める)。
 */
const ESTAT_API_BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json";
const ESTAT_STATS_LIST_URL = `${ESTAT_API_BASE_URL}/getStatsList`;
const ESTAT_META_INFO_URL = `${ESTAT_API_BASE_URL}/getMetaInfo`;
const ESTAT_STATS_DATA_URL = `${ESTAT_API_BASE_URL}/getStatsData`;

module.exports = {
  ESTAT_API_BASE_URL,
  ESTAT_STATS_LIST_URL,
  ESTAT_META_INFO_URL,
  ESTAT_STATS_DATA_URL,
};
