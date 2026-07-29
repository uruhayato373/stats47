import type { MetricConfig } from "../types";

export const relaxationAvgTimeFemale: MetricConfig = {
  "key": "relaxation-avg-time-female",
  "title": "休養・くつろぎの平均時間",
  "subtitle": "女性",
  "unit": "分",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010113",
    "cdCat01": "M330200",
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
      1986,
      1991,
      1996,
      2001,
      2006,
      2011,
      2016,
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
  "isActive": true,
};
