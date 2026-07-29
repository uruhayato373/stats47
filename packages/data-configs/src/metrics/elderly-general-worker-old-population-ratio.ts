import type { MetricConfig } from "../types";

export const elderlyGeneralWorkerOldPopulationRatio: MetricConfig = {
  "key": "elderly-general-worker-old-population-ratio",
  "title": "高齢一般労働者割合",
  "subtitle": "現行",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0350406",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "高齢一般労働者割合ランキング都道府県【2024年】｜1位東京都（5.76％）",
  "seoDescription": "2024年の高齢一般労働者割合の都道府県別ランキング。1位東京都（5.76％）、最下位奈良県（1.91％）で3.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
