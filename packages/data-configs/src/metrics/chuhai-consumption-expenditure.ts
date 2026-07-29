import type { MetricConfig } from "../types";

export const chuhaiConsumptionExpenditure: MetricConfig = {
  "key": "chuhai-consumption-expenditure",
  "title": "チューハイ・カクテル消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間チューハイ・カクテル消費支出額",
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
      "cdCat01": "011100070",
      "cdCat02": "03",
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
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
    ],
    "isCalculated": false,
  },
  "seoTitle": "チューハイ・カクテル消費支出額ランキング都道府県【2024年】｜1位宮城県（9,009円）",
  "seoDescription": "2024年のチューハイ・カクテル消費支出額の都道府県別ランキング。1位宮城県（9,009円）、最下位栃木県（3,205円）で2.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
