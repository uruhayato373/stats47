import type { MetricConfig } from "../types";

export const voterTurnoutHouseProportional: MetricConfig = {
  "key": "voter-turnout-house-proportional",
  "title": "衆議院議員選挙投票率（比例代表）",
  "subtitle": "比例代表制",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G6302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1996,
      2000,
      2003,
      2005,
      2009,
      2012,
      2014,
      2017,
      2021,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "衆議院議員選挙投票率（比例代表）ランキング都道府県【2021年】｜1位山形県（64.32％）",
  "seoDescription": "2021年の衆議院議員選挙投票率（比例代表）の都道府県別ランキング。1位山形県（64.32％）、最下位山口県（49.67％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
