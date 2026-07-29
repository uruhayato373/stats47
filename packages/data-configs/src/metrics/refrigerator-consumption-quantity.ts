import type { MetricConfig } from "../types";

export const refrigeratorConsumptionQuantity: MetricConfig = {
  "key": "refrigerator-consumption-quantity",
  "title": "電気冷蔵庫消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間電気冷蔵庫消費量",
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
      "cdCat01": "040110040",
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
  "seoTitle": "電気冷蔵庫消費量ランキング都道府県【2024年】｜1位岡山県（0.11台）",
  "seoDescription": "2024年の電気冷蔵庫消費量の都道府県別ランキング。1位岡山県（0.11台）、最下位岐阜県（0台）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
