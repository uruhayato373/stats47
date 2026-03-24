import type { IndicatorSet } from "../indicator-set";

export const COMPARE_SALARY_SET: IndicatorSet = {
  key: "compare-salary",
  title: "給与・待遇比較",
  description: "公務員の平均給与・ボーナス・退職金等の待遇指標で2地域を比較",
  category: "finance",
  usage: "compare",
  indicators: [
    { rankingKey: "avg-salary-admin-prefecture", shortLabel: "一般行政職給与", role: "primary" },
    { rankingKey: "bonus-admin-prefecture", shortLabel: "期末手当", role: "secondary" },
    { rankingKey: "retirement-allowance-admin-prefecture", shortLabel: "退職金", role: "secondary" },
    { rankingKey: "laspeyres-index-prefecture", shortLabel: "ラスパイレス指数", role: "secondary" },
    { rankingKey: "overtime-pay-admin-prefecture", shortLabel: "時間外手当", role: "secondary" },
  ],
};
