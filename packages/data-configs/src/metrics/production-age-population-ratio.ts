import type { MetricConfig } from "../types";

export const productionAgePopulationRatio: MetricConfig = {
  "key": "production-age-population-ratio",
  "title": "15～64歳人口割合",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A03502",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2020,
      2024,
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
  },
  "seoTitle": "15～64歳人口割合ランキング都道府県【2024年】｜1位東京都（66.8％）",
  "seoDescription": "2024年の15～64歳人口割合の都道府県別ランキング。1位東京都（66.8％）、最下位秋田県（51.6％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
