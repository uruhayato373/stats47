import type { MetricConfig } from "../types";

export const averageBroadcastMediaConsumptionTimeEmployedMan: MetricConfig = {
  "key": "average-broadcast-media-consumption-time-employed-man",
  "title": "テレビ・ラジオ・新聞・雑誌の平均時間",
  "subtitle": "男性・有業者",
  "unit": "分",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010213",
    "cdCat01": "#M0330101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "テレビ・ラジオ・新聞・雑誌の平均時間（有業者・男）",
  "isActive": true,
};
