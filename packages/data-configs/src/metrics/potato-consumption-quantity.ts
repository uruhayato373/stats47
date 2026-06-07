import type { MetricConfig } from "../types";

export const potatoConsumptionQuantity: MetricConfig = {
  "key": "potato-consumption-quantity",
  "title": "じゃがいも消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間じゃがいも消費量",
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
      "cdCat01": "010512020",
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
  "seoTitle": "じゃがいも消費量ランキング都道府県【2024】産地王者・北海道は何位? 1位は岐阜",
  "seoDescription": "じゃがいもの産地といえば北海道、では最も食べる県は?──答えは岐阜県(10,467g)。最下位沖縄(6,331g)まで1.7倍の差。2024年最新ランキングを地図とグラフで47都道府県比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
