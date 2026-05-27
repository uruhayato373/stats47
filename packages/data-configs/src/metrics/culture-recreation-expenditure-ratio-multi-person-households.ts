import type { MetricConfig } from "../types";

export const cultureRecreationExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "culture-recreation-expenditure-ratio-multi-person-households",
  "title": "教養娯楽費割合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02419",
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "教養娯楽費割合ランキング都道府県【2024年】｜1位東京都（11％）",
  "seoDescription": "2024年の教養娯楽費割合の都道府県別ランキング。1位東京都（11％）、最下位長崎県（7.5％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
