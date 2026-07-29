import type { MetricConfig } from "../types";

export const carriedForwardIncomePrefecture: MetricConfig = {
  "key": "carried-forward-income-prefecture",
  "title": "繰越金",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310113",
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "繰越金ランキング都道府県【2022年】｜1位東京都（549,525,358）",
  "seoDescription": "2022年の繰越金の都道府県別ランキング。1位東京都（549,525,358）、最下位奈良県（6,203,636）で88.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
