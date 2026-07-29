import type { MetricConfig } from "../types";

export const startingSalaryUniversity: MetricConfig = {
  "key": "starting-salary-university",
  "title": "大卒初任給",
  "subtitle": "新規学卒者の所定内給与額（大学卒）",
  "unit": "千円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445959",
    "cdCat01": "01",
    "cdCat02": "06",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
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
    "minValueType": "data-min",
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
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "大卒初任給ランキング都道府県【2023年】｜1位秋田県（267.7千円）",
  "seoDescription": "2023年の大卒初任給の都道府県別ランキング。1位秋田県（267.7千円）、最下位鳥取県（202.4千円）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
