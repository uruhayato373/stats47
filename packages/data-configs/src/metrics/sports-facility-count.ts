import type { MetricConfig } from "../types";

export const sportsFacilityCount: MetricConfig = {
  "key": "sports-facility-count",
  "title": "社会体育施設数",
  "subtitle": "総数（別統計）",
  "unit": "施設",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003348896",
    "cdCat01": "010",
    "cdCat02": "001",
    "displayName": "社会教育調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
    "to": 2015,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "education-facility-count",
  "seoTitle": "社会体育施設数ランキング都道府県【2015年】｜1位北海道（3,992施設）",
  "seoDescription": "2015年の社会体育施設数の都道府県別ランキング。1位北海道（3,992施設）、最下位徳島県（382施設）で10.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
