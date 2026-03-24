import type { IndicatorSet } from "../indicator-set";

export const TOURISM_SET: IndicatorSet = {
  key: "tourism",
  title: "観光",
  description:
    "都道府県別の宿泊者数・外国人宿泊者数・客室稼働率を地図とランキングで比較。観光需要の地域差を47都道府県のデータで確認できます。",
  category: "tourism",
  usage: "theme",
  indicators: [
    // 宿泊
    { rankingKey: "total-overnight-guests", shortLabel: "宿泊者数", role: "primary" },
    { rankingKey: "total-overnight-guests-foreign", shortLabel: "外国人宿泊", role: "secondary" },
    { rankingKey: "room-utilization-rate", shortLabel: "客室稼働率", role: "secondary" },
    // 旅行行動
    { rankingKey: "travel-participation-rate-domestic-tourism", shortLabel: "国内旅行率", role: "secondary" },
    { rankingKey: "travel-participation-rate-overseas", shortLabel: "海外旅行率", role: "context" },
    { rankingKey: "travel-participation-rate-overnight", shortLabel: "宿泊旅行率", role: "context" },
    { rankingKey: "travel-participation-rate-day-trip", shortLabel: "日帰り旅行率", role: "context" },
    // 交通
    { rankingKey: "air-passenger-transport", shortLabel: "航空旅客", role: "secondary" },
    { rankingKey: "jr-passenger-transport", shortLabel: "JR旅客", role: "context" },
    // 施設
    { rankingKey: "number-of-simple-lodging-facilities", shortLabel: "簡易宿所数", role: "context" },
  ],
  keywords: [
    "観光",
    "宿泊者数",
    "インバウンド",
    "客室稼働率",
    "都道府県",
    "ランキング",
  ],
};
