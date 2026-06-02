import type { MetricConfig } from "../types";

export const portPassengersLanding: MetricConfig = {
  "key": "port-passengers-landing",
  "title": "旅客数（上陸）",
  "subtitle": "上陸",
  "unit": "人",
  "category": "tourism",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_dpf",
    "config": {},
  },
  "entities": [
    "port",
  ],
  "years": {
    "from": 2010,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "calculation": {
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
    "isCalculated": false,
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
