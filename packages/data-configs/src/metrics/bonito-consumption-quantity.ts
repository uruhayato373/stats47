import type { MetricConfig } from "../types";

export const bonitoConsumptionQuantity: MetricConfig = {
  "key": "bonito-consumption-quantity",
  "title": "かつお消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間かつお消費量",
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
      "cdCat01": "010211040",
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
  "seoTitle": "かつお消費量ランキング都道府県【2024年】｜1位高知県3,642g・最下位大分県で13.2倍格差",
  "seoDescription": "2024年最新版・47都道府県のかつお消費量ランキング。1位高知県(3,642g)、2位和歌山県(1,492g)、3位福島県(1,488g)、最下位大分県(275g)で13.2倍の格差。地図とグラフで比較。",
  "isActive": true,
};
