import type { MetricConfig } from "../types";

export const partTimeEmploymentRateRegular: MetricConfig = {
  "key": "part-time-employment-rate-regular",
  "title": "パートタイム就職率",
  "subtitle": "常用",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0320101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1978,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "パートタイム就職率ランキング都道府県【2021年】｜1位秋田県（10.3％）",
  "seoDescription": "2021年のパートタイム就職率の都道府県別ランキング。1位秋田県（10.3％）、最下位東京都（3.8％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
