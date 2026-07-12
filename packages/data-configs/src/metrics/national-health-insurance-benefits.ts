import type { MetricConfig } from "../types";

export const nationalHealthInsuranceBenefits: MetricConfig = {
  "key": "national-health-insurance-benefits",
  "title": "国民健康保険給付金額",
  "unit": "千円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdCat01": "J4108",
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
    "colorScheme": "interpolateReds",
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
        "label": "人口1人あたり",
        "unit": "千円/人",
        "scaleFactor": 1,
        "decimalPlaces": 2
      }
    ]
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0
};
