import type { MetricConfig } from "../types";

export const startingSalaryHighschool: MetricConfig = {
  "key": "starting-salary-highschool",
  "title": "高卒初任給",
  "subtitle": "新規学卒者の所定内給与額（高校卒）",
  "unit": "千円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445959",
    "cdCat01": "01",
    "cdCat02": "03",
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "千円/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "高卒初任給1位は三重20.8万円、沖縄16.5万円との1.3倍差｜47都道府県2023",
  "seoDescription": "高校新卒の初任給は1位三重県(207.6千円)、最下位沖縄県(164.9千円)で1.3倍の地域差。47都道府県を地図とグラフで比較する2023年最新ランキング。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
