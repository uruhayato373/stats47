import type { MetricConfig } from "../types";

export const barrierFreeHousingRate: MetricConfig = {
  "key": "barrier-free-housing-rate",
  "title": "バリアフリー化住宅率",
  "subtitle": "高齢者等のための設備がある住宅の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021599",
    "cdCat01": "0",
    "cdCat02": "0",
    "cdCat03": "0",
    "axisRatio": {
      "axis": "cat04",
      "numeratorCodes": ["1"],
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
  "seoTitle": "バリアフリー化住宅率ランキング都道府県【2023年】｜1位島根県（63.3％）",
  "seoDescription": "2023年のバリアフリー化住宅率の都道府県別ランキング。1位島根県（63.3％）、最下位沖縄県（36.5％）で1.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
