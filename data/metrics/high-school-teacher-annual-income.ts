import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import { WAGE_STRUCTURE_COVERAGE_NOTE, WAGE_STRUCTURE_SAMPLE_COUNT } from "./defaults/wage-structure-coverage";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const highSchoolTeacherAnnualIncome: MetricConfig = {
  "key": "high-school-teacher-annual-income",
  "title": "高等学校教員の平均年収",
  "description": "高等学校教員の都道府県別平均年収。賃金構造基本統計調査に基づく。対象は一般労働者・男女計。",
  "note": WAGE_STRUCTURE_COVERAGE_NOTE,
  "unit": "万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    // e-Stat 原単位 千円 → config unit 万円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 千円 の値に 万円 のラベルが付いたまま配信される。
    "valueScale": 0.1,
    "tabCombination": [
      { "cdTab": "08,40", "factor": 12 },
      { "cdTab": "12,44", "factor": 1 },
    ],
    "sampleCount": WAGE_STRUCTURE_SAMPLE_COUNT,
    "cdCat01": "01",
    "cdCat02": "1194",
  },
  "entities": [
    "prefecture",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2020,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "display": {
    "decimalPlaces": 1,
    "displayUnit": "万円",
  },
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "万円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "万円/100km²",
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "isActive": true,
};
