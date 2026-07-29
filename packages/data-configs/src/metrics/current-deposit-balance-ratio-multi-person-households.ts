import type { MetricConfig } from "../types";

export const currentDepositBalanceRatioMultiPersonHouseholds: MetricConfig = {
  "key": "current-deposit-balance-ratio-multi-person-households",
  "title": "預貯金現在高割合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L07212",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
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
  "seoTitle": "預貯金現在高割合ランキング都道府県【2019年】｜1位新潟県（73.1％）",
  "seoDescription": "2019年の預貯金現在高割合の都道府県別ランキング。1位新潟県（73.1％）、最下位神奈川県（57.8％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
