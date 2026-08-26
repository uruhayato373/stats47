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
    "cdCat03": "0",
    "cdCat04": "0",
    "axisRatio": {
      "axis": "cat05",
      "numeratorCodes": ["21"],
      "denominatorCodes": ["21", "22"],
    },
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
  "seoTitle": "太陽光発電機のある住宅率 都道府県ランキング【2023年】｜1位佐賀県（11.2％）",
  "seoDescription": "2023年の太陽光発電機のある住宅率を都道府県別に比較。1位は佐賀県（11.2％）、最下位は東京都（1.9％）、最大と最小の差は5.9倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
