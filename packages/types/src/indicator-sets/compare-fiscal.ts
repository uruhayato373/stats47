import type { IndicatorSet } from "../indicator-set";

export const COMPARE_FISCAL_SET: IndicatorSet = {
  key: "compare-fiscal",
  title: "地方財政比較",
  description: "財政力指数・経常収支比率等の財政健全性指標で2地域を比較",
  category: "finance",
  usage: "compare",
  indicators: [
    { rankingKey: "fiscal-strength-index-prefecture", shortLabel: "財政力指数", role: "primary" },
    { rankingKey: "current-balance-ratio", shortLabel: "経常収支比率", role: "secondary" },
    { rankingKey: "real-public-debt-service-ratio", shortLabel: "実質公債費比率", role: "secondary" },
    { rankingKey: "future-burden-ratio", shortLabel: "将来負担比率", role: "secondary" },
    { rankingKey: "local-tax-ratio-pref-finance", shortLabel: "地方税割合", role: "secondary" },
  ],
};
