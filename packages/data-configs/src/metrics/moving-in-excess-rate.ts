import type { MetricConfig } from "../types";

export const movingInExcessRate: MetricConfig = {
  "key": "moving-in-excess-rate",
  "title": "転入超過率",
  // e-Stat #A05307 は無印の総数系 (外国人含む)。#A05301 (日本人移動者) との区別。
  // 旧 subtitle「外国人移動者」は外国人限定の系列と誤読させるため 2026-09-01 に是正。
  "subtitle": "外国人移動者を含む",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05307",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2020,
      2024,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
    "divergingMidpoint": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "転入超過率ランキング都道府県【2024年】｜1位東京都（0.56％）",
  "seoDescription": "2024年の転入超過率の都道府県別ランキング。1位東京都（0.56％）、最下位高知県（-0.48％）で-1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
