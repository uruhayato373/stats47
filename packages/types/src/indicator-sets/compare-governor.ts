import type { IndicatorSet } from "../indicator-set";

export const COMPARE_GOVERNOR_SET: IndicatorSet = {
  key: "compare-governor",
  title: "知事給与比較",
  description: "知事給与・警察職給与・一般行政職給与等で2地域を比較",
  category: "finance",
  usage: "compare",
  indicators: [
    { rankingKey: "governor-salary-prefecture", shortLabel: "知事給与", role: "primary" },
    { rankingKey: "avg-salary-police-prefecture", shortLabel: "警察職給与", role: "secondary" },
    { rankingKey: "avg-salary-admin-prefecture", shortLabel: "一般行政職給与", role: "secondary" },
    { rankingKey: "bonus-admin-prefecture", shortLabel: "期末手当", role: "secondary" },
    { rankingKey: "retirement-allowance-admin-prefecture", shortLabel: "退職金", role: "secondary" },
  ],
};
