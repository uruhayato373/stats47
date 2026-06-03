import type { MetricConfig } from "../types";

export const ageAdjustedDeathRateFemaleS60Per1000: MetricConfig = {
  "key": "age-adjusted-death-rate-female-s60-per-1000",
  "title": "年齢調整死亡率",
  "subtitle": "女性（S60年基準）",
  "unit": "人口千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0521902",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
    "to": 2015,
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
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
