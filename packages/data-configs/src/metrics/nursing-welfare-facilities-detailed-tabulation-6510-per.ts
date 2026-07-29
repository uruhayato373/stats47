import type { MetricConfig } from "../types";

export const nursingWelfareFacilitiesDetailedTabulation6510Per: MetricConfig = {
  "key": "nursing-welfare-facilities-detailed-tabulation-6510-per",
  "title": "介護老人福祉施設（詳細票）",
  "subtitle": "詳細集計",
  "unit": "所",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020310",
    "cdCat01": "#J02205",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
      2000,
      2005,
      2010,
      2015,
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
