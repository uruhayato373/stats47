import type { MetricConfig } from "../types";

export const pastaConsumptionQuantity: MetricConfig = {
  "key": "pasta-consumption-quantity",
  "title": "パスタ消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間パスタ消費量",
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
      "cdCat01": "010130030",
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
  "seoTitle": "パスタ消費なぜ埼玉1位？西日本は2.3倍差の下位圏、麺文化の地域分断（2024）",
  "seoDescription": "パスタ消費量1位は埼玉県（4,368g）、最下位は山口県（1,880g）で2.3倍差。「麺の棲み分け」が西日本の低消費を生む構造を47都道府県データで解説（2024年）。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
