import type { MetricConfig } from "../types";

export const complainantCount: MetricConfig = {
  "key": "complainant-count",
  "title": "有訴者率",
  "subtitle": "総数",
  "unit": "‐",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I8103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1989,
      1992,
      1995,
      1998,
      2001,
      2004,
      2007,
      2010,
      2013,
      2016,
      2019,
      2022,
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
        "unit": "‐/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "‐/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "‐/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "groupKey": "complainant-count",
  "seoTitle": "有訴者率ランキング都道府県【2022年】｜1位兵庫県（314.9‐）",
  "seoDescription": "2022年の有訴者率の都道府県別ランキング。1位兵庫県（314.9‐）、最下位東京都（244‐）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
