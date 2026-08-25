import type { MetricConfig } from "../types";

export const hospitalBedCount: MetricConfig = {
  "key": "hospital-bed-count",
  "title": "病院病床数",
  "subtitle": "6月末現在・全病床",
  "description": "病院報告における各年6月末現在の病院病床数。精神病床、感染症病床、結核病床、療養病床、一般病床を含む全病床の合計。",
  "unit": "床",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004045406",
    "cdTab": "280",
    "cdCat01": "100",
    "cdCat02": "100",
    "displayName": "病院報告",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/byouin/m24/dl/9912kekka.pdf",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
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
        "unit": "床/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "床/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "hospital-bed-count",
  "isActive": true,
};
