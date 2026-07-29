import type { MetricConfig } from "../types";

export const transportCommunicationExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "transport-communication-expenditure-ratio-multi-person-households",
  "title": "交通・通信費割合",
  "unit": "％",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02417",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2024,
    ],
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
  "seoTitle": "交通・通信費割合ランキング都道府県【2024年】｜1位群馬県（19.9％）",
  "seoDescription": "2024年の交通・通信費割合の都道府県別ランキング。1位群馬県（19.9％）、最下位大阪府（10.7％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
