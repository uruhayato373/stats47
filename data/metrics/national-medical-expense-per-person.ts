import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

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
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "years": [
      1999,
      2002,
      2005,
      2008,
      2011,
      2014,
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
      2021,
      2022
    ]
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "1人当たりの国民医療費ランキング都道府県【2022年】｜1位高知県（479千円）",
  "seoDescription": "2022年の1人当たりの国民医療費の都道府県別ランキング。1位高知県（479千円）、最下位埼玉県（332千円）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
