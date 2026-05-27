import type { MetricConfig } from "../types";

export const mediaAvgTimeUnemployedFemale: MetricConfig = {
  "key": "media-avg-time-unemployed-female",
  "title": "テレビ・ラジオ・新聞・雑誌の平均時間",
  "unit": "分",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010213",
    "cdCat01": "#M0330202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "テレビ・ラジオ・新聞・雑誌の平均時間（無業者・女）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
