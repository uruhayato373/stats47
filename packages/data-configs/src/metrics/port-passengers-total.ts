import type { MetricConfig } from "../types";

export const portPassengersTotal: MetricConfig = {
  "key": "port-passengers-total",
  "title": "港湾旅客数（港湾統計）",
  "description": "港湾調査（港湾統計年報）による都道府県別の船舶乗降人員数。内陸7県はデータなし。",
  "unit": "人",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130737",
    "cdCat01": "100",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
    "port",
  ],
  "years": {
    "from": 2009,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万人",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "additionalCategories": [
    "infrastructure",
  ],
  "seoTitle": "港湾旅客数（港湾統計）ランキング都道府県【2023年】｜1位広島県（17,611,624人）",
  "seoDescription": "2023年の港湾旅客数（港湾統計）の都道府県別ランキング。1位広島県（17,611,624人）、最下位山形県（37,779人）で466.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": false,
};
