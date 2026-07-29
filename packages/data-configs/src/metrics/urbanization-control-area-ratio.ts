import type { MetricConfig } from "../types";

export const urbanizationControlAreaRatio: MetricConfig = {
  "key": "urbanization-control-area-ratio",
  "title": "市街化調整区域面積比率",
  "unit": "％",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H07201",
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
  },
  "seoTitle": "市街化調整区域面積比率ランキング都道府県【2023年】｜1位奈良県（81.6％）",
  "seoDescription": "2023年の市街化調整区域面積比率の都道府県別ランキング。1位奈良県（81.6％）、最下位香川県（0％）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
