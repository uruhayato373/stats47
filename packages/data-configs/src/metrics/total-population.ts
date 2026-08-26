import type { MetricConfig } from "../types";

export const totalPopulation: MetricConfig = {
  "key": "total-population",
  "title": "総人口",
  "subtitle": "総数",
  "description": "国勢調査または人口推計に基づく、各地域の人口の総数です。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A1101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
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
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "総人口ランキング都道府県【2024年】｜1位東京都（14,178,000人）",
  "seoDescription": "2024年の総人口の都道府県別ランキング。1位東京都（14,178,000人）、最下位鳥取県（531,000人）で26.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
