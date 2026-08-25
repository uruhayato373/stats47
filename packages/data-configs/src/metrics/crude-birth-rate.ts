import type { MetricConfig } from "../types";

export const crudeBirthRate: MetricConfig = {
  "key": "crude-birth-rate",
  "title": "粗出生率",
  "description": "1年間の出生数を人口で割り、人口1,000人当たりで表した値です。地域の人口規模をそろえて出生の水準を比較できます。",
  "unit": "人口千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05202",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1980,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "粗出生率ランキング都道府県【2023年】｜1位沖縄県（8.55‐）",
  "seoDescription": "2023年の粗出生率の都道府県別ランキング。1位沖縄県（8.55‐）、最下位秋田県（3.95‐）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
