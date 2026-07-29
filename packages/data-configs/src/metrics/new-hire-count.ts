import type { MetricConfig } from "../types";

export const newHireCount: MetricConfig = {
  "key": "new-hire-count",
  "title": "入職者数",
  "unit": "千人",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003376330",
    "cdCat01": "S100",
    "cdCat02": "100",
    "displayName": "雇用動向調査",
    "url": "https://www.mhlw.go.jp/toukei/list/9-23-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.001,
    "decimalPlaces": 1,
    "displayUnit": "万人",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "labor-mobility",
  "seoTitle": "入職者数ランキング都道府県【2021年】｜1位東京都（1,033.2千人）",
  "seoDescription": "2021年の入職者数の都道府県別ランキング。1位東京都（1,033.2千人）、最下位高知県（22千人）で47.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
