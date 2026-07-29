import type { MetricConfig } from "../types";

export const avgPropensityToConsumeWorkerHouseholds: MetricConfig = {
  "key": "avg-propensity-to-consume-worker-households",
  "title": "平均消費性向",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02602",
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
  "seoTitle": "平均消費性向ランキング都道府県【2024年】｜1位鳥取県（71.5％）",
  "seoDescription": "2024年の平均消費性向の都道府県別ランキング。1位鳥取県（71.5％）、最下位京都府（56.1％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
