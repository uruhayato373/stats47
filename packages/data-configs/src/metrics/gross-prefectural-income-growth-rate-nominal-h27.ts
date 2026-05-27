import type { MetricConfig } from "../types";

export const grossPrefecturalIncomeGrowthRateNominalH27: MetricConfig = {
  "key": "gross-prefectural-income-growth-rate-nominal-h27",
  "title": "県民総所得対前年増加率",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01126",
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
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "県民総所得対前年増加率（名目）（平成27年基準）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
