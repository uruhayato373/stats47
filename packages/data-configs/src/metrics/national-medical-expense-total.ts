import type { MetricConfig } from "../types";

export const nationalMedicalExpenseTotal: MetricConfig = {
  "key": "national-medical-expense-total",
  "title": "国民医療費",
  "subtitle": "総額",
  "unit": "億円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdCat01": "J4001",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "億円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "億円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "medical-expense",
  "seoTitle": "国民医療費ランキング都道府県【2022年】｜1位東京都（48,224億円）",
  "seoDescription": "2022年の国民医療費の都道府県別ランキング。1位東京都（48,224億円）、最下位鳥取県（2,082億円）で23.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
