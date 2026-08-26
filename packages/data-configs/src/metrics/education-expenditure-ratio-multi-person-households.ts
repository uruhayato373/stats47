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
  "seoTitle": "教育費割合 都道府県ランキング【2024年】｜1位埼玉県（6.0％）",
  "seoDescription": "2024年の教育費割合を都道府県別に比較。1位は埼玉県（6.0％）、最下位は秋田県（0.9％）、最大と最小の差は6.7倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
