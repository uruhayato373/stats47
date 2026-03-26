import type { IndicatorSet } from "../indicator-set";

export const COMPARE_PRIVATE_WAGE_SET: IndicatorSet = {
  key: "compare-private-wage",
  title: "民間賃金・収入比較",
  description:
    "民間の所定内給与・初任給・男女格差・パート時給・可処分所得で2地域の待遇を比較",
  category: "economy",
  usage: "compare",
  indicators: [
    { rankingKey: "disposable-income-worker-households", shortLabel: "可処分所得", role: "primary" },
    { rankingKey: "scheduled-salary-male", shortLabel: "所定内給与(男)", role: "secondary" },
    { rankingKey: "gender-wage-gap", shortLabel: "男女賃金格差", role: "secondary" },
    { rankingKey: "minimum-wage-by-region", shortLabel: "最低賃金", role: "secondary" },
    { rankingKey: "starting-salary-university", shortLabel: "大卒初任給", role: "secondary" },
    { rankingKey: "starting-salary-highschool", shortLabel: "高卒初任給", role: "context" },
    { rankingKey: "male-part-time-hourly-wage", shortLabel: "パート時給(男)", role: "context" },
    { rankingKey: "female-part-time-hourly-wage", shortLabel: "パート時給(女)", role: "context" },
    { rankingKey: "consumer-price-difference-index-overall", shortLabel: "物価指数", role: "context" },
  ],
};
