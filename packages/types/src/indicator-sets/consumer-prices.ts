import type { IndicatorSet } from "../indicator-set";

export const CONSUMER_PRICES_SET: IndicatorSet = {
  key: "consumer-prices",
  title: "物価・消費",
  description:
    "都道府県別の消費者物価地域差指数を食料・住居・光熱水道など品目別に地図・チャート・ランキングで比較。物価プロファイル・ヒートマップで生活コストの地域差を47都道府県で確認できます。",
  category: "economy",
  usage: "theme",
  indicators: [
    // 総合
    { rankingKey: "consumer-price-difference-index-overall", shortLabel: "総合", role: "primary" },
    { rankingKey: "consumer-price-difference-index-overall-excl-rent", shortLabel: "家賃除く総合", role: "secondary" },
    // 生活費
    { rankingKey: "consumer-price-difference-index-food", shortLabel: "食料", role: "secondary" },
    { rankingKey: "consumer-price-difference-index-housing", shortLabel: "住居", role: "secondary" },
    { rankingKey: "consumer-price-difference-index-utilities", shortLabel: "光熱・水道", role: "secondary" },
    // その他
    { rankingKey: "consumer-price-difference-index-education", shortLabel: "教育", role: "context" },
    { rankingKey: "consumer-price-difference-index-culture-recreation", shortLabel: "教養娯楽", role: "context" },
    { rankingKey: "consumer-price-difference-index-transport-communication", shortLabel: "交通・通信", role: "context" },
    { rankingKey: "consumer-price-difference-index-healthcare", shortLabel: "保健医療", role: "context" },
    { rankingKey: "consumer-price-difference-index-clothing-footwear", shortLabel: "被服", role: "context" },
    { rankingKey: "consumer-price-difference-index-furniture-household", shortLabel: "家具", role: "context" },
    { rankingKey: "consumer-price-difference-index-miscellaneous", shortLabel: "諸雑費", role: "context" },
  ],
  panelTabs: [
    {
      label: "総合",
      rankingKeys: [
        "consumer-price-difference-index-overall",
        "consumer-price-difference-index-overall-excl-rent",
      ],
    },
    {
      label: "生活費",
      rankingKeys: [
        "consumer-price-difference-index-food",
        "consumer-price-difference-index-housing",
        "consumer-price-difference-index-utilities",
      ],
    },
    {
      label: "その他",
      rankingKeys: [
        "consumer-price-difference-index-education",
        "consumer-price-difference-index-culture-recreation",
        "consumer-price-difference-index-transport-communication",
        "consumer-price-difference-index-healthcare",
        "consumer-price-difference-index-clothing-footwear",
        "consumer-price-difference-index-furniture-household",
        "consumer-price-difference-index-miscellaneous",
      ],
    },
  ],
  keywords: [
    "消費者物価指数",
    "物価",
    "地域差指数",
    "生活コスト",
    "食費",
    "家賃",
    "都道府県",
    "ランキング",
  ],
};
