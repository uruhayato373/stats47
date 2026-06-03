import type { MetricConfig } from "../types";

export const agricultureForestryFisheriesExpensesPrefecture: MetricConfig = {
  "key": "agriculture-forestry-fisheries-expenses-prefecture",
  "title": "農林水産業費",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310306",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "農林水産業費ランキング都道府県【2022年】｜1位北海道（270,584,874）",
  "seoDescription": "2022年の農林水産業費の都道府県別ランキング。1位北海道（270,584,874）、最下位大阪府（13,498,634）で20.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
