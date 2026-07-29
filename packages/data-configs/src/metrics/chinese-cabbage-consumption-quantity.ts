import type { MetricConfig } from "../types";

export const chineseCabbageConsumptionQuantity: MetricConfig = {
  "key": "chinese-cabbage-consumption-quantity",
  "title": "はくさい消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間はくさい消費量",
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
      "cdCat01": "010511030",
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
  "seoTitle": "はくさい消費量ランキング都道府県【2024年】｜1位兵庫県（10,607g）",
  "seoDescription": "2024年のはくさい消費量の都道府県別ランキング。1位兵庫県（10,607g）、最下位沖縄県（4,551g）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
