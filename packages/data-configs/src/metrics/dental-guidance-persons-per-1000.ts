import type { MetricConfig } from "../types";

export const dentalGuidancePersonsPer1000: MetricConfig = {
  "key": "dental-guidance-persons-per-1000",
  "title": "歯科保健指導延人員",
  "subtitle": "人口1000人当たり（別統計）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I13209",
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
  "groupKey": "dental-guidance-persons",
  "seoTitle": "歯科保健指導延人員ランキング都道府県【2023年】｜1位熊本県（48.4人）",
  "seoDescription": "2023年の歯科保健指導延人員の都道府県別ランキング。1位熊本県（48.4人）、最下位香川県（10.8人）で4.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
