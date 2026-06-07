import type { MetricConfig } from "../types";

export const dentistAnnualIncome: MetricConfig = {
  "key": "dentist-annual-income",
  "title": "歯科医師の平均年収",
  "unit": "万円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    "cdCat02": "1122",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
      2021,
      2023,
    ],
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
    "isCalculated": true,
    "formula": "monthly*12+bonus",
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "歯科医師の平均年収ランキング都道府県【2023年】｜1位三重県（4,118.9万円）",
  "seoDescription": "2023年の歯科医師の平均年収の都道府県別ランキング。1位三重県（4,118.9万円）、最下位新潟県（456.7万円）で9.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
