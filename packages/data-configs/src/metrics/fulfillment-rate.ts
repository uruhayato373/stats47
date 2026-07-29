import type { MetricConfig } from "../types";

export const fulfillmentRate: MetricConfig = {
  "key": "fulfillment-rate",
  "title": "充足率",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1993,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
  "seoTitle": "充足率ランキング都道府県【2021年】｜1位長崎県（7％）",
  "seoDescription": "2021年の充足率の都道府県別ランキング。1位長崎県（7％）、最下位東京都（1.9％）で3.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
