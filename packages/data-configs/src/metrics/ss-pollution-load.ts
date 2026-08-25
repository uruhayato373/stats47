import type { MetricConfig } from "../types";

export const ssPollutionLoad: MetricConfig = {
  "key": "ss-pollution-load",
  "title": "SS汚濁負荷量",
  "unit": "kg/日",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003225562",
    "cdTab": "1500",
    "cdCat01": "120",
    "cdCat02": "120",
    "displayName": "水質汚濁物質排出量総合調査",
    "url": "https://www.env.go.jp/water/impure/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "kg/日/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "kg/日/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
