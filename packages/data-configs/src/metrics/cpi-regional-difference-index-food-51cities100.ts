import type { MetricConfig } from "../types";

export const cpiRegionalDifferenceIndexFood51cities100: MetricConfig = {
  "key": "cpi-regional-difference-index-food-51cities100",
  "title": "消費者物価地域差指数",
  "subtitle": "食料",
  "unit": "（51都市=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L0420303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
    "to": 2013,
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
  "seoTitle": "消費者物価地域差指数（食料）（51市平均＝100）",
  "isActive": true,
};
