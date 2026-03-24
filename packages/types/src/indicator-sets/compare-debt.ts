import type { IndicatorSet } from "../indicator-set";

export const COMPARE_DEBT_SET: IndicatorSet = {
  key: "compare-debt",
  title: "債務比較",
  description: "将来負担比率・実質公債費比率等の債務指標で2地域を比較",
  category: "finance",
  usage: "compare",
  indicators: [
    { rankingKey: "future-burden-ratio", shortLabel: "将来負担比率", role: "primary" },
    { rankingKey: "real-public-debt-service-ratio", shortLabel: "実質公債費比率", role: "secondary" },
    { rankingKey: "current-balance-ratio", shortLabel: "経常収支比率", role: "secondary" },
    { rankingKey: "welfare-expenditure-ratio-pref-finance", shortLabel: "民生費率", role: "secondary" },
    { rankingKey: "fiscal-strength-index-prefecture", shortLabel: "財政力指数", role: "secondary" },
  ],
};
