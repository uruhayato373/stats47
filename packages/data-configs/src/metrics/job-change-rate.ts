import type { MetricConfig } from "../types";

export const jobChangeRate: MetricConfig = {
  "key": "job-change-rate",
  "title": "転職率",
  "description": "1年前の勤め先と現在の勤め先が異なる転職者数を、現在の有業者数で割り、100倍した値。",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F04101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "転職率ランキング都道府県【2022年】｜1位福岡県（5.4％）",
  "seoDescription": "2022年の転職率の都道府県別ランキング。1位福岡県（5.4％）、最下位愛媛県（3.3％）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
