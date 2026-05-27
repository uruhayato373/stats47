import type { MetricConfig } from "../types";

export const historyMuseumCount: MetricConfig = {
  "key": "history-museum-count",
  "title": "歴史博物館数",
  "unit": "館",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003348770",
    "cdCat01": "00000400",
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
  "groupKey": "museum-type-count",
  "seoTitle": "歴史博物館数ランキング都道府県【2015年】｜1位東京都（35館）",
  "seoDescription": "2015年の歴史博物館数の都道府県別ランキング。1位東京都（35館）、最下位秋田県（1館）で35.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
