import type { MetricConfig } from "../types";

export const ageAdjustedMortalityRateOld: MetricConfig = {
  "key": "age-adjusted-mortality-rate-old",
  "title": "年齢別死亡率",
  "unit": "‐",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05218",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "年齢別死亡率（65歳以上）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
