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
  "seoTitle": "こんぶ消費1位は産地・北海道でなく岩手535g｜9.6倍差の意外な分布（2024）",
  "seoDescription": "こんぶの産地といえば北海道、では最も食べる県は？答えは岩手535gで1位。最下位山梨56gとの9.6倍差と、なぜ産地と消費地が異なるかを47都道府県で解説（2024年）。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
