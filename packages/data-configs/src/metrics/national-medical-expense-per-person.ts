import type { MetricConfig } from "../types";

export const nationalMedicalExpensePerPerson: MetricConfig = {
  "key": "national-medical-expense-per-person",
  "title": "1人当たりの国民医療費",
  "description": "当該年度の国民医療費を同年度の総人口で割った、人口1人当たりの医療費。",
  "note": "国民医療費は保険診療の対象となり得る傷病の治療費の推計で、2000年度以降は介護保険へ移行した費用を含まない。",
  "unit": "千円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I15106",
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
  "seoTitle": "1人当たりの国民医療費ランキング都道府県【2022年】｜1位高知県（479千円）",
  "seoDescription": "2022年の1人当たりの国民医療費の都道府県別ランキング。1位高知県（479千円）、最下位埼玉県（332千円）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
