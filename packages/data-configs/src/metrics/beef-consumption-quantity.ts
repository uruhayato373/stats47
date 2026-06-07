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
  "seoTitle": "牛肉消費量ランキング都道府県【2024年】｜1位兵庫県7,899g・最下位岩手県で3.3倍格差",
  "seoDescription": "2024年最新版・47都道府県の牛肉消費量ランキング。1位兵庫県(7,899g)、2位大阪府(7,722g)、3位愛媛県(7,590g)、最下位岩手県(2,417g)で3.3倍の格差。地図とグラフで比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
