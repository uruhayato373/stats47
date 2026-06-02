/**
 * 47 都道府県の 2 桁コードと名称（駅乗降客数の焦点県セレクタ用）。
 *
 * 実体は `@stats47/area` の `PREFECTURE_LIST_2DIGIT`（prefectures.json 5 桁 SSOT から派生）。
 * 各 feature で 47 件配列を再定義しないための互換 re-export。
 */
export { PREFECTURE_LIST_2DIGIT as PREFECTURES } from "@stats47/area";
