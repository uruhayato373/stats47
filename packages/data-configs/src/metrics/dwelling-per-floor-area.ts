import type { MetricConfig } from "../types";

export const dwellingPerFloorArea: MetricConfig = {
  "key": "dwelling-per-floor-area",
  "title": "１住宅当たりの延べ面積",
  "unit": "ｍ2",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020308",
    "cdCat01": "#H02103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
      1983,
      1988,
      1993,
      1998,
      2003,
      2008,
      2013,
      2018,
      2023,
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
  "isActive": false,
};
