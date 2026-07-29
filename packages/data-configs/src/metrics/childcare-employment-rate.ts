import type { MetricConfig } from "../types";

export const childcareEmploymentRate: MetricConfig = {
  "key": "childcare-employment-rate",
  "title": "育児をしている人の就業率",
  "subtitle": "育児をしている15歳以上人口のうち有業者の割合",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008577",
    "cdCat01": "0",
    "cdCat02": "0",
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
  "seoTitle": "育児をしている人の就業率ランキング都道府県【2022年】｜1位鳥取県（93.4％）",
  "seoDescription": "2022年の育児をしている人の就業率の都道府県別ランキング。1位鳥取県（93.4％）、最下位愛知県（82％）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
