import type { MetricConfig } from "../types";

export const singlePersonHouseholdRatio: MetricConfig = {
  "key": "single-person-household-ratio",
  "title": "単独世帯割合",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06205",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  "seoTitle": "単独世帯割合ランキング都道府県【2020年】｜1位東京都（50.24％）",
  "seoDescription": "2020年の単独世帯割合の都道府県別ランキング。1位東京都（50.24％）、最下位山形県（28.43％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
