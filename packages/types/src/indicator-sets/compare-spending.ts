import type { IndicatorSet } from "../indicator-set";

export const COMPARE_SPENDING_SET: IndicatorSet = {
  key: "compare-spending",
  title: "歳出構造比較",
  description: "住民一人あたり教育費・福祉費等の歳出構造で2地域を比較",
  category: "finance",
  usage: "compare",
  indicators: [
    { rankingKey: "per-capita-education-expenditure-pref-municipal", shortLabel: "教育費/人", role: "primary" },
    { rankingKey: "per-capita-welfare-expenditure-pref-municipal", shortLabel: "民生費/人", role: "secondary" },
    { rankingKey: "personnel-expenditure-ratio-pref-finance", shortLabel: "人件費率", role: "secondary" },
    { rankingKey: "welfare-expenditure-ratio-pref-finance", shortLabel: "民生費率", role: "secondary" },
    { rankingKey: "fiscal-strength-index-prefecture", shortLabel: "財政力指数", role: "secondary" },
  ],
};
