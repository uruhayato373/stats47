import type { MetricConfig } from "../types";

export const freshUdonSobaConsumptionQuantity: MetricConfig = {
  "key": "fresh-udon-soba-consumption-quantity",
  "title": "生うどん・そば消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間生うどん・そば消費量",
  "unit": "g",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348235",
      "cdCat01": "010130010",
      "cdCat02": "03",
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "g/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "g/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "生うどん・そば消費量1位は香川16,788g、沖縄の3.8倍｜47都道府県2024",
  "seoDescription": "うどん県・香川の生うどん/そば消費量は1位16,788gで圧倒、最下位沖縄(4,378g)まで3.8倍差。47都道府県を地図とグラフで比較する2024年最新ランキング。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
