import type { MetricConfig } from "../types";

export const dentalCheckupPersonsPer1000: MetricConfig = {
  "key": "dental-checkup-persons-per-1000",
  "title": "歯科健診受診延人員",
  "subtitle": "人口1000人当たり",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I13208",
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
  "groupKey": "dental-checkup-persons",
  "seoTitle": "歯科健診受診延人員ランキング都道府県【2023年】｜1位鹿児島県（39.3人）",
  "seoDescription": "2023年の歯科健診受診延人員の都道府県別ランキング。1位鹿児島県（39.3人）、最下位徳島県（14.8人）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
