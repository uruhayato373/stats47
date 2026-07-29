import type { MetricConfig } from "../types";

export const cleaningShopCountPer100k: MetricConfig = {
  "key": "cleaning-shop-count-per-100k",
  "title": "クリーニング所数",
  "unit": "所",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06119",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "クリーニング所数ランキング都道府県【2023年】｜1位福井県（115.6所）",
  "seoDescription": "2023年のクリーニング所数の都道府県別ランキング。1位福井県（115.6所）、最下位神奈川県（37.9所）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
