import type { MetricConfig } from "../types";

export const botanicalGardenCount: MetricConfig = {
  "key": "botanical-garden-count",
  "title": "植物園数",
  "unit": "館",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003348770",
    "cdCat01": "00000800",
    "cdCat02": "182",
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
    "colorScheme": "interpolateGreens",
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
  "groupKey": "museum-type-count",
  "seoTitle": "植物園数ランキング都道府県【2015年】｜1位兵庫県（2館）",
  "seoDescription": "2015年の植物園数の都道府県別ランキング。1位兵庫県（2館）、最下位沖縄県（0館）で地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
