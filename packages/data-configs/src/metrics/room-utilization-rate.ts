import type { MetricConfig } from "../types";

export const roomUtilizationRate: MetricConfig = {
  "key": "room-utilization-rate",
  "title": "客室稼働率",
  "unit": "％",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G04308",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2024,
    ],
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
  "seoTitle": "客室稼働率ランキング都道府県【2024年】｜1位東京都（80.4％）",
  "seoDescription": "2024年の客室稼働率の都道府県別ランキング。1位東京都（80.4％）、最下位長野県（57.8％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
