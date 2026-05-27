import type { MetricConfig } from "../types";

export const averageBroadcastMediaConsumptionTimeEmployedMan: MetricConfig = {
  "key": "average-broadcast-media-consumption-time-employed-man",
  "title": "テレビ・ラジオ・新聞・雑誌の平均時間",
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
    "from": 2021,
    "to": 2021,
  },
  "yearFormat": "fiscal",
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
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
