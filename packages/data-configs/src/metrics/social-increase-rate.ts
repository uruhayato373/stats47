import type { MetricConfig } from "../types";

export const socialIncreaseRate: MetricConfig = {
  "key": "social-increase-rate",
  "title": "社会増減率",
  "note": "このランキングで配信している社会・人口統計体系の系列は2019年までです。最新年の人口増減率や自然増減率とは調査時点が異なります。",
  "description": "転入などによる人口の増加と、転出などによる人口の減少の差を人口1,000人当たりで表した値です。正の値は社会増、負の値は社会減を示します。",
  "unit": "‰",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A5301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2018,
    "to": 2019,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
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
  "seoTitle": "社会増減率ランキング都道府県【2019年】｜1位東京都（8.2‰）",
  "seoDescription": "2019年の社会増減率の都道府県別ランキング。1位東京都（8.2‰）、最下位長崎県（-4.8‰）で-1.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
