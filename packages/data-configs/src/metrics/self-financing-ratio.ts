import type { MetricConfig } from "../types";

export const selfFinancingRatio: MetricConfig = {
  "key": "self-financing-ratio",
  "title": "自主財源の割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0120101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "自主財源の割合ランキング都道府県【2022年】｜1位東京都（89.1％）",
  "seoDescription": "2022年の自主財源の割合の都道府県別ランキング。1位東京都（89.1％）、最下位高知県（25.7％）で3.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
