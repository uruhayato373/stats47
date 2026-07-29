import type { MetricConfig } from "../types";

export const bedUtilizationRate: MetricConfig = {
  "key": "bed-utilization-rate",
  "title": "病床利用率",
  "subtitle": "病院の全病床の利用率",
  "unit": "％",
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
  },
  "seoTitle": "病床利用率ランキング都道府県【2024年】｜1位佐賀県（82.4％）",
  "seoDescription": "2024年の病床利用率の都道府県別ランキング。1位佐賀県（82.4％）、最下位福島県（66.4％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
