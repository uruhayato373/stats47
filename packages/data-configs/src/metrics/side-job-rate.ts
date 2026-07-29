import type { MetricConfig } from "../types";

export const sideJobRate: MetricConfig = {
  "key": "side-job-rate",
  "title": "副業率",
  "subtitle": "有業者のうち副業がある人の割合",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008468",
    "cdCat01": "0",
    "cdCat02": "1",
    "displayName": "就業構造基本調査",
    "url": "https://www.stat.go.jp/data/shugyou/2022/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
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
  "seoTitle": "副業率ランキング都道府県【2022年】｜1位京都府（7.8％）",
  "seoDescription": "2022年の副業率の都道府県別ランキング。1位京都府（7.8％）、最下位宮崎県（3.4％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
