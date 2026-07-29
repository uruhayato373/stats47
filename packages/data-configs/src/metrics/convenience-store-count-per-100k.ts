import type { MetricConfig } from "../types";

export const convenienceStoreCountPer100k: MetricConfig = {
  "key": "convenience-store-count-per-100k",
  "title": "コンビニエンスストア数",
  "subtitle": "人口10万人当たり",
  "unit": "所",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0611302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2011,
      2014,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "convenience-store-count",
  "seoTitle": "コンビニエンスストア数ランキング都道府県【2014年】｜1位北海道（40.6所）",
  "seoDescription": "2014年のコンビニエンスストア数の都道府県別ランキング。1位北海道（40.6所）、最下位奈良県（17.1所）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
