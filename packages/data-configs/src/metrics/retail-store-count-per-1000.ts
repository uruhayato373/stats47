import type { MetricConfig } from "../types";

export const retailStoreCountPer1000: MetricConfig = {
  "key": "retail-store-count-per-1000",
  "title": "小売店数",
  "subtitle": "1000人当たり（旧統計）",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2006,
    "to": 2006,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "店/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "店/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "retail-store-count",
  "seoTitle": "小売店数ランキング都道府県【2006年】｜1位島根県（13.61店）",
  "seoDescription": "2006年の小売店数の都道府県別ランキング。1位島根県（13.61店）、最下位神奈川県（6.68店）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
