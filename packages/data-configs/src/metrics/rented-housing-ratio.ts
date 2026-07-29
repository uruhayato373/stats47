import type { MetricConfig } from "../types";

export const rentedHousingRatio: MetricConfig = {
  "key": "rented-housing-ratio",
  "title": "借家比率",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H01302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2008,
      2013,
      2018,
      2023,
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
  "seoTitle": "借家比率ランキング都道府県【2023年】｜1位沖縄県（50.7％）",
  "seoDescription": "2023年の借家比率の都道府県別ランキング。1位沖縄県（50.7％）、最下位秋田県（20.9％）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
