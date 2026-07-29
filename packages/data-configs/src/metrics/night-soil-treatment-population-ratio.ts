import type { MetricConfig } from "../types";

export const nightSoilTreatmentPopulationRatio: MetricConfig = {
  "key": "night-soil-treatment-population-ratio",
  "title": "し尿処理人口比率",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0540102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
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
  "seoTitle": "し尿処理人口比率ランキング都道府県【2023年】｜1位岩手県（19.6％）",
  "seoDescription": "2023年のし尿処理人口比率の都道府県別ランキング。1位岩手県（19.6％）、最下位東京都（0.1％）で196.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
