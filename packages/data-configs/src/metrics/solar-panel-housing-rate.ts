import type { MetricConfig } from "../types";

export const solarPanelHousingRate: MetricConfig = {
  "key": "solar-panel-housing-rate",
  "title": "太陽光発電機のある住宅率",
  "subtitle": "太陽光を利用した発電機器がある住宅の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021642",
    "cdCat01": "0",
    "cdCat02": "0",
    "displayName": "住宅・土地統計調査",
    "url": "https://www.stat.go.jp/data/jyutaku/2023/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
  "seoTitle": "太陽光発電機のある住宅率ランキング都道府県【2023年】｜1位佐賀県（10.8％）",
  "seoDescription": "2023年の太陽光発電機のある住宅率の都道府県別ランキング。1位佐賀県（10.8％）、最下位東京都（1.8％）で6.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
