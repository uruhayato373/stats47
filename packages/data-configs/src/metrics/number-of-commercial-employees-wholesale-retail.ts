import type { MetricConfig } from "../types";

export const numberOfCommercialEmployeesWholesaleRetail: MetricConfig = {
  "key": "number-of-commercial-employees-wholesale-retail",
  "title": "商業従業者数",
  "unit": "人",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3503",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
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
  "seoTitle": "商業従業者数（卸売業＋小売業）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
