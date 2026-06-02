import type { MetricConfig } from "../types";

export const squidConsumptionQuantity: MetricConfig = {
  "key": "squid-consumption-quantity",
  "title": "いか消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間いか消費量",
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
      "cdCat01": "010211110",
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
  "seoTitle": "いか消費量ランキング都道府県【2024】1位は意外な富山、最下位沖縄と4.3倍差",
  "seoDescription": "いかを最も食べる県は?──意外にも富山県(2,014g)が1位。最下位沖縄(463g)まで4.3倍の差。2024年最新ランキングを地図とグラフで47都道府県比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
