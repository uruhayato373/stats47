import type { MetricConfig } from "../types";

export const tertiaryActivityAvgTimeEmployedMale: MetricConfig = {
  "key": "tertiary-activity-avg-time-employed-male",
  "title": "3次活動の平均時間",
  "subtitle": "男性・有業者",
  "unit": "分",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010213",
    "cdCat01": "#M0130106",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1976,
      1981,
      2021,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "3次活動の平均時間（有業者・男）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
