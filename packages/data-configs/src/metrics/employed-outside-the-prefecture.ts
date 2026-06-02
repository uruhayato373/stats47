import type { MetricConfig } from "../types";

export const employedOutsideThePrefecture: MetricConfig = {
  "key": "employed-outside-the-prefecture",
  "title": "県外就職者比率",
  "subtitle": "〜2020年",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0310201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "県外就職者比率ランキング都道府県【2024年】｜1位埼玉県（32.9％）",
  "seoDescription": "2024年の県外就職者比率の都道府県別ランキング。1位埼玉県（32.9％）、最下位北海道（4.9％）で6.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
