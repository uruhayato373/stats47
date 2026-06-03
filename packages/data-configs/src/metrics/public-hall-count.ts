import type { MetricConfig } from "../types";

export const publicHallCount: MetricConfig = {
  "key": "public-hall-count",
  "title": "公民館数",
  "subtitle": "総数",
  "unit": "館",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003225287",
    "cdCat01": "010",
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
        "unit": "館/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "館/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "education-facility-count",
  "seoTitle": "公民館数ランキング都道府県【2015年】｜1位長野県（1,520館）",
  "seoDescription": "2015年の公民館数の都道府県別ランキング。1位長野県（1,520館）、最下位沖縄県（80館）で19.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
