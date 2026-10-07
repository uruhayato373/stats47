import type { MetricConfig } from "../types";

export const movingInRate: MetricConfig = {
  "key": "moving-in-rate",
  "title": "転入率",
  "subtitle": "外国人移動者",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05308",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2020,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        2014,
        2015,
        2016,
        2017,
        2018,
        2019,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "転入率ランキング都道府県【2024年】｜1位東京都（3.25％）",
  "seoDescription": "2024年の転入率の都道府県別ランキング。1位東京都（3.25％）、最下位北海道（1.06％）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
