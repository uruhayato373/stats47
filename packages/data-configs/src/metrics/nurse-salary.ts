import type { MetricConfig } from "../types";

export const nurseSalary: MetricConfig = {
  "key": "nurse-salary",
  "title": "看護師の給与",
  "subtitle": "看護師の所定内給与額",
  "unit": "千円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    "cdTab": "10",
    "cdCat01": "01",
    "cdCat02": "1133",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
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
  "seoTitle": "看護師の給与ランキング都道府県【2022年】｜1位東京都（359.8千円）",
  "seoDescription": "2022年の看護師の給与の都道府県別ランキング。1位東京都（359.8千円）、最下位鹿児島県（253.4千円）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
