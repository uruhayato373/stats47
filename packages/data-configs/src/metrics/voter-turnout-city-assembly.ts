import type { MetricConfig } from "../types";

export const voterTurnoutCityAssembly: MetricConfig = {
  "key": "voter-turnout-city-assembly",
  "title": "市区町村議会議員選挙投票率",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G6307",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2007,
      2011,
      2015,
      2019,
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
  "seoTitle": "市区町村議会議員選挙投票率ランキング都道府県【2019年】｜1位島根県（88.8％）",
  "seoDescription": "2019年の市区町村議会議員選挙投票率の都道府県別ランキング。1位島根県（88.8％）、最下位京都府（40.03％）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
