import type { MetricConfig } from "../types";

export const disabledJobRatioPer1000: MetricConfig = {
  "key": "disabled-job-ratio-per-1000",
  "title": "就職者に占める身体障害者の比率",
  "unit": "就職件数千対",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1989,
    "to": 2018,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "就職者に占める身体障害者の比率ランキング都道府県【2018年】｜1位大阪府（39.51‐）",
  "seoDescription": "2018年の就職者に占める身体障害者の比率の都道府県別ランキング。1位大阪府（39.51‐）、最下位秋田県（15.63‐）で2.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
