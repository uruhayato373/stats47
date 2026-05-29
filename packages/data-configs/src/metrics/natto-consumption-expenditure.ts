import type { MetricConfig } from "../types";

export const nattoConsumptionExpenditure: MetricConfig = {
  "key": "natto-consumption-expenditure",
  "title": "納豆消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間納豆消費支出額",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348239",
      "cdCat01": "010530030",
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
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "円/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "納豆消費支出額ランキング都道府県【2024年】｜1位福島県7,830円・最下位和歌山県で3.0倍格差",
  "seoDescription": "2024年最新版・47都道府県の納豆消費支出額ランキング。1位福島県(7,830円)、2位秋田県(7,199円)、3位青森県(6,984円)、最下位和歌山県(2,627円)で3.0倍の格差。地図とグラフで比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
