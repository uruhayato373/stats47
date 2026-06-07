import type { MetricConfig } from "../types";

export const portContainerCount: MetricConfig = {
  "key": "port-container-count",
  "title": "コンテナ取扱個数（港湾統計）",
  "unit": "TEU",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130688",
    "cdCat01": "100",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万TEU",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "TEU/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "TEU/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "コンテナ取扱個数（港湾統計）ランキング都道府県【2023年】｜1位東京都（4,599,530TEU）",
  "seoDescription": "2023年のコンテナ取扱個数（港湾統計）の都道府県別ランキング。1位東京都（4,599,530TEU）、最下位和歌山県（4,392TEU）で1047.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
