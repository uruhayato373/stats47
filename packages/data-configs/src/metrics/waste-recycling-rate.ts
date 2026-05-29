import type { MetricConfig } from "../types";

export const wasteRecyclingRate: MetricConfig = {
  "key": "waste-recycling-rate",
  "title": "ごみのリサイクル率",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H055031",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
  "seoTitle": "ごみのリサイクル率ランキング都道府県【2023年】｜1位岡山県（29％）",
  "seoDescription": "2023年のごみのリサイクル率の都道府県別ランキング。1位岡山県（29％）、最下位和歌山県（11.9％）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
