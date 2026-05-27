import type { MetricConfig } from "../types";

export const outflowPopulationRatio: MetricConfig = {
  "key": "outflow-population-ratio",
  "title": "流出人口比率",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05305",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1980,
      2020,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "流出人口比率ランキング都道府県【2020年】｜1位埼玉県（13.89％）",
  "seoDescription": "2020年の流出人口比率の都道府県別ランキング。1位埼玉県（13.89％）、最下位北海道（0.1％）で138.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
