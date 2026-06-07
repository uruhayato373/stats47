import type { MetricConfig } from "../types";

export const taxpayerCountEqual: MetricConfig = {
  "key": "taxpayer-count-equal",
  "title": "納税義務者数",
  "subtitle": "均等割",
  "unit": "人",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C120130",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2023,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
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
    ],
  },
  "seoTitle": "納税義務者数ランキング都道府県【2024年】｜1位東京都（7,938,461人）",
  "seoDescription": "2024年の納税義務者数の都道府県別ランキング。1位東京都（7,938,461人）、最下位鳥取県（278,197人）で28.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
