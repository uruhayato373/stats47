import type { IndicatorSet } from "../indicator-set";

/**
 * 道路テーマ
 *
 * ストーリー軸:
 *  - 高速道路・国道・地方道の延長に見る都道府県の道路インフラ格差
 *  - 面積あたり道路密度（都市部の高密度 vs 地方の低密度）と舗装率
 *  - 交通量・道の駅など道路の利用・サービス面
 *
 * データ源: 社会・人口統計体系（道路実延長・舗装率・交通量）+ 国土数値情報（道の駅）
 * 旧 /maps/highway-timeline（高速道路時系列マップ）を 2026-05-28 に本テーマへ統合（301 redirect）。
 */
export const ROADS_SET: IndicatorSet = {
  key: "roads",
  title: "道路",
  description:
    "都道府県別の道路実延長（高速道路・国道・地方道・市町村道）・道路密度・舗装率・交通量を地図とランキングで比較。高速道路網の地域差や面積あたり道路密度の都市部集中、道の駅の整備状況を47都道府県のデータで読み解きます。",
  category: "economy",
  usage: "theme",
  metrics: [
    // 延長（種別）
    { rankingKey: "road-total-length-with-expressway", shortLabel: "道路実延長(高速含む)", role: "primary" },
    { rankingKey: "road-expressway-length", shortLabel: "高速道路延長", role: "primary" },
    { rankingKey: "road-total-length", shortLabel: "道路実延長", role: "secondary" },
    { rankingKey: "road-national-route-length", shortLabel: "一般国道延長", role: "secondary" },
    { rankingKey: "road-prefectural-route-length", shortLabel: "主要地方道延長", role: "secondary" },
    { rankingKey: "road-municipal-length", shortLabel: "市町村道延長", role: "context" },
    // 密度・品質
    { rankingKey: "road-length-per-km2", shortLabel: "道路密度", role: "secondary" },
    { rankingKey: "main-road-paving-rate", shortLabel: "主要道路舗装率", role: "secondary" },
    // 利用・サービス
    { rankingKey: "average-road-traffic-volume", shortLabel: "道路平均交通量", role: "secondary" },
    { rankingKey: "roadside-station-count", shortLabel: "道の駅数", role: "context" },
  ],
  keywords: ["道路", "高速道路", "国道", "県道", "舗装率", "交通量", "道の駅", "インフラ"],
  relatedArticleTagKeys: ["道路", "高速道路", "交通", "インフラ"],
};
