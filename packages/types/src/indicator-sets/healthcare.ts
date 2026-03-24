import type { IndicatorSet } from "../indicator-set";

export const HEALTHCARE_SET: IndicatorSet = {
  key: "healthcare",
  title: "医療・健康",
  description:
    "都道府県別の医師数・病院数・病床数・国民医療費を地図とランキングで比較。医療体制の地域差を47都道府県のデータで確認できます。",
  category: "welfare",
  usage: "theme",
  indicators: [
    // 医療供給
    { rankingKey: "physicians-in-medical-facilities-per-100k", shortLabel: "医師数", role: "primary" },
    { rankingKey: "nurses-in-medical-facilities-per-100k", shortLabel: "看護師数", role: "secondary" },
    { rankingKey: "general-hospital-count-per-100k", shortLabel: "病院数", role: "secondary" },
    { rankingKey: "general-hospital-bed-count-per-100k", shortLabel: "病床数", role: "context" },
    { rankingKey: "pharmacy-count-per-100k", shortLabel: "薬局数", role: "context" },
    // 医療利用
    { rankingKey: "national-medical-expense-per-person", shortLabel: "医療費", role: "secondary" },
    { rankingKey: "general-hospital-avg-length-of-stay", shortLabel: "平均在院日数", role: "context" },
    { rankingKey: "general-hospital-bed-occupancy-rate", shortLabel: "病床利用率", role: "context" },
    // 健康指標
    { rankingKey: "deaths-lifestyle-diseases-per-100k", shortLabel: "生活習慣病死亡", role: "secondary" },
    { rankingKey: "deaths-diabetes-per-100k", shortLabel: "糖尿病死亡", role: "context" },
    { rankingKey: "health-checkup-rate-lifestyle-diseases", shortLabel: "健診受診率", role: "secondary" },
    // 精神医療
    { rankingKey: "psychiatric-hospital-count-per-100k", shortLabel: "精神科病院数", role: "context" },
    { rankingKey: "treatment-rate-mood-disorder-outpatient", shortLabel: "気分障害受療率", role: "context" },
  ],
  keywords: [
    "医師数",
    "病院数",
    "医療費",
    "医療格差",
    "都道府県",
    "ランキング",
  ],
};
