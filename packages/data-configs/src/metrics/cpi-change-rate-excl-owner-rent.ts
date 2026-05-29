import type { MetricConfig } from "../types";

export const cpiChangeRateExclOwnerRent: MetricConfig = {
  "key": "cpi-change-rate-excl-owner-rent",
  "title": "消費者物価指数変化率",
  "subtitle": "持ち家の帰属家賃を除く総合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
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
  "seoTitle": "消費者物価指数対前年変化率（持ち家の帰属家賃を除く総合）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
