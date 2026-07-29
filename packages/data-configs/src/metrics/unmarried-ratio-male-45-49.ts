import type { MetricConfig } from "../types";

export const unmarriedRatioMale4549: MetricConfig = {
  "key": "unmarried-ratio-male-45-49",
  "title": "未婚者割合",
  "subtitle": "男性 45〜49歳",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0410801",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  "seoTitle": "未婚者割合ランキング都道府県【2020年】｜1位青森県（29.7％）",
  "seoDescription": "2020年の未婚者割合の都道府県別ランキング。1位青森県（29.7％）、最下位滋賀県（21.8％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
