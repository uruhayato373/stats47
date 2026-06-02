import type { MetricConfig } from "../types";

export const japanHealthInsuranceSocietyMedicalExpenseDependentsPerPerson: MetricConfig = {
  "key": "japan-health-insurance-society-medical-expense-dependents-per-person",
  "title": "全国保険協会管掌健康保険医療費",
  "subtitle": "被扶養者1人当たり",
  "unit": "円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I1520502",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
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
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "全国保険協会管掌健康保険医療費ランキング都道府県【2023年】｜1位徳島県（224,281円）",
  "seoDescription": "2023年の全国保険協会管掌健康保険医療費の都道府県別ランキング。1位徳島県（224,281円）、最下位沖縄県（175,449円）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
