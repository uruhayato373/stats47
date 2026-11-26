import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

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
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "事業所/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "事業所/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
