import type { MetricConfig } from "../types";

export const gdpGrowthRatePrefH27: MetricConfig = {
  "key": "gdp-growth-rate-pref-h27",
  "title": "県内総生産額対前年増加率",
  "subtitle": "H27年基準",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01121",
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
  "seoTitle": "県内総生産額対前年増加率（平成27年基準）",
  "isActive": false,
};
