import type { MetricConfig } from "../types";

export const employedOutsideThePrefecture: MetricConfig = {
  "key": "employed-outside-the-prefecture",
  "title": "県外就職者比率",
  "subtitle": "2019年度〜",
  "description": "公共職業安定所（ハローワーク）の一般職業紹介（新規学卒者を除く）で成立した就職件数（年度計）のうち、他の都道府県の事業所へ就職した件数の割合。算式は「他県への就職件数 ÷ 就職件数 × 100」で、分母は就職者数ではなく就職件数。2018年度以前は「1 − 県内就職件数 ÷ 就職件数」で算出した別系列（県外就職者比率（～2018年））。",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0310201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2024,
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
  "seoTitle": "県外就職者比率ランキング都道府県【2024年】｜1位埼玉県（32.9％）",
  "seoDescription": "2024年の県外就職者比率の都道府県別ランキング。1位埼玉県（32.9％）、最下位北海道（4.9％）で6.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
