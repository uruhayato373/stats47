import type { MetricConfig } from "../types";

export const averageLengthOfStay: MetricConfig = {
  "key": "average-length-of-stay",
  "title": "平均在院日数",
  "subtitle": "病院の入院患者の平均在院日数",
  "unit": "日",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004045406",
    "cdCat01": "100",
    "cdCat02": "100",
    "displayName": "病院報告",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/byouin/m24/dl/9912kekka.pdf",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "日/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "日/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "平均在院日数ランキング都道府県【2024年】｜1位高知県（38.3日）",
  "seoDescription": "2024年の平均在院日数の都道府県別ランキング。1位高知県（38.3日）、最下位東京都（20.3日）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
