import type { MetricConfig } from "../types";

export const grossPrefecturalProductWholesaleRetailH27: MetricConfig = {
  "key": "gross-prefectural-product-wholesale-retail-h27",
  "title": "県内総生産額",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C112209",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  "seoTitle": "県内総生産額（卸売・小売業）（平成27年基準）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
