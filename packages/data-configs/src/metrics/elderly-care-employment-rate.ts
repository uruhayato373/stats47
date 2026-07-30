import type { MetricConfig } from "../types";

export const elderlyCareEmploymentRate: MetricConfig = {
  "key": "elderly-care-employment-rate",
  "title": "介護をしている人の就業率",
  "subtitle": "介護をしている15歳以上人口のうち有業者の割合",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008584",
    "cdCat01": "0",
    "cdCat02": "00",
    "cdCat03": "1",
    "axisRatio": {
      "axis": "cat04",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
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
  "seoTitle": "介護をしている人の就業率ランキング都道府県【2022年】｜1位福井県（63.4％）",
  "seoDescription": "2022年の介護をしている人の就業率の都道府県別ランキング。1位福井県（63.4％）、最下位奈良県（52.5％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
