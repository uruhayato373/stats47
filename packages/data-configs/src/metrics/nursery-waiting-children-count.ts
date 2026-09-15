import type { MetricConfig } from "../types";

export const nurseryWaitingChildrenCount: MetricConfig = {
  "key": "nursery-waiting-children-count",
  "title": "保育所等利用待機児童数",
  "unit": "人",
  "category": "socialsecurity",
  "surveyId": "childcare-related-status-report",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdCat01": "J250502",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2001,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
