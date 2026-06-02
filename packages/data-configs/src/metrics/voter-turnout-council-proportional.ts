import type { MetricConfig } from "../types";

export const voterTurnoutCouncilProportional: MetricConfig = {
  "key": "voter-turnout-council-proportional",
  "title": "参議院議員選挙投票率（比例代表）",
  "subtitle": "比例代表制",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G6303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1983,
      1986,
      1989,
      1992,
      1995,
      1998,
      2001,
      2004,
      2007,
      2010,
      2013,
      2016,
      2019,
      2022,
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
  "seoTitle": "参議院議員選挙投票率（比例代表）ランキング都道府県【2022年】｜1位山形県（61.86％）",
  "seoDescription": "2022年の参議院議員選挙投票率（比例代表）の都道府県別ランキング。1位山形県（61.86％）、最下位徳島県（45.72％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
