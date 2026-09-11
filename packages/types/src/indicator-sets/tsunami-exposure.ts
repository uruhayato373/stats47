// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/tsunami-exposure.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const TSUNAMI_EXPOSURE_SET: IndicatorSet = {
  "key": "tsunami-exposure",
  "title": "津波と沿岸防災",
  "description": "内閣府調査の津波避難ビル・津波避難タワー等の整備数を比較します。40県が調査対象で、対象外7県は0件と扱いません。2023年には洪水対応用施設を除外した自治体があるため、2021年からの減少を撤去や防災後退と解釈しません。施設数は浸水人口や危険度とは異なります。別表では29都道府県の公表資料に250m人口と2022年の市町村役場等・公的集会施設を重ね、県ごとの原表の浸水深区分で確認します。想定年と沿岸範囲は県ごとに異なり、歴史的な固定版を含みます。東京都は島しょ11島の想定で、本土等の未対象と9町村内の非該当・未判定を保持します。許諾・提供範囲等により未集計の県を0とせず、安全順位や全国合計は示しません。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "tsunami-evacuation-building-count",
      "shortLabel": "津波避難ビル整備数",
      "role": "primary"
    },
    {
      "rankingKey": "tsunami-evacuation-tower-count",
      "shortLabel": "津波避難タワー等整備数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "津波",
    "避難ビル",
    "避難タワー",
    "沿岸防災"
  ]
};
