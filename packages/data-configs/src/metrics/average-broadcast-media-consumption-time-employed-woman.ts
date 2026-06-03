import type { MetricConfig } from "../types";

export const averageBroadcastMediaConsumptionTimeEmployedWoman: MetricConfig = {
  "key": "average-broadcast-media-consumption-time-employed-woman",
  "title": "テレビ・ラジオ・新聞・雑誌の平均時間",
  "subtitle": "女性・有業者",
  "unit": "分",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010213",
    "cdCat01": "#M0330201",
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
  "seoTitle": "テレビ・ラジオ・新聞・雑誌の平均時間（有業者・女）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
