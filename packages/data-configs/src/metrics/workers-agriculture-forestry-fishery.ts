import type { MetricConfig } from "../types";

export const workersAgricultureForestryFishery: MetricConfig = {
  "key": "workers-agriculture-forestry-fishery",
  "title": "従業者数",
  "subtitle": "農林漁業",
  "unit": "人",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C220702",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolatePurples",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2
      }
    ]
  },
  "isActive": true,
};
