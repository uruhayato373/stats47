import type { MetricConfig } from "../types";

export const residentForeignerPopulation: MetricConfig = {
  "key": "resident-foreigner-population",
  "title": "在留外国人数",
  "subtitle": "総数",
  "unit": "人",
  "category": "international",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A3200",
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
    "decimalPlaces": 0,
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "在留外国人数ランキング都道府県【2024年】｜1位東京都（738,946人）",
  "seoDescription": "2024年の在留外国人数の都道府県別ランキング。1位東京都（738,946人）、最下位秋田県（5,851人）で126.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
