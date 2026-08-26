import type { MetricConfig } from "../types";

export const youngPopulationIndex: MetricConfig = {
  "key": "young-population-index",
  "title": "年少人口指数",
  "description": "15歳未満人口を15～64歳人口で除し、100を掛けた指数です。",
  "unit": "指数",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A03401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1983,
    "to": 2022,
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
    ],
  },
  "seoTitle": "年少人口指数ランキング都道府県【2022年】｜1位沖縄県（27.1‐）",
  "seoDescription": "2022年の年少人口指数の都道府県別ランキング。1位沖縄県（27.1‐）、最下位東京都（16.5‐）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
