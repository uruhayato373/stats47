import type { IndicatorSet } from "../indicator-set";

/**
 * 鉄道テーマ
 *
 * ストーリー軸:
 *  - JR・民鉄の輸送人員に見る都市圏集中（首都圏・関西圏 vs 地方）
 *  - 鉄道駅数・乗降客数の地域格差と、地方鉄道の縮小
 *  - 旅客中心の都市鉄道と、JR 貨物に残る物流機能
 *
 * データ源: 社会・人口統計体系（JR/民鉄輸送人員・JR貨物）+ 国土数値情報（駅数・乗降客数）
 * 鉄道は従来 metric 単体のみで route が無かったため、2026-05-28 に本テーマを新設。
 */
export const RAILWAY_SET: IndicatorSet = {
  key: "railway",
  title: "鉄道",
  description:
    "都道府県別の鉄道駅乗降客数・JR/民鉄輸送人員・鉄道駅数をランキングとチャートで比較。首都圏・関西圏への利用集中と地方鉄道の縮小、旅客輸送とJR貨物の役割を47都道府県のデータで読み解きます。",
  category: "economy",
  usage: "theme",
  metrics: [
    // 旅客輸送
    { rankingKey: "railway-passengers", shortLabel: "鉄道駅乗降客数", role: "primary" },
    { rankingKey: "jr-passenger-transport", shortLabel: "JR輸送人員", role: "primary" },
    { rankingKey: "private-railway-passenger-transport", shortLabel: "民鉄輸送人員", role: "secondary" },
    // インフラ
    { rankingKey: "railway-station-count", shortLabel: "鉄道駅数", role: "secondary" },
    // 貨物
    { rankingKey: "jr-freight-shipment", shortLabel: "JR貨物発送量", role: "context" },
  ],
  keywords: ["鉄道", "JR", "私鉄", "民鉄", "駅", "乗降客", "輸送人員", "鉄道貨物"],
  relatedArticleTagKeys: ["鉄道", "交通", "公共交通"],
};
