import type { MetricConfig } from "../types";

export const factoryEstablishmentCount: MetricConfig = {
  "key": "factory-establishment-count",
  "title": "工場立地件数",
  "subtitle": "年間の新規工場立地件数",
  "unit": "件",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411426",
    "displayName": "工場立地動向調査",
    "url": "https://www.meti.go.jp/statistics/tii/kougai/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
    ],
  },
  "seoTitle": "工場立地件数ランキング都道府県【2020年】｜1位茨城県（65件）",
  "seoDescription": "2020年の工場立地件数の都道府県別ランキング。1位茨城県（65件）、最下位長崎県（1件）で65.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
