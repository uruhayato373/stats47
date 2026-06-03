import type { MetricConfig } from "../types";

export const femalePartTimeHourlyWage: MetricConfig = {
  "key": "female-part-time-hourly-wage",
  "title": "女性パートタイムの給与",
  "unit": "円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F06206",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
