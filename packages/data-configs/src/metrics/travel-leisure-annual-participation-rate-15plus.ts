import type { MetricConfig } from "../types";

export const travelLeisureAnnualParticipationRate15plus: MetricConfig = {
  "key": "travel-leisure-annual-participation-rate-15plus",
  "title": "旅行・行楽の年間行動者率",
  "subtitle": "15歳以上",
  "description": "過去1年間に該当の活動をしたことのある人の割合",
  "unit": "％",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G04306",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2001,
    "to": 2001,
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
  "seoTitle": "旅行・行楽の年間行動者率ランキング都道府県【2001年】｜1位埼玉県（86.5％）",
  "seoDescription": "2001年の旅行・行楽の年間行動者率の都道府県別ランキング。1位埼玉県（86.5％）、最下位沖縄県（59.3％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
