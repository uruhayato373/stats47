import type { MetricConfig } from "../types";

export const consumerPriceDifferenceIndexHousing: MetricConfig = {
  "key": "consumer-price-difference-index-housing",
  "title": "消費者物価地域差指数",
  "subtitle": "住居",
  "description": "全国平均の住居価格水準を100とし、都道府県ごとの住居費目の物価水準を比較した年平均指数です。",
  "note": "住居指数にも「持家の帰属家賃」は含まれず、消費者物価指数（CPI）の住居とは対象が異なります。",
  "unit": "（全国=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04417",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
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
  "seoTitle": "消費者物価地域差指数（住居）",
  "isActive": true,
};
