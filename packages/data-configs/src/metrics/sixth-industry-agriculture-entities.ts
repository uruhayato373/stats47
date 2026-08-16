import type { MetricConfig } from "../types";

export const sixthIndustryAgricultureEntities: MetricConfig = {
  "key": "sixth-industry-agriculture-entities",
  "title": "6次産業農業生産関連事業体数",
  "subtitle": "農産加工",
  "unit": "事業体",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C312601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
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
        "unit": "事業体/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "事業体/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2
      }
    ]
  },
  "isActive": true,
};
