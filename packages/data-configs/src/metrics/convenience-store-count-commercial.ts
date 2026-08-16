import type { MetricConfig } from "../types";

export const convenienceStoreCountCommercial: MetricConfig = {
  "key": "convenience-store-count-commercial",
  "title": "コンビニエンスストア店舗数",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004032502",
    "cdCat01": "0105200",
    "cdCat02": "01040200",
    "cdCat03": "01030100",
    "timeScope": "annual",
    "displayName": "商業動態統計調査",
    "url": "https://www.meti.go.jp/statistics/tyo/syoudou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2024,
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
        "unit": "店/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "店/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "convenience-store-count",
  "seoTitle": "コンビニエンスストア店舗数ランキング都道府県【2025年】｜1位東京都（7,233店）",
  "seoDescription": "2025年のコンビニエンスストア店舗数の都道府県別ランキング。1位東京都（7,233店）、最下位鳥取県（258店）で28.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
