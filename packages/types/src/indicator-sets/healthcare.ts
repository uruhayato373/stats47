// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/healthcare.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const HEALTHCARE_SET: IndicatorSet = {
  "key": "healthcare",
  "title": "医療・健康",
  "description": "医療資源の供給、入院利用と費用、健康アウトカムの違いを順に把握する。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "physicians-in-medical-facilities-per-100k",
      "shortLabel": "医師数（人口10万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "nurses-in-medical-facilities-per-100k",
      "shortLabel": "看護師・准看護師数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-count-per-100k",
      "shortLabel": "一般病院数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-bed-count-per-100k",
      "shortLabel": "一般病院病床数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "pharmacy-count-per-100k",
      "shortLabel": "薬局数（人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "national-medical-expense-per-person",
      "shortLabel": "1人当たり国民医療費",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-avg-length-of-stay",
      "shortLabel": "一般病院の平均在院日数",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-bed-occupancy-rate",
      "shortLabel": "病床利用率",
      "role": "secondary"
    },
    {
      "rankingKey": "deaths-lifestyle-diseases-per-100k",
      "shortLabel": "生活習慣病死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-diabetes-per-100k",
      "shortLabel": "糖尿病死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-malignant-neoplasms-per-100k",
      "shortLabel": "悪性新生物死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-heart-disease-excl-hypertensive-per-100k",
      "shortLabel": "心疾患（高血圧性を除く）死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-cerebrovascular-disease-per-100k",
      "shortLabel": "脳血管疾患死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-hypertensive-diseases-per-100k",
      "shortLabel": "高血圧性疾患死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "psychiatric-hospital-count-per-100k",
      "shortLabel": "精神科病院数（人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "treatment-rate-mood-disorder-outpatient",
      "shortLabel": "気分障害の外来受療率（人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "healthy-life-expectancy-male",
      "shortLabel": "健康寿命（男性）",
      "role": "secondary"
    },
    {
      "rankingKey": "healthy-life-expectancy-female",
      "shortLabel": "健康寿命（女性）",
      "role": "secondary"
    },
    {
      "rankingKey": "ambulance-hospital-arrival-time",
      "shortLabel": "救急搬送の病院収容所要時間",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-emergency-dispatches-per-1000",
      "shortLabel": "救急出動件数",
      "role": "secondary"
    },
    {
      "rankingKey": "maternal-health-guidance-per-100-births",
      "shortLabel": "妊産婦保健指導数",
      "role": "secondary"
    },
    {
      "rankingKey": "home-care-worker-annual-income",
      "shortLabel": "訪問介護従事者平均年収",
      "role": "secondary"
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
