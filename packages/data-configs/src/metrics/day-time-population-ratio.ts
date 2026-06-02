import type { MetricConfig } from "../types";

export const dayTimePopulationRatio: MetricConfig = {
  "key": "day-time-population-ratio",
  "title": "昼夜間人口比率",
  "subtitle": "社会・人口統計体系",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A6108",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2000,
      2005,
      2010,
      2015,
      2020,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
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
  "seoTitle": "昼夜間人口比率ランキング都道府県【2020年】｜1位東京都（116.1％）",
  "seoDescription": "2020年の昼夜間人口比率の都道府県別ランキング。1位東京都（116.1％）、最下位埼玉県（89.6％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
