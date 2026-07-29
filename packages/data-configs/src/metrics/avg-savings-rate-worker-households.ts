import type { MetricConfig } from "../types";

export const avgSavingsRateWorkerHouseholds: MetricConfig = {
  "key": "avg-savings-rate-worker-households",
  "title": "平均貯蓄率",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02734",
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
  "seoTitle": "平均貯蓄率ランキング都道府県【2024年】｜1位埼玉県（44.6％）",
  "seoDescription": "2024年の平均貯蓄率の都道府県別ランキング。1位埼玉県（44.6％）、最下位宮崎県（23.2％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
