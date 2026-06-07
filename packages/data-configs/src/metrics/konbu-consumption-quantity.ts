import type { MetricConfig } from "../types";

export const konbuConsumptionQuantity: MetricConfig = {
  "key": "konbu-consumption-quantity",
  "title": "こんぶ消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間こんぶ消費量",
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
      "cdCat01": "010520050",
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
  "seoTitle": "こんぶ消費量1位は岩手535g、山梨56gの9.6倍差｜47都道府県2024ランキング",
  "seoDescription": "1人あたりこんぶ消費量は1位岩手(535g)、最下位山梨(56g)で9.6倍の地域格差。47都道府県を地図とグラフで比較する2024年最新ランキング。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
