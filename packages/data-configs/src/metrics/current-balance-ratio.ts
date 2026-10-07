import type { MetricConfig } from "../types";

export const currentBalanceRatio: MetricConfig = {
  "key": "current-balance-ratio",
  "title": "経常収支比率",
  "subtitle": "都道府県財政",
  "description": "人件費、扶助費、公債費など毎年度経常的に支出する経費に充てた一般財源を、経常一般財源と減収補てん債特例分・猶予特例債・臨時財政対策債の合計で割った割合。",
  "note": "経常的な収入が経常的な経費にどれだけ充てられているかを示し、比率が高いほど財政構造の硬直化が進んでいることを表す。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D2103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
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
  "seoTitle": "経常収支比率ランキング都道府県【2022年】｜1位大阪府（102.2％）",
  "seoDescription": "2022年の経常収支比率の都道府県別ランキング。1位大阪府（102.2％）、最下位東京都（79.5％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
