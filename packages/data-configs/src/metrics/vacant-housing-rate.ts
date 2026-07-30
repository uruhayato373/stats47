import type { MetricConfig } from "../types";

export const vacantHousingRate: MetricConfig = {
  "key": "vacant-housing-rate",
  "title": "空き家率",
  "subtitle": "総住宅数に占める空き家の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021440",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["22"],
      "denominatorCodes": ["0"],
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
  "seoTitle": "空き家率ランキング｜なぜ徳島が全国1位?埼玉と2.3倍差【2023】",
  "seoDescription": "全国で空き家が増える中、なぜ徳島県が21.3％で全国1位なのか──最下位の埼玉県9.3％とは2.3倍の差があります。西日本で高くなる背景と47都道府県の分布を2023年データで可視化します。",
  "isActive": true,
};
