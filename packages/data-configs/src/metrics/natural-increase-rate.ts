import type { MetricConfig } from "../types";

export const naturalIncreaseRate: MetricConfig = {
  "key": "natural-increase-rate",
  "title": "自然増減率",
  "description": "人口推計における1年間の自然増減数（出生児数から死亡者数を引いた数）を期首人口で割り、人口1,000人当たりで表した率。",
  "note": "転入・転出や出入国による社会増減は含まない。負の値は、期間中の死亡者数が出生児数を上回った自然減少を示す。",
  "unit": "‰",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A4401",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2024,
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
  "seoTitle": "自然増減率ランキング都道府県【2024年】｜1位沖縄県（-2.3‰）",
  "seoDescription": "2024年の自然増減率の都道府県別ランキング。1位沖縄県（-2.3‰）、最下位秋田県（-15.6‰）で0.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
