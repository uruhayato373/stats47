import type { MetricConfig } from "../types";

export const beefConsumptionQuantity: MetricConfig = {
  "key": "beef-consumption-quantity",
  "title": "牛肉消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間牛肉消費量",
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
      "cdCat01": "010310010",
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
  "seoTitle": "牛肉消費は関西が独占｜兵庫・大阪が1・2位、東北・関東は3.3倍差の下位 (2024)",
  "seoDescription": "牛肉消費の地域差は関西 vs 東北で3.3倍。1位兵庫7,899g・2位大阪7,722gが上位を占め、最下位岩手2,417gとの差はなぜ生まれるか？47都道府県の牛肉消費量を地図とグラフで解説（2024年）。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
