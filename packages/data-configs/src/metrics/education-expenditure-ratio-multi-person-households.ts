import type { MetricConfig } from "../types";

export const educationExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "education-expenditure-ratio-multi-person-households",
  "title": "教育費割合",
  "subtitle": "複数人世帯",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02418",
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
  "seoTitle": "教育費割合ランキング都道府県【2024年】｜1位東京都（6％）",
  "seoDescription": "2024年の教育費割合の都道府県別ランキング。1位東京都（6％）、最下位秋田県（0.9％）で6.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
