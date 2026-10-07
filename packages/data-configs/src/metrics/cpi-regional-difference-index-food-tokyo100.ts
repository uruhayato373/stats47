import type { MetricConfig } from "../types";

export const cpiRegionalDifferenceIndexFoodTokyo100: MetricConfig = {
  "key": "cpi-regional-difference-index-food-tokyo100",
  "title": "消費者物価地域差指数",
  "subtitle": "食料：東京都区部＝100",
  "unit": "（東京=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04203",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2009,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
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
  "seoTitle": "消費者物価地域差指数（食料：東京都区部＝100）",
  "isActive": true,
};
