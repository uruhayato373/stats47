import type { MetricConfig } from "../types";

export const motorcycleCount: MetricConfig = {
  "key": "motorcycle-count",
  "title": "二輪の小型自動車台数",
  "unit": "台",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H7208",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2010,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "二輪の小型自動車台数ランキング都道府県【2024年】｜1位東京都（165,570台）",
  "seoDescription": "2024年の二輪の小型自動車台数の都道府県別ランキング。1位東京都（165,570台）、最下位鳥取県（6,390台）で25.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
