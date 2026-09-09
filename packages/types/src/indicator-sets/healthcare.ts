// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/healthcare.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const HEALTHCARE_SET: IndicatorSet = {
  "key": "healthcare",
  "title": "医療・健康",
  "description": "都道府県別の医師数・病院数・病床数・国民医療費をランキングとチャートで比較。医療体制の地域差を47都道府県のデータで確認できます。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "physicians-in-medical-facilities-per-100k",
      "shortLabel": "医師（10万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "nurses-in-medical-facilities-per-100k",
      "shortLabel": "看護師・准看護師（10万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "general-hospital-count-per-100k",
      "shortLabel": "一般病院（10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-bed-count-per-100k",
      "shortLabel": "一般病院病床（10万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "pharmacy-count-per-100k",
      "shortLabel": "薬局数",
      "role": "context"
    },
    {
      "rankingKey": "national-medical-expense-per-person",
      "shortLabel": "1人当たり国民医療費",
      "role": "primary"
    },
    {
      "rankingKey": "general-hospital-avg-length-of-stay",
      "shortLabel": "一般病院の平均在院日数",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-bed-occupancy-rate",
      "shortLabel": "一般病院の病床利用率",
      "role": "secondary"
    },
    {
      "rankingKey": "deaths-lifestyle-diseases-per-100k",
      "shortLabel": "生活習慣病死亡",
      "role": "context"
    },
    {
      "rankingKey": "deaths-diabetes-per-100k",
      "shortLabel": "糖尿病死亡",
      "role": "context"
    },
    {
      "rankingKey": "deaths-malignant-neoplasms-per-100k",
      "shortLabel": "悪性新生物死亡",
      "role": "context"
    },
    {
      "rankingKey": "deaths-heart-disease-excl-hypertensive-per-100k",
      "shortLabel": "心疾患死亡",
      "role": "context"
    },
    {
      "rankingKey": "deaths-cerebrovascular-disease-per-100k",
      "shortLabel": "脳血管疾患死亡",
      "role": "context"
    },
    {
      "rankingKey": "deaths-hypertensive-diseases-per-100k",
      "shortLabel": "高血圧性疾患死亡",
      "role": "context"
    },
    {
      "rankingKey": "psychiatric-hospital-count-per-100k",
      "shortLabel": "精神科病院数",
      "role": "context"
    },
    {
      "rankingKey": "treatment-rate-mood-disorder-outpatient",
      "shortLabel": "気分障害受療率",
      "role": "context"
    }
  ],
  "keywords": [
    "医師数",
    "病院数",
    "医療費",
    "医療格差",
    "都道府県",
    "ランキング"
  ]
};
