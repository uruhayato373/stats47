import type { MetricConfig } from "../types";

export const nationalMedicalExpenseInpatient: MetricConfig = {
  "key": "national-medical-expense-inpatient",
  "title": "国民医療費",
  "subtitle": "医科診療・入院",
  "description": "国民医療費のうち、医科診療医療費に分類される入院分の都道府県別推計額。",
  "note": "歯科診療医療費、薬局調剤医療費、入院時食事・生活医療費、訪問看護医療費などは含まない。",
  "unit": "億円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdCat01": "J4005",
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
  "isActive": true,
};
