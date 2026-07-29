import type { MetricConfig } from "../types";

export const foreignResidentCountUsaPer100k: MetricConfig = {
  "key": "foreign-resident-count-usa-per-100k",
  "title": "外国人人口",
  "subtitle": "米国籍（10万人当たり）",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0160103",
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "foreign-resident-count-usa",
  "seoTitle": "外国人人口ランキング都道府県【2020年】｜1位沖縄県（196.7人）",
  "seoDescription": "2020年の外国人人口の都道府県別ランキング。1位沖縄県（196.7人）、最下位鳥取県（11.2人）で17.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
