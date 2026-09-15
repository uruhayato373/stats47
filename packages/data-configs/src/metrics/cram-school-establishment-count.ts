import type { MetricConfig } from "../types";

export const cramSchoolEstablishmentCount: MetricConfig = {
  "key": "cram-school-establishment-count",
  "title": "学習塾事業所数",
  "unit": "事業所",
  "category": "economy",
  "surveyId": "economic-census-activity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004003273",
    "cdTab": "301-2021",
    "cdCat01": "823",
    "displayName": "経済センサス‐活動調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004003273",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2021,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
        "unit": "事業所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "事業所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
