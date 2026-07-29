import type { MetricConfig } from "../types";

export const televisionConsumptionQuantity: MetricConfig = {
  "key": "television-consumption-quantity",
  "title": "テレビ消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間テレビ消費量",
  "unit": "台",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348235",
      "cdCat01": "090100010",
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
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "テレビ消費量ランキング都道府県【2024年】｜1位熊本県（0.13台）",
  "seoDescription": "2024年のテレビ消費量の都道府県別ランキング。1位熊本県（0.13台）、最下位宮城県（0.01台）で12.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
