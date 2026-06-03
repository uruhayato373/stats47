import type { MetricConfig } from "../types";

export const movingOutRateJapanese: MetricConfig = {
  "key": "moving-out-rate-japanese",
  "title": "転出率",
  "subtitle": "日本人移動者",
  "unit": "％",
  "category": "uncategorized",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2000,
      2005,
      2010,
      2015,
      2020,
      2023,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
