import type { IndicatorSet } from "../indicator-set";

export const CONSUMER_PRICES_SET: IndicatorSet = {
  key: "consumer-prices",
  title: "物価・消費",
  description:
    "都道府県別の消費者物価地域差指数を品目別に地図とランキングで比較。生活コストの地域差を47都道府県のデータで確認できます。",
  category: "economy",
  usage: "theme",
  indicators: [
    { rankingKey: "cpi-overall", shortLabel: "総合", role: "primary" },
    { rankingKey: "cpi-overall-excl-rent", shortLabel: "家賃除く総合", role: "secondary" },
  ],
  keywords: [
    "消費者物価指数",
    "物価",
    "地域差指数",
    "生活コスト",
    "都道府県",
    "ランキング",
  ],
};
