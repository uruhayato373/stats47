import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import { WAGE_STRUCTURE_COVERAGE_NOTE, WAGE_STRUCTURE_SAMPLE_COUNT } from "./defaults/wage-structure-coverage";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const carpenterAnnualIncome: MetricConfig = {
  "key": "carpenter-annual-income",
  "title": "大工の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計の大工について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": `自営業者の所得統計ではなく、雇用される一般労働者の賃金統計。6月の月例給与を年換算した税・社会保険料等控除前の標本平均で、個人の実年収ではない。${WAGE_STRUCTURE_COVERAGE_NOTE}`,
  "unit": "万円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    // e-Stat 原単位 千円 → config unit 万円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 千円 の値に 万円 のラベルが付いたまま配信される。
    "valueScale": 0.1,
    "cdCat01": "01",
    "cdCat02": "1661",
    "tabCombination": [
      { "cdTab": "08,40", "factor": 12 },
      { "cdTab": "12,44", "factor": 1 },
    ],
    "sampleCount": WAGE_STRUCTURE_SAMPLE_COUNT,
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "万円/10万人",
        "decimalPlaces": 2,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "万円/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
