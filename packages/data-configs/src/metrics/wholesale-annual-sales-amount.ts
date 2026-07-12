import type { MetricConfig } from "../types";

export const wholesaleAnnualSalesAmount: MetricConfig = {
  "key": "wholesale-annual-sales-amount",
  "title": "卸売業年間商品販売額",
  "unit": "百万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C350101",
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
        "label": "人口1人あたり",
        "unit": "百万円/人",
        "scaleFactor": 1,
        "decimalPlaces": 2
      }
    ]
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0
};
