import type { MetricConfig } from "../types";

export const wheatFlourConsumptionQuantity: MetricConfig = {
  "key": "wheat-flour-consumption-quantity",
  "title": "小麦粉消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間小麦粉消費量",
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
      "cdCat01": "010140010",
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "g/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "三重3,072g vs 山梨1,284g 小麦粉消費量2.4倍差｜47都道府県2024",
  "seoDescription": "1人あたり小麦粉消費量は1位三重県(3,072g)、2位千葉県(2,807g)、3位長野県(2,799g)。最下位山梨県(1,284g)まで2.4倍の地域差を47都道府県で比較する2024年最新ランキング。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
